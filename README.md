# brockcraft.github.io

Static site for [brockcraft.github.io](https://brockcraft.github.io), built with **Astro**, **React** (islands), and optional **Notion** as the CMS for `/work`.

## Commands

| Command | Description |
|--------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Local dev server |
| `npm run build` | Production build (`prebuild` writes `public/work-index.json`) |
| `npm run preview` | Preview `dist/` |
| `npm run crawl` | Regenerate `migration/inventory.json` from brockcraft.com sitemap |
| `npm run download-legacy` | Download Squarespace CDN images → `public/legacy/` |
| `npm run legacy-import` | Scrape legacy site → `migration/legacy-ia-outline.json` + merge → `migration/legacy-work-merged.json` + checklist (needs Python deps below) |
| `npm run legacy-import-merge` | Re-run merge only (expects `legacy-ia-outline.json` already) |
| `npm run legacy-import-notion` | Dry-run Notion create from `legacy-work-merged.json` (needs `.env` Notion vars) |
| `npm run legacy-import-notion:apply` | **Creates** Notion database rows + page bodies (skips existing slugs / matching titles if Slug is a formula) |

### Legacy → Notion (full pipeline)

1. **Python deps** (once): `pip install -r migration/scripts/requirements-ia.txt`
2. **Scrape + merge + checklist**: `npm run legacy-import`  
   Writes `migration/legacy-ia-outline.json`, `migration/legacy-work-merged.json`, and `migration/LEGACY_IMPORT_CHECKLIST.md`. Fetches `/work` during merge if it was not part of the outline crawl.
3. **Preview Notion writes**: `npm run legacy-import-notion` (dry-run log only).
4. **Apply**: `npm run legacy-import-notion:apply` (requires `NOTION_TOKEN` + `NOTION_DATABASE_ID` in `.env`). Optional: `NOTION_IMPORT_PUBLISHED=false` to import as drafts. If **Slug** is a **Formula** column, Slug is not set on create (Notion derives it); duplicates are detected by **title**.
5. **Ship**: redeploy so `/work` rebuilds from Notion ([PUBLISH_FROM_NOTION.md](./PUBLISH_FROM_NOTION.md)).

Manual equivalents / options: [`migration/scripts/legacy_ia_extract.py`](./migration/scripts/legacy_ia_extract.py) supports `--paths` and `--use-inventory`.

## Notion

See [NOTION_SCHEMA.md](./NOTION_SCHEMA.md). For GitHub Actions, add secrets **`NOTION_TOKEN`** and **`NOTION_DATABASE_ID`**. Without them, the build uses [src/data/work-fallback.json](./src/data/work-fallback.json).

## Publishing after Notion edits (three ways)

1. **Automatic** — daily scheduled workflow (see [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml); edit or remove `schedule:` as you like).
2. **GitHub UI** — [Run **Deploy to GitHub Pages** manually](https://github.com/brockcraft/brockcraft.github.io/actions/workflows/deploy-pages.yml) (no terminal).
3. **Terminal** — `gh workflow run deploy-pages.yml --ref main` or an empty `git commit` + `push` (details and Notion copy-paste: [PUBLISH_FROM_NOTION.md](./PUBLISH_FROM_NOTION.md), plain text: [`notion-publish-snippet.txt`](./notion-publish-snippet.txt)).

## Custom domain

See [migration/CUSTOM_DOMAIN.md](./migration/CUSTOM_DOMAIN.md).

## Legacy paths

- `/viz/*` and `/hcde530-curriculum/*` live under `public/` so URLs stay stable.
- Crawled Squarespace images live under `public/legacy/`. The **Work** page hero and card fallbacks use filenames listed in [`src/data/work-legacy-accents.json`](src/data/work-legacy-accents.json) (edit to swap visuals). Per-item **Cover** in Notion overrides the fallback thumbnail.
