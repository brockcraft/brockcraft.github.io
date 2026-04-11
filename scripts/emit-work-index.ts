import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchWorkItems } from "../src/lib/notion.ts";

async function main() {
  const items = await fetchWorkItems();
  const publicDir = join(process.cwd(), "public");
  mkdirSync(publicDir, { recursive: true });
  const idx = items.map(
    ({ id, slug, title, tags, summary, date, coverUrl, published }) => ({
      id,
      slug,
      title,
      tags,
      summary,
      date,
      coverUrl,
      published,
    }),
  );
  writeFileSync(
    join(publicDir, "work-index.json"),
    JSON.stringify(idx, null, 2) + "\n",
    "utf-8",
  );
  console.log(`Wrote public/work-index.json (${idx.length} items)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
