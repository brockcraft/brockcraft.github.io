import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@notionhq/client";
import type {
  BlockObjectRequest,
  CreatePageParameters,
} from "@notionhq/client/build/src/api-endpoints";
import type { GetDatabaseResponse } from "@notionhq/client/build/src/api-endpoints";

type MergedItem = {
  slug: string;
  title: string;
  summary: string;
  body_markdown: string;
  cover_url: string | null;
  tags: string[];
  merge_notes?: string[];
};

type MergedFile = { items: MergedItem[] };

const PROP_SLUG = process.env.NOTION_PROP_SLUG ?? "Slug";
const PROP_TAGS = process.env.NOTION_PROP_TAGS ?? "Tags";
const PROP_PUBLISHED = process.env.NOTION_PROP_PUBLISHED ?? "Published";
const PROP_SUMMARY = process.env.NOTION_PROP_SUMMARY ?? "Summary";
const PROP_DATE = process.env.NOTION_PROP_DATE ?? "Date";
const PROP_COVER = process.env.NOTION_PROP_COVER ?? "Cover";
const PUBLISHED =
  String(process.env.NOTION_IMPORT_PUBLISHED ?? "true").toLowerCase() !== "false";

function chunkRichText(content: string, max = 1900): string[] {
  const s = content.trim();
  if (!s) return [];
  const parts: string[] = [];
  for (let i = 0; i < s.length; i += max) {
    parts.push(s.slice(i, i + max));
  }
  return parts;
}

function bodyToBlocks(md: string): BlockObjectRequest[] {
  const chunks = md.split(/\n\n+/).filter(Boolean);
  const blocks: BlockObjectRequest[] = [];
  for (const chunk of chunks) {
    for (const piece of chunkRichText(chunk)) {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: piece } }],
        },
      });
    }
  }
  return blocks.slice(0, 950);
}

function titlePropertyName(db: GetDatabaseResponse): string {
  for (const [name, col] of Object.entries(db.properties)) {
    if (col.type === "title") return name;
  }
  throw new Error("No title-type column found on Notion database.");
}

function slugPropertyIsFormula(db: GetDatabaseResponse): boolean {
  const p = db.properties[PROP_SLUG];
  return p?.type === "formula";
}

async function findExistingPageId(
  notion: Client,
  databaseId: string,
  db: GetDatabaseResponse,
  titleProp: string,
  slug: string,
  title: string,
): Promise<string | null> {
  if (slugPropertyIsFormula(db)) {
    const res = await notion.databases.query({
      database_id: databaseId,
      filter: { property: titleProp, title: { equals: title } },
      page_size: 1,
    });
    const first = res.results[0];
    return first && "id" in first ? first.id : null;
  }
  try {
    const res = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: PROP_SLUG,
        rich_text: { equals: slug },
      },
      page_size: 1,
    });
    const first = res.results[0];
    return first && "id" in first ? first.id : null;
  } catch {
    return null;
  }
}

function buildProperties(
  titleProp: string,
  item: MergedItem,
  db: GetDatabaseResponse,
): CreatePageParameters["properties"] {
  const props: CreatePageParameters["properties"] = {
    [titleProp]: {
      title: [{ type: "text", text: { content: item.title.slice(0, 2000) } }],
    },
    [PROP_SUMMARY]: {
      rich_text: [
        { type: "text", text: { content: (item.summary || "").slice(0, 2000) } },
      ],
    },
    [PROP_PUBLISHED]: { checkbox: PUBLISHED },
    [PROP_TAGS]: {
      multi_select: (item.tags || ["Legacy"]).map((name) => ({ name })),
    },
  };
  if (!slugPropertyIsFormula(db)) {
    (props as Record<string, unknown>)[PROP_SLUG] = {
      rich_text: [{ type: "text", text: { content: item.slug.slice(0, 2000) } }],
    };
  }
  if (item.cover_url) {
    (props as Record<string, unknown>)[PROP_COVER] = {
      files: [
        {
          type: "external",
          name: "cover",
          external: { url: item.cover_url.slice(0, 2000) },
        },
      ],
    };
  }
  return props;
}

async function appendBlocksInChunks(
  notion: Client,
  pageId: string,
  blocks: BlockObjectRequest[],
) {
  const batch = 100;
  for (let i = 0; i < blocks.length; i += batch) {
    const slice = blocks.slice(i, i + batch);
    await notion.blocks.children.append({
      block_id: pageId,
      children: slice,
    });
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const apply = argv.includes("--apply");
  const force = argv.includes("--force");
  const mergedPath = argv.find((a) => !a.startsWith("--")) ?? join(process.cwd(), "migration", "legacy-work-merged.json");

  const token = process.env.NOTION_TOKEN?.trim();
  const databaseId = process.env.NOTION_DATABASE_ID?.trim();
  if (!token || !databaseId) {
    console.error("Set NOTION_TOKEN and NOTION_DATABASE_ID (e.g. in .env).");
    process.exit(2);
  }

  const raw = readFileSync(mergedPath, "utf-8");
  const data = JSON.parse(raw) as MergedFile;
  const items = data.items ?? [];
  if (!items.length) {
    console.error(`No items in ${mergedPath}. Run legacy_work_merge.py first.`);
    process.exit(2);
  }

  const notion = new Client({ auth: token });
  const db = await notion.databases.retrieve({ database_id: databaseId });
  const titleProp = titlePropertyName(db);

  const report: string[] = [];
  for (const item of items) {
    const existing = await findExistingPageId(
      notion,
      databaseId,
      db,
      titleProp,
      item.slug,
      item.title,
    );
    if (existing && !force) {
      report.push(`skip  ${item.slug} (already in Notion)`);
      continue;
    }
    if (existing && force) {
      report.push(`skip  ${item.slug} (--force not implemented; delete row in Notion or rename slug)`);
      continue;
    }

    const blocks = bodyToBlocks(item.body_markdown || item.summary || "");

    if (!apply) {
      report.push(
        `dry-run  ${item.slug}  "${item.title}"  blocks=${blocks.length}  cover=${Boolean(item.cover_url)}`,
      );
      continue;
    }

    const page = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: buildProperties(titleProp, item, db),
    });

    if (blocks.length) {
      await appendBlocksInChunks(notion, page.id, blocks);
    }
    report.push(`created  ${item.slug}  page_id=${page.id}`);
  }

  console.log(report.join("\n"));
  if (!apply) {
    console.log(
      "\nDry run only. Re-run with --apply to create pages (Published=" +
        PUBLISHED +
        "; set NOTION_IMPORT_PUBLISHED=false to import as drafts).",
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
