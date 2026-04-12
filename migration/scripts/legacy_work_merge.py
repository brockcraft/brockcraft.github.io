#!/usr/bin/env python3
"""
Merge legacy-ia-outline.json: combine /work stacked copy with per-project pages,
write legacy-work-merged.json + LEGACY_IMPORT_CHECKLIST.md.

If the outline has no /work page, fetches https://www.brockcraft.com/work/ once.

Requires: pip install -r migration/scripts/requirements-ia.txt

Typical flow (after IA extract):
  python3 migration/scripts/legacy_work_merge.py \\
    --asset-map migration/asset-url-map.json

Then (optional) push to Notion:
  npx tsx scripts/notion-import-legacy.ts --apply
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

_HERE = Path(__file__).resolve().parent


def _load_legacy_ia():
    spec = importlib.util.spec_from_file_location(
        "legacy_ia_extract", _HERE / "legacy_ia_extract.py"
    )
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(mod)
    return mod


def norm_key(path_or_url: str) -> str:
    p = (path_or_url or "").strip()
    if not p.startswith("/"):
        p = "/" + p
    p = p.rstrip("/") or "/"
    return p.lower()


def flatten_detail(page: dict) -> tuple[list[str], list[dict], list[dict]]:
    paras: list[str] = []
    imgs: list[dict] = []
    embeds: list[dict] = []

    for gp in page.get("gallery_projects") or []:
        paras.extend(gp.get("paragraphs") or [])
        imgs.extend(gp.get("images") or [])
        embeds.extend(gp.get("embeds") or [])

    for sec in page.get("sections") or []:
        paras.extend(sec.get("paragraphs") or [])
        imgs.extend(sec.get("images") or [])
        hx = (sec.get("html_excerpt") or "").strip()
        if len(hx) > 30:
            paras.append(hx)

    seen: set[str] = set()
    out_imgs: list[dict] = []
    for im in imgs:
        u = im.get("url")
        if u and u not in seen:
            seen.add(u)
            out_imgs.append(im)

    return paras, out_imgs, embeds


def pick_title(
    work_gp: dict | None, detail_page: dict, slug: str
) -> str:
    if work_gp and (work_gp.get("title") or "").strip():
        return work_gp["title"].strip()
    gps = detail_page.get("gallery_projects") or []
    if gps and (gps[0].get("title") or "").strip():
        return gps[0]["title"].strip()
    t = (detail_page.get("document_title") or "").strip()
    for sep in ("\u2014", "\u2013", " - ", " | "):
        if sep in t:
            return t.split(sep, 1)[0].strip()
    return t or slug.replace("-", " ").title()


def merge_images(work_imgs: list[dict], detail_imgs: list[dict]) -> list[dict]:
    """Prefer the longer gallery; if both non-empty and different lengths, detail first then work-only URLs."""
    if len(detail_imgs) >= len(work_imgs):
        primary, secondary = detail_imgs, work_imgs
    else:
        primary, secondary = work_imgs, detail_imgs
    seen: set[str] = set()
    out: list[dict] = []
    for im in primary + secondary:
        u = im.get("url")
        if u and u not in seen:
            seen.add(u)
            out.append(im)
    return out


def cover_url(images: list[dict], site_origin: str) -> str | None:
    for im in images:
        lp = im.get("local_web_path")
        if isinstance(lp, str) and lp.startswith("/"):
            return site_origin.rstrip("/") + lp
    if images:
        return images[0].get("url")
    return None


def build_body(work_paras: list[str], detail_paras: list[str]) -> str:
    parts: list[str] = []
    if work_paras:
        parts.extend(work_paras)
    for dp in detail_paras:
        if not dp:
            continue
        if work_paras and any(dp in wp or wp in dp for wp in work_paras if len(wp) > 40):
            if dp not in parts:
                parts.append(dp)
        elif dp not in parts:
            parts.append(dp)
    return "\n\n".join(parts)


def summary_from(work_paras: list[str], detail_paras: list[str]) -> str:
    for src in (work_paras, detail_paras):
        for p in src:
            if len(p.strip()) > 40:
                return p.strip()[:480]
    return ""


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--outline",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "legacy-ia-outline.json",
    )
    ap.add_argument(
        "--asset-map",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "asset-url-map.json",
    )
    ap.add_argument(
        "--out-merged",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "legacy-work-merged.json",
    )
    ap.add_argument(
        "--out-checklist",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "LEGACY_IMPORT_CHECKLIST.md",
    )
    ap.add_argument(
        "--site-origin",
        default="https://brockcraft.github.io",
        help="Origin for local_web_path cover URLs (default: GitHub Pages site)",
    )
    args = ap.parse_args()

    if not args.outline.is_file():
        print(f"Missing {args.outline}. Run legacy_ia_extract.py first.", file=sys.stderr)
        return 2

    outline = json.loads(args.outline.read_text(encoding="utf-8"))
    base = (outline.get("base_url") or "https://www.brockcraft.com").rstrip("/")

    _ia = _load_legacy_ia()
    fetch = _ia.fetch
    parse_page = _ia.parse_page
    load_asset_map = _ia.load_asset_map
    normalize_path = _ia.normalize_path

    asset_by_url = load_asset_map(args.asset_map if args.asset_map.is_file() else None)

    pages = outline.get("pages") or []
    pages_by_path = {normalize_path(p["path"]): p for p in pages}

    work_page = pages_by_path.get("/work")
    if not work_page:
        try:
            html = fetch(urljoin(base + "/", "work") + "/")
            work_page = parse_page("/work", html, asset_by_url)
            work_page["path"] = "/work"
            work_page["fetched_url"] = urljoin(base + "/", "work/")
        except Exception as e:
            print(f"Warning: could not fetch /work ({e}); merge uses detail pages only.", file=sys.stderr)
            work_page = {"gallery_projects": [], "mode": "missing"}

    work_by_key: dict[str, dict] = {}
    for gp in work_page.get("gallery_projects") or []:
        u = gp.get("legacy_item_url") or ""
        work_by_key[norm_key(u)] = gp

    path_set: set[str] = set()
    for p in outline.get("discovered_from_work") or []:
        path_set.add(normalize_path(p))
    for p in pages:
        path_set.add(normalize_path(p["path"]))
    path_set.discard("/work")

    items: list[dict] = []
    for path in sorted(path_set):
        detail = pages_by_path.get(path)
        if not detail:
            items.append(
                {
                    "slug": path.strip("/").split("/")[-1],
                    "title": path,
                    "summary": "",
                    "body_markdown": "",
                    "cover_url": None,
                    "tags": ["Legacy"],
                    "images": [],
                    "embeds": [],
                    "legacy_paths": {"detail": None, "work_stack": path in work_by_key},
                    "merge_notes": ["No detail page in outline; re-run IA extract including this path."],
                }
            )
            continue

        key = norm_key(path)
        wg = work_by_key.get(key)
        w_paras = (wg or {}).get("paragraphs") or []
        w_imgs = list((wg or {}).get("images") or [])
        w_embeds = list((wg or {}).get("embeds") or [])

        d_paras, d_imgs, d_embeds = flatten_detail(detail)
        images = merge_images(w_imgs, d_imgs)
        embeds = list(w_embeds)
        for e in d_embeds:
            if e not in embeds:
                embeds.append(e)

        slug = path.strip("/").split("/")[-1] or "untitled"
        title = pick_title(wg, detail, slug)
        body = build_body(w_paras, d_paras)
        summary = summary_from(w_paras, d_paras)

        notes: list[str] = []
        if not w_paras and d_paras:
            notes.append("Copy from detail page only (/work block missing or empty for this slug).")
        if not images:
            notes.append("No images found in merge.")

        items.append(
            {
                "slug": slug,
                "title": title,
                "summary": summary,
                "body_markdown": body,
                "cover_url": cover_url(images, args.site_origin),
                "tags": ["Legacy"],
                "images": images,
                "embeds": embeds,
                "legacy_paths": {
                    "detail": path,
                    "work_stack": bool(wg),
                },
                "merge_notes": notes,
            }
        )

    merged = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_outline": str(args.outline),
        "work_fetched_inline": work_page.get("mode") != "missing"
        and "/work" not in pages_by_path,
        "items": items,
    }
    args.out_merged.parent.mkdir(parents=True, exist_ok=True)
    args.out_merged.write_text(json.dumps(merged, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Legacy → Notion import checklist",
        "",
        f"_Generated {merged['generated_at']}_",
        "",
        "## Pipeline",
        "",
        "- [x] `legacy-ia-outline.json` loaded",
        f"- [{'x' if merged['work_fetched_inline'] or '/work' in pages_by_path else ' '}] `/work` data available (stacked copy)",
        "- [x] `legacy-work-merged.json` written",
        "- [ ] `npx tsx scripts/notion-import-legacy.ts --apply` (dry-run until you pass `--apply`)",
        "- [ ] Deploy site or run work index emit after Notion shows rows",
        "",
        "## Per project",
        "",
        "| Slug | Title | Images | Summary (chars) | Work stack | Notes |",
        "|------|-------|--------|-----------------|------------|-------|",
    ]
    for it in items:
        n = "| ".join(it.get("merge_notes") or []) or "—"
        lines.append(
            f"| `{it['slug']}` | {it['title'][:40]}{'…' if len(it['title']) > 40 else ''} "
            f"| {len(it.get('images') or [])} | {len(it.get('summary') or '')} "
            f"| {it.get('legacy_paths', {}).get('work_stack')} | {n[:60]} |"
        )
    lines.append("")
    args.out_checklist.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"Wrote {args.out_merged} ({len(items)} items)", file=sys.stderr)
    print(f"Wrote {args.out_checklist}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
