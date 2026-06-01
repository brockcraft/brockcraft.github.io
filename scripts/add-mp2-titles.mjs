import { readFileSync, writeFileSync } from "node:fs";

const TITLES = {
  "4572531": "Automated Heuristic UX Critique Report",
  "4581218": "Group Movie Taste Compatibility Finder",
  "4132623": "UX Job Interview Prep Assistant",
  "4583561": "Survey Response Affinity Mapper",
  "4588067": "EU AI Act Compliance Gap Analyzer",
  "4241574": "Open-Ended Survey Theme Summarizer",
  "4575282": "UW Campus Safety Perception Map",
  "4577509": "UX Study Document Auto-Generator",
  "4585576": "Emergency AED Locator and Guide",
  "4578561": "Urban Scooter Trip Pattern Analyzer",
  "4024274": "Low-Literacy Voice Preservation Checker",
  "4573395": "Accessible UI Color Pairing Tool",
  "3711444": "Qualitative Transcript Quote Finder",
  "4586677": "Guided Font Selection and Pairing Tool",
  "4577276": "Annotated Design Inspiration Collector",
  "4587891": "AI-Assisted Qualitative Theme Grouper",
  "4581406": "AI Interview Prep and Synthesis Tool",
  "4476680": "Class-Level Coaching Feedback Dashboard",
  "4574807": "Open Source Contribution Recommender",
  "2139063": "Audience-Specific Research Brief Generator",
  "4574753": "UX Interview Transcript Analyzer",
  "4588555": "Legal AI Public Discourse Analyzer",
  "4575649": "AI-Assisted Qualitative Decision Auditor",
  "4532864": "Screenshot-Based UI Heuristic Evaluator",
  "4594561": "Adaptive Reading App for Neurodivergent Learners",
  "4596194": "In-Progress Design Decision Reflector",
  "4591881": "Personal Constellation Creator",
  "4597185": "Usability Session Theme Synthesizer",
  "4577535": "Stakeholder-Tailored Research Summary Tool",
  "4581191": "Batch SVG Design Variant Generator",
  "4574242": "Research Protocol Bias Detector",
  "4578584": "Multi-Modal Usability Session Analyzer",
  "4572683": "Automated Website UX Audit Tool",
  "4584697": "AI-Guided Crazy 8s Brainstorm Facilitator",
  "4573349": "Session Notes Privacy Audit Tool",
  "4161310": "Interactive Branching Storybook for Children",
  "4585640": "Football Boot Surface Match Recommender",
  "3578107": "Animated Claude Coding Companion",
  "4600951": "Qualitative Data Auto-Clustering Tool",
};

const path = "public/data/mp2_submissions.json";
const data = JSON.parse(readFileSync(path, "utf-8"));

let matched = 0;
const updated = data.map((entry) => {
  const title = TITLES[entry.submission_id];
  if (title) matched++;
  return { ...entry, title: title ?? null };
});

writeFileSync(path, JSON.stringify(updated, null, 2));
console.log(`Updated ${matched}/${data.length} entries with titles.`);
