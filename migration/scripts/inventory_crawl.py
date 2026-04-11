#!/usr/bin/env python3
"""
Fetch brockcraft.com sitemap(s), classify page vs asset URLs, collect Squarespace CDN images,
and write migration/inventory.json. Safe to re-run (overwrites inventory).

Usage:
  python3 migration/scripts/inventory_crawl.py
  python3 migration/scripts/inventory_crawl.py --base https://www.brockcraft.com
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse, urljoin, unquote
import xml.etree.ElementTree as ET

NS = {
    "sm": "http://www.sitemaps.org/schemas/sitemap/0.9",
    "image": "http://www.google.com/schemas/sitemap-image/1.1",
    "xhtml": "http://www.w3.org/1999/xhtml",
}

ASSET_EXT = re.compile(
    r"\.(jpg|jpeg|png|gif|webp|svg|ico|pdf|zip|mp4|webm|mp3|woff2?|ttf|eot)$",
    re.I,
)


def fetch(url: str, timeout: int = 30) -> bytes:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "brockcraft-migration-inventory/1.0 (owned site)"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def parse_sitemap_index(xml_bytes: bytes) -> list[str]:
    root = ET.fromstring(xml_bytes)
    tag = root.tag
    if tag.endswith("sitemapindex"):
        return [el.text.strip() for el in root.findall("sm:sitemap/sm:loc", NS) if el.text]
    return []


def parse_urlset(xml_bytes: bytes) -> tuple[list[str], list[str]]:
    """Return (page_locs, image_locs from image namespace)."""
    root = ET.fromstring(xml_bytes)
    pages: list[str] = []
    images: list[str] = []
    for url_el in root.findall("sm:url", NS):
        loc = url_el.find("sm:loc", NS)
        if loc is not None and loc.text:
            pages.append(loc.text.strip())
        for img in url_el.findall("image:image/image:loc", NS):
            if img.text:
                images.append(img.text.strip())
    return pages, images


def normalize_url(url: str, default_host: str) -> str:
    u = url.strip()
    if u.startswith("http://www.brockcraft.com"):
        u = "https://www.brockcraft.com" + u[len("http://www.brockcraft.com") :]
    elif u.startswith("http://brockcraft.com"):
        u = "https://www.brockcraft.com" + u[len("http://brockcraft.com") :]
    return u


def classify_url(url: str) -> str:
    path = urlparse(url).path or "/"
    lower = path.lower()
    if ASSET_EXT.search(lower):
        return "asset"
    if "/sitemap" in lower:
        return "sitemap"
    return "html"


def path_key(url: str, host: str) -> str:
    p = urlparse(url)
    if p.netloc and host not in p.netloc:
        return url
    path = p.path or "/"
    if path.endswith("/") and len(path) > 1:
        path = path.rstrip("/")
    return path


def default_redirect_map(paths: list[str]) -> dict[str, str]:
    """Skeleton old_path -> new_path (TBD = same path until IA finalized)."""
    out: dict[str, str] = {}
    for path in sorted(set(paths)):
        if not path.startswith("/"):
            continue
        if path in ("/work", "/about"):
            out[path] = path
        elif path == "/" or path == "":
            out["/"] = "/"
        elif "teaching" in path.lower():
            out[path] = "/teaching"  # stub route planned
        elif "visualization" in path.lower():
            out[path] = "/visualization-design"
        else:
            out[path] = path  # default keep path; refine at cutover
    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="https://www.brockcraft.com")
    parser.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "inventory.json",
    )
    args = parser.parse_args()
    base = args.base.rstrip("/")
    host = urlparse(base).netloc

    sitemap_url = f"{base}/sitemap.xml"
    print(f"Fetching {sitemap_url}", file=sys.stderr)
    xml_bytes = fetch(sitemap_url)

    all_pages: list[str] = []
    all_images: list[str] = []
    sitemap_urls: list[str] = []

    subs = parse_sitemap_index(xml_bytes)
    if subs:
        sitemap_urls = subs
        for sm in subs:
            print(f"  sitemap index child: {sm}", file=sys.stderr)
            sub_xml = fetch(sm)
            p, imgs = parse_urlset(sub_xml)
            all_pages.extend(p)
            all_images.extend(imgs)
    else:
        p, imgs = parse_urlset(xml_bytes)
        all_pages.extend(p)
        all_images.extend(imgs)

    pages_norm = [normalize_url(u, host) for u in all_pages]
    images_norm = [normalize_url(u, host) for u in all_images]

    squarespace_images = sorted(
        {u for u in images_norm if "images.squarespace-cdn.com" in u}
    )
    other_images = sorted(
        {u for u in images_norm if "images.squarespace-cdn.com" not in u}
    )

    page_paths = []
    for u in pages_norm:
        pk = path_key(u, host)
        if isinstance(pk, str) and pk.startswith("http"):
            continue
        page_paths.append(pk if pk.startswith("/") else "/" + pk.lstrip("/"))

    by_kind: dict[str, list[str]] = defaultdict(list)
    for u in pages_norm:
        kind = classify_url(u)
        by_kind[kind].append(u)

    inventory = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "base_url": base,
        "sitemap_sources": [sitemap_url] + (sitemap_urls if sitemap_urls else []),
        "counts": {
            "urls_in_sitemap": len(pages_norm),
            "image_entries": len(images_norm),
            "squarespace_cdn_images": len(squarespace_images),
            "urls_by_classify": {k: len(v) for k, v in by_kind.items()},
        },
        "pages": sorted(set(pages_norm)),
        "page_paths": sorted(set(page_paths)),
        "images_all": sorted(set(images_norm)),
        "images_squarespace_cdn": squarespace_images,
        "images_other": other_images,
        "redirect_map_suggested": default_redirect_map(
            sorted(set(page_paths)) or ["/", "/about", "/work"]
        ),
        "notes": [
            "Re-run after Squarespace changes to refresh URLs.",
            "redirect_map_suggested is a starting point; edit before DNS cutover.",
            "Download script only fetches images.squarespace-cdn.com URLs you own.",
        ],
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(inventory, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {args.out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
