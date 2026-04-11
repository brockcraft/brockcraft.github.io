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

## Custom domain

See [migration/CUSTOM_DOMAIN.md](./migration/CUSTOM_DOMAIN.md).

## Legacy paths

- `/viz/*` and `/hcde530-curriculum/*` live under `public/` so URLs stay stable.
