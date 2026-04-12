#!/usr/bin/env python3
"""
Extract legacy information architecture from the Squarespace site by fetching
server-rendered HTML and parsing structure: project titles, copy, gallery images,
and embeds. Use this as a migration aid for Notion / the new Astro site.

The old index (e.g. /work or a stacked project URL) uses div.project.gallery-project
blocks. Standalone pages use standard Squarespace sqs-block-* markup.

Requires:
  pip install -r migration/scripts/requirements-ia.txt

Examples:
  python3 migration/scripts/legacy_ia_extract.py \\
    --discover-work --asset-map migration/asset-url-map.json \\
    --out migration/legacy-ia-outline.json

  python3 migration/scripts/legacy_ia_extract.py \\
    --paths /work,/the-inner-ear-project \\
    --asset-map migration/asset-url-map.json \\
    --out migration/legacy-ia-outline.json

  python3 migration/scripts/legacy_ia_extract.py \\
    --use-inventory --asset-map migration/asset-url-map.json \\
    --out migration/legacy-ia-outline.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

try:
    from bs4 import BeautifulSoup, Tag
except ImportError:
    print(
        "Missing beautifulsoup4. Run:\n"
        "  pip install -r migration/scripts/requirements-ia.txt",
        file=sys.stderr,
    )
    raise SystemExit(1) from None

USER_AGENT = "brockcraft-legacy-ia-extract/1.0 (owned site migration)"


def fetch(url: str, timeout: int = 45) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="replace")


def normalize_path(path: str) -> str:
    p = path.strip()
    if not p.startswith("/"):
        p = "/" + p
    if len(p) > 1 and p.endswith("/"):
        p = p.rstrip("/")
    return p or "/"


def img_url_from_tag(img: Tag) -> str | None:
    for attr in ("data-image", "data-src", "src"):
        v = img.get(attr)
        if v and "images.squarespace-cdn.com" in v:
            return v.split("?", 1)[0]
    return None


def inside_project_thumb_grid(tag: Tag) -> bool:
    for p in tag.parents:
        if not isinstance(p, Tag):
            continue
        cls = p.get("class") or []
        if "project-image" in cls:
            return True
        if p.get("id") == "tinyThumbControls":
            return True
        if "tiny-thumb" in cls:
            return True
    return False


def load_asset_map(path: Path | None) -> dict[str, str]:
    if not path or not path.is_file():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    out: dict[str, str] = {}
    for row in data.get("entries", []):
        orig = row.get("original")
        local = row.get("local_web_path")
        if isinstance(orig, str) and isinstance(local, str):
            out[orig.split("?", 1)[0]] = local
    return out


def enrich_image(url: str, asset_by_url: dict[str, str]) -> dict[str, str | None]:
    base = url.split("?", 1)[0]
    return {
        "url": url,
        "local_web_path": asset_by_url.get(base),
    }


def extract_vimeo_from_data_html(data_html: str | None) -> list[str]:
    if not data_html:
        return []
    urls: list[str] = []
    for m in re.finditer(
        r'src="(//player\.vimeo\.com/video/\d+[^"]*)', data_html
    ):
        u = m.group(1).strip()
        if u.startswith("//"):
            u = "https:" + u
        urls.append(u.split("?", 1)[0])
    return urls


def extract_gallery_projects(
    soup: BeautifulSoup, asset_by_url: dict[str, str]
) -> list[dict[str, object]]:
    root = soup.select_one("#projectPages")
    if not root:
        return []

    projects: list[dict[str, object]] = []
    for div in root.select("div.project.gallery-project"):
        data_url = (div.get("data-url") or "").strip()
        h2 = div.select_one("h2.project-title")
        title = h2.get_text(" ", strip=True) if h2 else ""

        paras: list[str] = []
        for p in div.select("div.project-description p"):
            t = p.get_text(" ", strip=True)
            if t:
                paras.append(t)

        images: list[dict[str, str | None]] = []
        embeds: list[dict[str, str]] = []

        for img in div.select("div.image-list img"):
            if inside_project_thumb_grid(img):
                continue
            u = img_url_from_tag(img)
            if u and u not in [x["url"] for x in images]:
                images.append(enrich_image(u, asset_by_url))

        for wrap in div.select("div.image-list div.sqs-video-wrapper"):
            for v in extract_vimeo_from_data_html(wrap.get("data-html")):
                embeds.append({"type": "vimeo", "src": v})

        image_meta: list[dict[str, str]] = []
        for meta in div.select("div.image-list div.image-meta"):
            cap_title = meta.select_one(".image-title")
            cap_desc = meta.select_one(".image-desc")
            if cap_title or cap_desc:
                image_meta.append(
                    {
                        "title": cap_title.get_text(" ", strip=True)
                        if cap_title
                        else "",
                        "description": cap_desc.get_text(" ", strip=True)
                        if cap_desc
                        else "",
                    }
                )

        if not title and not paras and not images and not embeds:
            continue

        projects.append(
            {
                "legacy_item_url": data_url,
                "title": title,
                "paragraphs": paras,
                "images": images,
                "embeds": embeds,
                "image_captions": image_meta,
            }
        )
    return projects


def extract_slideshow_gallery(
    soup: BeautifulSoup, asset_by_url: dict[str, str]
) -> dict[str, object] | None:
    """Single-project gallery pages (#slideshow / #galleryWrapper), e.g. /the-inner-ear-project/."""
    root = soup.select_one("#slideshow")
    if not root:
        return None
    images: list[dict[str, str | None]] = []
    seen: set[str] = set()
    for slide in root.select("div.slide"):
        for img in slide.find_all("img"):
            u = img_url_from_tag(img)
            if u and u not in seen:
                seen.add(u)
                images.append(enrich_image(u, asset_by_url))
    if not images:
        return None
    title = ""
    for h1 in soup.select("section#page h1"):
        cls = h1.get("class") or []
        if "logo" in cls:
            continue
        title = h1.get_text(" ", strip=True)
        break
    if not title:
        pt = page_title(soup)
        for sep in ("\u2014", "\u2013", " - ", " | "):
            if sep in pt:
                title = pt.split(sep, 1)[0].strip()
                break
        else:
            title = pt
    return {
        "title": title,
        "paragraphs": [],
        "images": images,
        "embeds": [],
        "image_captions": [],
    }


def extract_sqs_flow(
    soup: BeautifulSoup, asset_by_url: dict[str, str]
) -> list[dict[str, object]]:
    """Ordered sections from Squarespace blocks when no gallery stack."""
    main = soup.select_one("section#page") or soup.select_one("#content") or soup.body
    if not main:
        return []

    sections: list[dict[str, object]] = []
    current: dict[str, object] = {
        "heading": None,
        "paragraphs": [],
        "images": [],
        "html_excerpt": "",
    }

    def flush() -> None:
        nonlocal current
        if (
            current["heading"]
            or current["paragraphs"]
            or current["images"]
            or current["html_excerpt"]
        ):
            sections.append(current)
        current = {
            "heading": None,
            "paragraphs": [],
            "images": [],
            "html_excerpt": "",
        }

    for el in main.find_all(
        ["h1", "h2", "h3", "p", "img", "div"], recursive=True
    ):
        if not isinstance(el, Tag):
            continue
        if inside_project_thumb_grid(el):
            continue

        if el.name in ("h1", "h2", "h3"):
            flush()
            current["heading"] = el.get_text(" ", strip=True)
            continue

        if el.name == "p" and "sqs-block-content" in (el.parent.get("class") or []):
            t = el.get_text(" ", strip=True)
            if len(t) > 12:
                current["paragraphs"].append(t)
            continue

        if el.name == "img":
            u = img_url_from_tag(el)
            if u:
                lst = current["images"]
                assert isinstance(lst, list)
                if u not in [x["url"] for x in lst]:
                    lst.append(enrich_image(u, asset_by_url))
            continue

        classes = " ".join(el.get("class") or [])
        if el.name == "div" and "sqs-block-html" in classes:
            inner = el.select_one(".sqs-block-content")
            if inner:
                text = inner.get_text(" ", strip=True)
                if len(text) > 40:
                    ex = current["html_excerpt"]
                    assert isinstance(ex, str)
                    current["html_excerpt"] = (ex + "\n\n" + text).strip()

    flush()
    return [s for s in sections if any(s[k] for k in s)]


def discover_project_paths_from_work(html: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    paths: list[str] = []
    for div in soup.select("div.project[data-url]"):
        u = (div.get("data-url") or "").strip()
        if u.startswith("/") and len(u) > 1:
            paths.append(normalize_path(u))
    seen: set[str] = set()
    out: list[str] = []
    for p in paths:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out


def page_title(soup: BeautifulSoup) -> str:
    t = soup.find("title")
    return t.get_text(strip=True) if t else ""


def parse_page(
    path: str,
    html: str,
    asset_by_url: dict[str, str],
) -> dict[str, object]:
    soup = BeautifulSoup(html, "html.parser")
    doc_title = page_title(soup)
    gallery = extract_gallery_projects(soup, asset_by_url)
    slideshow = extract_slideshow_gallery(soup, asset_by_url)
    sqs_sections: list[dict[str, object]] = []

    if gallery:
        mode = "gallery_stack"
    elif slideshow:
        mode = "slideshow_gallery"
        gallery = [slideshow]
    else:
        mode = "sqs_or_generic"
        sqs_sections = extract_sqs_flow(soup, asset_by_url)

    return {
        "path": normalize_path(path),
        "document_title": doc_title,
        "mode": mode,
        "gallery_projects": gallery,
        "sections": sqs_sections,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--base",
        default="https://www.brockcraft.com",
        help="Site origin (default: production)",
    )
    parser.add_argument(
        "--inventory",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "inventory.json",
        help="inventory.json used only with --use-inventory (see --paths)",
    )
    parser.add_argument(
        "--use-inventory",
        action="store_true",
        help="Merge page_paths from --inventory into the crawl list",
    )
    parser.add_argument(
        "--discover-work",
        action="store_true",
        help="Fetch /work and add all div.project[data-url] paths to the crawl set",
    )
    parser.add_argument(
        "--paths",
        default="",
        help="Comma-separated paths (e.g. /the-inner-ear-project,/about)",
    )
    parser.add_argument(
        "--asset-map",
        type=Path,
        default=None,
        help="Optional asset-url-map.json to attach local_web_path for CDN images",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "legacy-ia-outline.json",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=0,
        help="Limit number of paths (0 = no limit)",
    )
    args = parser.parse_args()
    base = args.base.rstrip("/")

    paths: list[str] = []
    if args.paths.strip():
        paths.extend(
            normalize_path(p) for p in args.paths.split(",") if p.strip()
        )
    elif args.use_inventory and args.inventory.is_file():
        inv = json.loads(args.inventory.read_text(encoding="utf-8"))
        paths.extend(normalize_path(p) for p in inv.get("page_paths", []))

    work_html_cached: str | None = None
    if args.discover_work:
        work_html_cached = fetch(f"{base}/work")
        paths.extend(discover_project_paths_from_work(work_html_cached))

    if not paths:
        print(
            "No paths to crawl. Pass --paths, --discover-work, and/or --use-inventory.",
            file=sys.stderr,
        )
        return 2

    discovered = (
        discover_project_paths_from_work(work_html_cached)
        if work_html_cached
        else []
    )

    # de-dupe preserving order
    seen: set[str] = set()
    uniq: list[str] = []
    for p in paths:
        if p not in seen:
            seen.add(p)
            uniq.append(p)

    if args.max_pages > 0:
        uniq = uniq[: args.max_pages]

    asset_by_url = load_asset_map(args.asset_map)

    pages_out: list[dict[str, object]] = []

    for path in uniq:
        url = urljoin(base + "/", path.lstrip("/"))
        if not urlparse(url).path.endswith("/"):
            trial = url + "/"
        else:
            trial = url
        try:
            html = fetch(trial)
        except Exception as e:
            pages_out.append(
                {
                    "path": path,
                    "error": str(e),
                    "fetched_url": trial,
                }
            )
            continue
        parsed = parse_page(path, html, asset_by_url)
        parsed["fetched_url"] = trial
        pages_out.append(parsed)

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "base_url": base,
        "paths_crawled": uniq,
        "discovered_from_work": discovered,
        "pages": pages_out,
        "notes": [
            "gallery_stack: /work index — div.project.gallery-project under #projectPages (stacked projects + image-list).",
            "slideshow_gallery: standalone gallery pages — #slideshow .slide images (excludes tiny-thumb controls).",
            "sqs_or_generic: headings + sqs html blocks + CDN images (excludes .project-image thumbs).",
            "Crawl each discovered project path for full slideshows; /work holds stacked previews + copy.",
            "Legacy hash URLs (#/...) are not required; use paths like /the-inner-ear-project/.",
        ],
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {args.out} ({len(pages_out)} pages)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
