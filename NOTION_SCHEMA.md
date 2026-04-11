# Notion database schema (work / projects)

The site reads a **Notion database** at build time (`@notionhq/client`). Create an integration at [notion.so/my-integrations](https://www.notion.so/my-integrations), share your database with that integration, then set GitHub Actions secrets and local `.env` (see [`.env.example`](.env.example)).

## Required database properties

Use these **exact property names** (or override with `NOTION_PROP_*` env vars in `.env.example`).

| Property name | Notion type | Purpose |
|----------------|-------------|---------|
| **Name** | Title | Entry title (you may use any title property; the build uses whichever property has type `title`). |
| **Slug** | Text | URL segment for `/work/{slug}`. Lowercase, no spaces. If empty, a slug is derived from the title. |
| **Published** | Checkbox | Only rows with **Published** checked appear on the site. |
| **Tags** | Multi-select | Drives filter chips on `/work`. |
| **Summary** | Text | Short blurb on the work index. |
| **Date** | Date | Optional; shown on cards and detail. |
| **Cover** | Files & media | Optional cover image URL for the detail page. |

## Row body

Each database row is a **Notion page**. The page’s block content is converted to Markdown at build time (`notion-to-md`) then to HTML for `/work/[slug]`.

## Local development

```bash
cp .env.example .env
# fill NOTION_TOKEN and NOTION_DATABASE_ID
npm run dev
```

Without env vars, the site uses [`src/data/work-fallback.json`](src/data/work-fallback.json).

## CI

Repository secrets: **`NOTION_TOKEN`**, **`NOTION_DATABASE_ID`**. The deploy workflow passes them into `npm run build`.
