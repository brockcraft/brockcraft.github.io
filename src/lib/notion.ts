import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import type {
  PageObjectResponse,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";
import fallback from "../data/work-fallback.json";

export type WorkItem = {
  id: string;
  slug: string;
  title: string;
  tags: string[];
  summary: string;
  date: string | null;
  coverUrl: string | null;
  published: boolean;
};

type FallbackRow = WorkItem & { bodyMarkdown?: string };

/**
 * Astro/Vite loads `.env` into `import.meta.env`. The prebuild script uses `tsx` + `dotenv`
 * which populates `process.env`. Read both so dev, build, and `emit-work-index` all work.
 */
function env(name: string): string | undefined {
  try {
    const fromVite = import.meta.env[name as keyof ImportMetaEnv] as unknown;
    if (typeof fromVite === "string" && fromVite.trim()) return fromVite.trim();
  } catch {
    /* no import.meta */
  }
  const fromProcess = process.env[name]?.trim();
  return fromProcess || undefined;
}

const propNames = () => ({
  slug: env("NOTION_PROP_SLUG") ?? "Slug",
  tags: env("NOTION_PROP_TAGS") ?? "Tags",
  published: env("NOTION_PROP_PUBLISHED") ?? "Published",
  summary: env("NOTION_PROP_SUMMARY") ?? "Summary",
  date: env("NOTION_PROP_DATE") ?? "Date",
  cover: env("NOTION_PROP_COVER") ?? "Cover",
});

function isFullDatabasePage(
  page: QueryDatabaseResponse["results"][number],
): page is PageObjectResponse {
  return page.object === "page" && "properties" in page && !!page.properties;
}

function getTitle(props: PageObjectResponse["properties"]): string {
  for (const prop of Object.values(props)) {
    if (prop.type === "title" && prop.title.length) {
      return prop.title.map((t) => t.plain_text).join("");
    }
  }
  return "Untitled";
}

function getRichText(
  props: PageObjectResponse["properties"],
  key: string,
): string {
  const p = props[key];
  if (!p || p.type !== "rich_text") return "";
  return p.rich_text.map((t) => t.plain_text).join("");
}

function getCheckbox(
  props: PageObjectResponse["properties"],
  key: string,
): boolean {
  const p = props[key];
  if (!p || p.type !== "checkbox") return false;
  return Boolean(p.checkbox);
}

function getDate(
  props: PageObjectResponse["properties"],
  key: string,
): string | null {
  const p = props[key];
  if (!p || p.type !== "date" || !p.date?.start) return null;
  return p.date.start;
}

function getMultiSelect(
  props: PageObjectResponse["properties"],
  key: string,
): string[] {
  const p = props[key];
  if (!p || p.type !== "multi_select") return [];
  return p.multi_select.map((o) => o.name);
}

function getCoverUrl(
  props: PageObjectResponse["properties"],
  key: string,
): string | null {
  const p = props[key];
  if (!p || p.type !== "files" || !p.files.length) return null;
  const f = p.files[0];
  if (f.type === "external") return f.external.url;
  if (f.type === "file") return f.file.url;
  return null;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function mapPage(page: PageObjectResponse): WorkItem {
  const keys = propNames();
  const props = page.properties;
  const title = getTitle(props);
  let slug = getRichText(props, keys.slug).trim();
  if (!slug) slug = slugify(title);
  return {
    id: page.id,
    slug,
    title,
    tags: getMultiSelect(props, keys.tags),
    summary: getRichText(props, keys.summary),
    date: getDate(props, keys.date),
    coverUrl: getCoverUrl(props, keys.cover),
    published: getCheckbox(props, keys.published),
  };
}

export async function fetchWorkItems(): Promise<WorkItem[]> {
  const token = env("NOTION_TOKEN");
  const databaseId = env("NOTION_DATABASE_ID");
  if (!token || !databaseId) {
    return (fallback as { items: FallbackRow[] }).items
      .filter((i) => i.published)
      .map(({ bodyMarkdown: _b, ...rest }) => rest);
  }

  const client = new Client({ auth: token });
  const items: WorkItem[] = [];
  let cursor: string | undefined;

  do {
    const res: QueryDatabaseResponse = await client.databases.query({
      database_id: databaseId,
      page_size: 100,
      start_cursor: cursor,
      filter: {
        property: propNames().published,
        checkbox: { equals: true },
      },
    });
    for (const page of res.results) {
      if (isFullDatabasePage(page)) items.push(mapPage(page));
    }
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);

  items.sort((a, b) => {
    const da = a.date ?? "";
    const db = b.date ?? "";
    return db.localeCompare(da);
  });
  return items;
}

export async function fetchWorkBodyMarkdown(pageId: string): Promise<string> {
  const token = env("NOTION_TOKEN");
  if (!token) {
    const fb = (fallback as { items: FallbackRow[] }).items;
    const hit = fb.find((i) => i.id === pageId);
    return hit?.bodyMarkdown ?? "";
  }
  const client = new Client({ auth: token });
  const n2m = new NotionToMarkdown({ notionClient: client });
  const blocks = await n2m.pageToMarkdown(pageId);
  const md = n2m.toMarkdownString(blocks);
  return md.parent ?? "";
}

export async function resolvePageIdBySlug(
  slug: string,
): Promise<string | null> {
  const token = env("NOTION_TOKEN");
  const databaseId = env("NOTION_DATABASE_ID");
  if (!token || !databaseId) {
    const hit = (fallback as { items: FallbackRow[] }).items.find(
      (i) => i.slug === slug,
    );
    return hit?.id ?? null;
  }
  const items = await fetchWorkItems();
  return items.find((i) => i.slug === slug)?.id ?? null;
}
