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
