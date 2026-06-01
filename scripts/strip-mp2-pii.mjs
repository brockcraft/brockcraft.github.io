import { readFileSync, writeFileSync } from "node:fs";

const REMOVE = ["email", "uw_net_id", "filename", "late", "roster_note"];

const path = "public/data/mp2_submissions.json";
const data = JSON.parse(readFileSync(path, "utf-8"));

const cleaned = data.map((entry) => {
  const out = { ...entry };
  for (const key of REMOVE) delete out[key];
  return out;
});

writeFileSync(path, JSON.stringify(cleaned, null, 2));
console.log(`Stripped [${REMOVE.join(", ")}] from ${data.length} entries.`);
