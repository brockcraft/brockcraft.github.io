import { readFileSync, writeFileSync } from "node:fs";

const URLS = {
  "4591881": "https://twinkle.ltd/",                                    // Singhi
  "4581406": "https://uxresearchagent.vercel.app/",                     // Luo
  "4575282": "https://bright-stride-shine.lovable.app/navigate",        // Hadkar
  "LATE001": "https://wall-flower.bolt.host",                           // Khawar
  "4586677": "https://gena-lee.github.io/hcde530/fontface/",            // Lee
  "4161310": "https://preview--reading-pal-guide.lovable.app/",         // Xia
  "4588555": "https://ranjitharangaswamy.com/DocketSignal/",            // Rangaswamy
};

const path = "public/data/mp2_submissions.json";
const data = JSON.parse(readFileSync(path, "utf-8"));

const updated = data.map((entry) => ({
  ...entry,
  project_url: URLS[entry.submission_id] ?? entry.project_url ?? null,
}));

writeFileSync(path, JSON.stringify(updated, null, 2));

const withUrls = updated.filter((e) => e.project_url).length;
console.log(`Added project_url field to ${updated.length} entries (${withUrls} with URLs).`);
