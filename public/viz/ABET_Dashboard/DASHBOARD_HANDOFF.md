# Criterion 5b Dashboard — Agent Handoff

## What This Is

A single-file interactive HTML dashboard that visualizes the HCDE BS curriculum's estimated contribution toward ABET EAC Criterion 5b (minimum 45 semester credits of engineering topics). Each course is evaluated for Engineering Design and Engineering Science quarter-credit (QC) estimates with confidence ratings, and the dashboard aggregates these into status tiles, a range chart, and a confidence heatmap.

---

## File Locations

| File | Location |
|------|----------|
| Dashboard (primary) | `HCDE ABET Curriculum Analysis/criterion5b_dashboard.html` |
| Course data (CSV) | `HCDE ABET Curriculum Analysis/criterion5b_data.csv` |
| Website repo | `/Users/brockcraft/Documents/Code/Active Projects/websites/brockcraft.github.io/` |
| Dashboard in repo | `public/viz/criterion5b_dashboard.html` |
| CSV in repo | `public/viz/criterion5b_data.csv` |
| Live URL | `https://brockcraft.github.io/viz/criterion5b_dashboard.html` |
| Course eval docs | `HCDE ABET Curriculum Analysis/HCDE [number]/HCDE_[number]_ABET_Evaluation.docx` |

The workspace folder (`HCDE ABET Curriculum Analysis/`) is the working copy. To deploy, copy files to the website repo and push. See Git Workflow below.

---

## Pending Tasks

These were identified but not completed in the previous session. Do these first.

### 1. Update HCDE 439 credit count from 4 QC to 5 QC

The evaluation assumed 4 QC but the actual credit count is 5 QC. The docx provides the scaled values for 5 QC:

| Field | Current (4 QC) | Correct (5 QC) |
|-------|---------------|----------------|
| `credits` | 4 | 5 |
| `sc` | 2.67 | 3.33 |
| `design.low` | 0.75 | 1.0 |
| `design.high` | 1.0 | 1.25 |
| `science.low` | 2.0 | 2.5 |
| `science.high` | 2.5 | 3.0 |
| `total.scLow` | 1.83 | 2.33 |
| `total.scHigh` | 2.33 | 2.83 |

Update in three places:
- `criterion5b_dashboard.html` — the `courses` array (HCDE 439 object near the bottom)
- `criterion5b_data.csv` — the HCDE 439 row
- `HCDE 439/HCDE_439_ABET_Evaluation.docx` — the summary table and any inline references to "4 QC"

The docx notes: "If 5 QC rather than 4 QC: engineering science 2.5–3.0 QC, engineering design 1.0–1.25 QC, total 3.5–4.25 QC (2.33–2.83 SC)."

### 2. Update header subtitle

In `criterion5b_dashboard.html`, find:

```html
<div class="sub">University of Washington &nbsp;·&nbsp; Curriculum Analysis in Progress</div>
```

Change to:

```html
<div class="sub">University of Washington &nbsp;·&nbsp; Curriculum Analysis</div>
```

---

## Planned Future Work

### PDF links in Course Detail panel

The sidebar Course Detail panel currently shows the evaluation document path as plain text:

```javascript
<div style="font-size:12px;color:#2F5496;word-break:break-all;">${c.doc}</div>
```

The plan is to:
1. Convert each `.docx` evaluation file to `.pdf`
2. Host the PDFs somewhere accessible (likely in the website repo under `public/viz/docs/` or similar)
3. Replace the plain-text `c.doc` display with a clickable link

Each course object has a `doc` field, e.g. `"HCDE 302/HCDE_302_ABET_Evaluation.docx"`. The path structure would become something like `"docs/HCDE_302_ABET_Evaluation.pdf"` and render as:

```javascript
<a href="${c.doc}" target="_blank" style="...">View evaluation document</a>
```

No implementation has been started. Coordinate with Brock on where PDFs should be hosted and what the final URL pattern should be.

---

## Dashboard Feature Set

### Status Bar (top tiles)
Four tiles, all unit-aware (switch with QC/SC toggle):
1. **Courses Analyzed** — count vs. total (13 courses, always shown as count)
2. **QC/SC Low Est. / High Est.** — combined accumulated low and high estimates
3. **Avg. QC/SC / Course — Low / High** — per-course averages with projection
4. **Estimated Criterion 5b Coverage** — mini progress bar with low (dark fill) and high (light fill) ranges; red line at ABET target (45 SC or ~67.5 QC equivalent)

### Tabs
- **Credit Ranges** — bar chart (default)
- **Confidence Heatmap** — grid of confidence ratings by course and category

### QC/SC Toggle (tabs row, right side)
Global unit toggle. Affects: all four status tiles, the range chart axis and bar values, the heatmap cell values, tooltips. State variable: `viewUnit` (`'qc'` | `'sc'`).

### Aggregate/Separate Toggle (range chart header)
Controls whether the range chart shows two bars per course (Design + Science separately) or one combined bar. State variable: `viewMode` (`'aggregate'` | `'separate'`). Default: Aggregate.

In **Aggregate** mode:
- Single bar per row; value = design + science combined
- Opacity encodes confidence (conservative of the two ratings)
- No confidence dots shown
- Legend shows opacity scale

In **Separate** mode:
- Two bars per row (blue = Design, orange = Science)
- Confidence dots with D/S labels at right
- Legend shows color swatches + confidence colors

### Sort Dropdown
- Separate mode options: Course number / Eng. Design (high→low) / Eng. Science (high→low)
- Aggregate mode options: Course number / Combined total (high→low)
- Options swap automatically when mode changes

### Sidebar — Course Detail
Click any chart row or heatmap cell to populate. Shows: course number, name, SC/QC totals, Design and Science estimates with confidence badges, tools, self-study notes, and evaluation document path.

### About Modal
Explains methodology, confidence rating definitions, and the SC conversion factor.

---

## Code Architecture

All code is in a single HTML file. No external dependencies beyond the browser.

### Key State Variables
```javascript
let courses = [...];        // array of course objects (see Data Schema)
let selectedCourse = null;  // currently highlighted course
let viewUnit = 'qc';        // 'qc' | 'sc'
let viewMode = 'aggregate'; // 'aggregate' | 'separate'
```

### Key Functions
| Function | Purpose |
|----------|---------|
| `buildStatusBar()` | Renders all four top tiles; unit-aware; includes progress pill |
| `buildRangeChart()` | Renders the SVG range chart; reads viewUnit + viewMode |
| `buildHeatmap()` | Renders the SVG heatmap; unit-aware |
| `drawRangeBar(x, cat, y, color, unitLabel, dotX)` | Helper for individual bars; flips label left when near right edge |
| `setUnit(u)` | Switches QC/SC; updates tiles + both charts |
| `setMode(m)` | Switches Aggregate/Separate; swaps dropdown options |
| `getSortedCourses()` | Returns sorted copy of courses array |
| `selectCourse(idx)` | Populates sidebar detail panel |
| `refreshAll()` | Called after CSV load; rebuilds everything |

### Constants
```javascript
const TARGET_SC = 45;       // ABET minimum semester credits
const TOTAL_COURSES = 13;   // total courses in curriculum (currently all 13 populated)
```

---

## Data Schema

Each entry in the `courses` array:

```javascript
{
  number:  "HCDE 302",                          // display label
  name:    "Foundations of Human-Centered Design I",
  credits: 5,                                   // UW quarter credits
  sc:      3.3,                                 // semester credit equivalent (credits × 0.667)
  design:  { low: 2.5, high: 3.5, conf: "High" },
  science: { low: 0.0, high: 0.25, conf: "Low" },
  total:   { scLow: 1.65, scHigh: 2.48 },       // (design+science) × 0.667
  tools:   "Miro/FigJam, Figma, ...",
  notes:   "Self-study guidance text...",
  doc:     "HCDE 302/HCDE_302_ABET_Evaluation.docx"
}
```

Confidence values: `"High"` | `"Moderate"` | `"Low-Moderate"` | `"Low"`

### Current Courses (13 total)
| Course | Design QC | Science QC | Design Conf. | Science Conf. |
|--------|-----------|------------|--------------|---------------|
| HCDE 302 | 2.5–3.5 | 0.0–0.25 | High | Low |
| HCDE 303 | 2.8–3.5 | 0.35–0.75 | High | Low-Moderate |
| HCDE 313 | 0.25–0.5 | 0.5–0.75 | Low | Low-Moderate |
| HCDE 315 | 1.7–2.95 | 0.0–0.25 | Moderate | Low |
| HCDE 316 | 1.5–2.5 | 0.5–1.0 | Moderate | Moderate |
| HCDE 351 | 3.0–3.5 | 0.25–0.5 | High | Low |
| HCDE 410 | 1.0–1.5 | 1.0–1.5 | Moderate | Moderate |
| HCDE 411 | 2.5–3.0 | 1.0–1.5 | High | Moderate |
| HCDE 417 | 0.25–0.75 | 0.0–0.25 | Low | Low |
| HCDE 438 | 1.25–2.0 | 0.0–0.25 | Moderate | Low |
| HCDE 439 | 0.75–1.0* | 2.0–2.5* | High | High |
| HCDE 492 | 0.5–1.0 | 0.0–0.25 | Low-Moderate | Low |
| HCDE 493 | 3.0–4.0 | 0.0–0.5 | High | Low |

*HCDE 439 values pending update to 5 QC (see Pending Tasks)

---

## Git Workflow

The workspace folder is separate from the git repo. To deploy changes:

```bash
# Copy updated files to website repo
cp "/path/to/HCDE ABET Curriculum Analysis/criterion5b_dashboard.html" \
   "/Users/brockcraft/Documents/Code/Active Projects/websites/brockcraft.github.io/public/viz/criterion5b_dashboard.html"

cp "/path/to/HCDE ABET Curriculum Analysis/criterion5b_data.csv" \
   "/Users/brockcraft/Documents/Code/Active Projects/websites/brockcraft.github.io/public/viz/criterion5b_data.csv"

cd "/Users/brockcraft/Documents/Code/Active Projects/websites/brockcraft.github.io"
git add public/viz/criterion5b_dashboard.html public/viz/criterion5b_data.csv
git commit -m "your message"
git push
```

If you get a `HEAD.lock` error, remove the stale lock first:
```bash
rm "/Users/brockcraft/Documents/Code/Active Projects/websites/brockcraft.github.io/.git/HEAD.lock"
```

Feature work should be done on a branch:
```bash
git checkout -b feature/your-feature-name
# ... make changes, commit ...
git checkout main
git merge feature/your-feature-name
git push
```

---

## User Preferences

- No instructor or TA names in any ABET evaluation documents or dashboard content
- Concise prose; avoid adverbs, clichés, and lofty phrases ("in today's landscape", etc.)
- Learning objectives use Bloom's Taxonomy action verbs; avoid "understand" or "appreciate"
- The ABET target is always 45 SC; QC equivalent (~67.5) is derived, not primary
- Confidence ratings reflect certainty of the credit *estimate*, not course quality
