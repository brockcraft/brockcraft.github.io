/**
 * sync-mp2-images.mjs
 *
 * Scans public/hcde530/images/ for files matching the pattern:
 *   "... - First Last.jpg" (or .jpeg / .png / .webp)
 *
 * Extracts the student name from the filename, matches it to an entry in
 * mp2_submissions.json by comparing against first_name + last_name,
 * then writes the image path back into the JSON.
 *
 * Run after dropping new photos into public/hcde530/images/:
 *   node scripts/sync-mp2-images.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const IMAGES_DIR = "public/hcde530/images";
const JSON_PATH = "public/data/mp2_submissions.json";
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// ── helpers ──────────────────────────────────────────────────────────────────

function normalize(str) {
  return str.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Extract the name portion after the last " - " in the stem. */
function nameFromFilename(filename) {
  const stem = filename.replace(/\.[^.]+$/, ""); // drop extension
  const idx = stem.lastIndexOf(" - ");
  if (idx === -1) return null;
  return stem.slice(idx + 3).trim();
}

/** Score how well a filename-name matches a JSON entry (higher = better). */
function matchScore(nameFromFile, entry) {
  const full = normalize(`${entry.first_name} ${entry.last_name}`);
  const fileNorm = normalize(nameFromFile);

  if (full === fileNorm) return 3; // exact full-name match

  // Last-name-only match (reliable fallback)
  if (normalize(entry.last_name) === fileNorm.split(" ").at(-1)) return 2;

  // Partial: file name starts with first name AND contains last name
  if (
    fileNorm.startsWith(normalize(entry.first_name.split(" ")[0])) &&
    fileNorm.includes(normalize(entry.last_name))
  )
    return 1;

  return 0;
}

// ── main ─────────────────────────────────────────────────────────────────────

const data = JSON.parse(readFileSync(JSON_PATH, "utf-8"));

let images;
try {
  images = readdirSync(IMAGES_DIR).filter((f) => {
    const ext = f.slice(f.lastIndexOf(".")).toLowerCase();
    return IMAGE_EXTS.has(ext);
  });
} catch {
  console.error(`Could not read ${IMAGES_DIR} — does the folder exist?`);
  process.exit(1);
}

if (images.length === 0) {
  console.log("No image files found in", IMAGES_DIR);
  process.exit(0);
}

const matched = [];
const unmatched = [];

for (const filename of images) {
  const nameFromFile = nameFromFilename(filename);
  if (!nameFromFile) {
    unmatched.push({ filename, reason: 'no " - " separator found' });
    continue;
  }

  // Find best-scoring entry
  let best = null;
  let bestScore = 0;
  for (const entry of data) {
    const score = matchScore(nameFromFile, entry);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (!best || bestScore === 0) {
    unmatched.push({ filename, reason: `no match found for "${nameFromFile}"` });
    continue;
  }

  const imagePath = `/hcde530/images/${filename}`;
  best.image = imagePath;
  matched.push({ filename, student: `${best.first_name} ${best.last_name}`, path: imagePath });
}

writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));

// ── report ───────────────────────────────────────────────────────────────────

console.log(`\n✓ Matched ${matched.length} / ${images.length} images:\n`);
for (const m of matched) {
  console.log(`  ${m.student.padEnd(36)} ← ${m.filename}`);
}

if (unmatched.length > 0) {
  console.log(`\n⚠ Could not match ${unmatched.length} file(s) — fix manually:\n`);
  for (const u of unmatched) {
    console.log(`  ${u.filename}`);
    console.log(`    reason: ${u.reason}`);
  }
}

console.log(`\nJSON updated: ${JSON_PATH}\n`);
