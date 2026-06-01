import { readFileSync, writeFileSync } from "node:fs";

const path = "public/data/mp2_submissions.json";
const data = JSON.parse(readFileSync(path, "utf-8"));

const updated = data.map((entry) => ({
  ...entry,
  image: entry.image ?? null,
}));

writeFileSync(path, JSON.stringify(updated, null, 2));
console.log(`Added image field to ${data.length} entries.`);
