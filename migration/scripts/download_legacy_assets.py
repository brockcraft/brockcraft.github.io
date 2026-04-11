#!/usr/bin/env python3
"""
Download Squarespace CDN images listed in migration/inventory.json into public/legacy/
and write migration/asset-url-map.json (original URL -> site-relative path).

Only fetches images.squarespace-cdn.com (owned media from crawl).

Usage:
  python3 migration/scripts/download_legacy_assets.py
  python3 migration/scripts/download_legacy_assets.py --max-items 20 --dry-run
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
import urllib.request
from pathlib import Path
from urllib.parse import urlparse, unquote

ALLOWED_HOSTS = ("images.squarespace-cdn.com",)


def safe_filename(url: str) -> str:
    parsed = urlparse(url)
    base = unquote(Path(parsed.path).name) or "asset"
    base = "".join(c if c.isalnum() or c in "._-" else "_" for c in base)[:120]
    h = hashlib.sha256(url.encode()).hexdigest()[:10]
    stem = Path(base).stem
    suf = Path(base).suffix
    if not suf or len(suf) > 6:
        suf = ".bin"
    return f"{h}_{stem}{suf}"


def fetch(url: str, timeout: int = 60) -> bytes:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "brockcraft-migration-download/1.0 (owned site)"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    inv_path = root / "migration" / "inventory.json"
    out_dir = root / "public" / "legacy"
    map_path = root / "migration" / "asset-url-map.json"

    parser = argparse.ArgumentParser()
    parser.add_argument("--inventory", type=Path, default=inv_path)
    parser.add_argument("--out-dir", type=Path, default=out_dir)
    parser.add_argument("--map-out", type=Path, default=map_path)
    parser.add_argument("--max-items", type=int, default=None, help="Limit successful downloads")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    inv = json.loads(args.inventory.read_text(encoding="utf-8"))
    urls: list[str] = inv.get("images_squarespace_cdn") or []

    entries: list[dict[str, object]] = []
    download_count = 0

    for url in urls:
        host = urlparse(url).netloc.lower()
        if not any(host == h or host.endswith("." + h) for h in ALLOWED_HOSTS):
            print(f"skip non-allowed host: {url}", file=sys.stderr)
            continue

        fname = safe_filename(url)
        rel = f"/legacy/{fname}"
        entry: dict[str, object] = {"original": url, "local_web_path": rel, "filename": fname}

        if args.max_items is not None and download_count >= args.max_items:
            entry["downloaded"] = False
            entry["note"] = "skipped_over_max_items"
            entries.append(entry)
            continue

        dest = args.out_dir / fname

        if args.dry_run:
            entry["downloaded"] = False
            entry["note"] = "dry_run"
            entries.append(entry)
            download_count += 1
            continue

        args.out_dir.mkdir(parents=True, exist_ok=True)
        if dest.exists() and dest.stat().st_size > 0:
            entry["downloaded"] = True
            entry["note"] = "already_present"
            entry["bytes"] = dest.stat().st_size
            entries.append(entry)
            download_count += 1
            continue

        try:
            data = fetch(url)
            dest.write_bytes(data)
            entry["downloaded"] = True
            entry["bytes"] = len(data)
            entries.append(entry)
            download_count += 1
            print(f"OK {download_count} {fname}", file=sys.stderr)
        except Exception as e:
            entry["downloaded"] = False
            entry["error"] = str(e)
            entries.append(entry)
            print(f"ERR {url}: {e}", file=sys.stderr)
        time.sleep(0.12)

    payload = {
        "generated_from": str(args.inventory),
        "allowed_hosts": list(ALLOWED_HOSTS),
        "entries": entries,
    }
    if not args.dry_run:
        args.map_out.parent.mkdir(parents=True, exist_ok=True)
        args.map_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote {args.map_out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
