import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawSubmission {
  submission_id: string;
  last_name: string;
  first_name: string;
  problem: string;
  audience: string;
  data: string;
  track: string;
  platform: string;
  rationale: string;
  title?: string | null;
  image?: string | null;
}

type TrackLabel = "Design" | "Research" | "Both";

interface Project {
  id: string;
  student_name: string;
  first_name: string;
  last_name: string;
  title: string;
  track: TrackLabel;
  summary_short: string;
  problem_full: string;
  audience: string;
  data_description: string;
  platform_raw: string;
  platform_tags: string[];
  image: string | null;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
}

function normalizeTrack(raw: string): TrackLabel {
  const t = raw.toLowerCase();
  if (t.includes("both") || (t.includes("design") && t.includes("research"))) return "Both";
  if (t.includes("design")) return "Design";
  return "Research";
}

function deriveTitle(problem: string): string {
  const clean = stripMarkdown(problem);
  const m = clean.match(/^[^.!?]+[.!?]/);
  const sentence = m ? m[0] : clean;
  const trimmed = sentence.replace(/[.!?]$/, "").trim();
  if (trimmed.length <= 100) return trimmed;
  const cut = trimmed.slice(0, 92);
  const lastSpace = cut.lastIndexOf(" ");
  return cut.slice(0, lastSpace > 40 ? lastSpace : 92).trim() + "…";
}

function shortenText(text: string, maxChars = 190): string {
  const clean = stripMarkdown(text);
  if (clean.length <= maxChars) return clean;
  const cut = clean.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return cut.slice(0, lastSpace > 80 ? lastSpace : maxChars).trim() + "…";
}

function extractPlatformTags(platform: string): string[] {
  const tags: string[] = [];
  if (/lovable/i.test(platform)) tags.push("Lovable");
  if (/bolt/i.test(platform)) tags.push("Bolt");
  if (/cursor/i.test(platform)) tags.push("Cursor");
  if (/python/i.test(platform)) tags.push("Python");
  if (/figma/i.test(platform)) tags.push("Figma");
  if (/streamlit/i.test(platform)) tags.push("Streamlit");
  if (/jupyter/i.test(platform)) tags.push("Jupyter");
  if (/vercel/i.test(platform)) tags.push("Vercel");
  if (/supabase/i.test(platform)) tags.push("Supabase");
  if (/claude/i.test(platform)) tags.push("Claude");
  return tags;
}

function transformSubmission(raw: RawSubmission): Project {
  return {
    id: raw.submission_id,
    student_name: `${raw.first_name} ${raw.last_name}`,
    first_name: raw.first_name,
    last_name: raw.last_name,
    title: raw.title ? raw.title.trim() : deriveTitle(raw.problem),
    track: normalizeTrack(raw.track),
    summary_short: shortenText(raw.problem, 190),
    problem_full: stripMarkdown(raw.problem),
    audience: raw.audience ? stripMarkdown(raw.audience) : "",
    data_description: raw.data ? stripMarkdown(raw.data) : "",
    platform_raw: raw.platform ?? "",
    platform_tags: extractPlatformTags(raw.platform ?? ""),
    image: raw.image ?? null,
  };
}

// ─── Visuals ──────────────────────────────────────────────────────────────────

const TRACK_COLORS: Record<TrackLabel, { bg: string; text: string; border: string }> = {
  Design: { bg: "#EDE9FE", text: "#5B21B6", border: "#DDD6FE" },
  Research: { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
  Both: { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
};

const CARD_GRADIENTS = [
  "135deg, #667eea 0%, #764ba2 100%",
  "135deg, #f6d365 0%, #fda085 100%",
  "135deg, #89f7fe 0%, #66a6ff 100%",
  "135deg, #a1ffce 0%, #a8edea 100%",
  "135deg, #f093fb 0%, #f5576c 100%",
  "135deg, #4facfe 0%, #00f2fe 100%",
  "135deg, #43e97b 0%, #38f9d7 100%",
  "135deg, #fa709a 0%, #fee140 100%",
  "135deg, #30cfd0 0%, #a18cd1 100%",
  "135deg, #a18cd1 0%, #fbc2eb 100%",
  "135deg, #ffecd2 0%, #fcb69f 100%",
  "135deg, #2af598 0%, #009efd 100%",
];

function gradientForId(id: string): string {
  const n = parseInt(id, 10) || id.charCodeAt(0);
  return CARD_GRADIENTS[n % CARD_GRADIENTS.length];
}

// ─── Injected styles ──────────────────────────────────────────────────────────

const CSS = `
  .mp2 {
    font-family: inherit;
    --mp2-gap: 1.25rem;
    --mp2-radius: 12px;
    --mp2-shadow: 0 2px 8px rgba(0,0,0,0.08);
    --mp2-shadow-hover: 0 10px 36px rgba(0,0,0,0.14);
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem 4rem;
  }
  .mp2-header {
    padding: 2rem 0 1.5rem;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .mp2-header h1 {
    font-size: 1.6rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
    color: #111;
  }
  .mp2-header p {
    font-size: 0.9rem;
    color: #6B7280;
    margin: 0;
  }
  .mp2-submit-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 1.1rem;
    background: #7E6CAB;
    color: #fff;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
    transition: background 0.15s, transform 0.1s;
    flex-shrink: 0;
  }
  .mp2-submit-btn:hover {
    background: #6D5D96;
    transform: translateY(-1px);
  }
  .mp2-submit-btn:active {
    transform: translateY(0);
  }
  .mp2-filters {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: #F9FAFB;
    border: 1px solid #E5E7EB;
    border-radius: var(--mp2-radius);
    margin-bottom: 1.5rem;
  }
  .mp2-filters__search {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #D1D5DB;
    border-radius: 8px;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    background: #fff;
    box-sizing: border-box;
  }
  .mp2-filters__search:focus {
    border-color: #7C3AED;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
  }
  .mp2-filters__row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .mp2-filters__label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #9CA3AF;
    min-width: 60px;
  }
  .mp2-chip {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 500;
    border: 1.5px solid #E5E7EB;
    background: #fff;
    color: #374151;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, color 0.15s;
    line-height: 1.4;
    user-select: none;
  }
  .mp2-chip:hover {
    border-color: #7C3AED;
    color: #7C3AED;
  }
  .mp2-chip[aria-pressed="true"] {
    background: #7C3AED;
    border-color: #7C3AED;
    color: #fff;
  }
  .mp2-chip--track-design[aria-pressed="true"] {
    background: #5B21B6;
    border-color: #5B21B6;
    color: #fff;
  }
  .mp2-chip--track-research[aria-pressed="true"] {
    background: #065F46;
    border-color: #065F46;
    color: #fff;
  }
  .mp2-chip--track-both[aria-pressed="true"] {
    background: #92400E;
    border-color: #92400E;
    color: #fff;
  }
  .mp2-results-meta {
    font-size: 0.82rem;
    color: #9CA3AF;
    margin-bottom: 1rem;
  }
  .mp2-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--mp2-gap);
    align-items: start;
  }
  .mp2-card {
    background: #fff;
    border-radius: var(--mp2-radius);
    border: 1px solid #F3F4F6;
    box-shadow: var(--mp2-shadow);
    overflow: hidden;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    will-change: transform;
  }
  .mp2-card__thumb {
    width: 100%;
    aspect-ratio: 16 / 8;
    display: block;
    object-fit: cover;
  }
  .mp2-card__body {
    padding: 1rem 1.1rem 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    flex: 1;
  }
  .mp2-card__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .mp2-card__student {
    font-size: 0.78rem;
    font-weight: 600;
    color: #6B7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mp2-card__title {
    font-size: 0.95rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .mp2-card__summary {
    font-size: 0.82rem;
    color: #6B7280;
    line-height: 1.5;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .mp2-card__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 0.25rem;
  }
  .mp2-platform-chip {
    display: inline-flex;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    background: #F3F4F6;
    color: #6B7280;
    border: 1px solid #E5E7EB;
    font-weight: 500;
  }
  .mp2-track-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .mp2-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem;
    color: #9CA3AF;
    font-size: 0.9rem;
  }

  /* Modal */
  .mp2-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(4px);
    z-index: 200;
  }
  .mp2-modal-wrap {
    position: fixed;
    inset: 0;
    z-index: 201;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    pointer-events: none;
  }
  .mp2-modal {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.25);
    width: min(680px, 100%);
    max-height: 90vh;
    overflow-y: auto;
    pointer-events: all;
    display: flex;
    flex-direction: column;
  }
  .mp2-modal__thumb {
    width: 100%;
    aspect-ratio: 16 / 7;
    border-radius: 16px 16px 0 0;
    flex-shrink: 0;
    object-fit: cover;
  }
  .mp2-modal__body {
    padding: 1.5rem 1.75rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .mp2-modal__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }
  .mp2-modal__title-block {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .mp2-modal__student {
    font-size: 0.8rem;
    font-weight: 600;
    color: #9CA3AF;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .mp2-modal__title {
    font-size: 1.2rem;
    font-weight: 700;
    color: #111827;
    line-height: 1.3;
    margin: 0;
  }
  .mp2-modal__badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
  }
  .mp2-modal__close {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: #F3F4F6;
    color: #6B7280;
    font-size: 1.1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition: background 0.15s;
  }
  .mp2-modal__close:hover {
    background: #E5E7EB;
  }
  .mp2-modal__section {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .mp2-modal__section-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #9CA3AF;
  }
  .mp2-modal__section-text {
    font-size: 0.9rem;
    color: #374151;
    line-height: 1.6;
    margin: 0;
  }
  .mp2-divider {
    border: none;
    border-top: 1px solid #F3F4F6;
    margin: 0;
  }

  @media (max-width: 600px) {
    .mp2-grid {
      grid-template-columns: 1fr;
    }
    .mp2-modal__body {
      padding: 1.25rem 1.25rem 1.75rem;
    }
  }
  @media (min-width: 900px) {
    .mp2-grid {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
  }
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrackBadge({ track }: { track: TrackLabel }) {
  const c = TRACK_COLORS[track];
  return (
    <span
      className="mp2-track-badge"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {track}
    </span>
  );
}

function PlatformChip({ label }: { label: string }) {
  return <span className="mp2-platform-chip">{label}</span>;
}

interface FilterBarProps {
  tracks: TrackLabel[];
  selectedTrack: TrackLabel | "All";
  onTrackChange: (t: TrackLabel | "All") => void;
  allPlatformTags: string[];
  selectedPlatforms: string[];
  onPlatformToggle: (p: string) => void;
  search: string;
  onSearch: (s: string) => void;
}

function FilterBar({
  tracks,
  selectedTrack,
  onTrackChange,
  allPlatformTags,
  selectedPlatforms,
  onPlatformToggle,
  search,
  onSearch,
}: FilterBarProps) {
  const trackChipClass: Record<string, string> = {
    Design: "mp2-chip mp2-chip--track-design",
    Research: "mp2-chip mp2-chip--track-research",
    Both: "mp2-chip mp2-chip--track-both",
  };
  return (
    <div className="mp2-filters">
      <input
        type="search"
        className="mp2-filters__search"
        placeholder="Search by student name or project description…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        aria-label="Search projects"
      />
      <div className="mp2-filters__row">
        <span className="mp2-filters__label">Track</span>
        <button
          className="mp2-chip"
          aria-pressed={selectedTrack === "All"}
          onClick={() => onTrackChange("All")}
        >
          All
        </button>
        {tracks.map((t) => (
          <button
            key={t}
            className={trackChipClass[t] ?? "mp2-chip"}
            aria-pressed={selectedTrack === t}
            onClick={() => onTrackChange(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {allPlatformTags.length > 0 && (
        <div className="mp2-filters__row">
          <span className="mp2-filters__label">Platform</span>
          {allPlatformTags.map((p) => (
            <button
              key={p}
              className="mp2-chip"
              aria-pressed={selectedPlatforms.includes(p)}
              onClick={() => onPlatformToggle(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  reduceMotion: boolean;
}

function ProjectCard({ project, onClick, reduceMotion }: ProjectCardProps) {
  return (
    <motion.div
      layoutId={`card-${project.id}`}
      className="mp2-card"
      onClick={onClick}
      whileHover={
        reduceMotion
          ? {}
          : { y: -4, boxShadow: "0 10px 36px rgba(0,0,0,0.14)" }
      }
      transition={{ layout: { type: "spring", stiffness: 420, damping: 34 } }}
    >
      {project.image ? (
        <img
          className="mp2-card__thumb"
          src={project.image}
          alt={`${project.student_name} project`}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div
          className="mp2-card__thumb"
          style={{ background: `linear-gradient(${gradientForId(project.id)})` }}
          aria-hidden
        />
      )}
      <div className="mp2-card__body">
        <div className="mp2-card__meta">
          <span className="mp2-card__student">{project.student_name}</span>
          <TrackBadge track={project.track} />
        </div>
        <h2 className="mp2-card__title">{project.title}</h2>
        <p className="mp2-card__summary">{project.summary_short}</p>
        {project.platform_tags.length > 0 && (
          <div className="mp2-card__chips">
            {project.platform_tags.slice(0, 3).map((t) => (
              <PlatformChip key={t} label={t} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
  reduceMotion: boolean;
}

function ProjectModal({ project, onClose, reduceMotion }: ProjectModalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fade = reduceMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.22, 1, 0.36, 1] };

  return (
    <>
      <motion.div
        className="mp2-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fade}
        onClick={onClose}
        aria-hidden
      />
      <div className="mp2-modal-wrap" role="dialog" aria-modal aria-label={project.title}>
        <motion.div
          layoutId={`card-${project.id}`}
          className="mp2-modal"
          transition={{ type: "spring", stiffness: 380, damping: 36 }}
        >
          {project.image ? (
            <img
              className="mp2-modal__thumb"
              src={project.image}
              alt={`${project.student_name} project`}
              decoding="async"
            />
          ) : (
            <div
              className="mp2-modal__thumb"
              style={{ background: `linear-gradient(${gradientForId(project.id)})` }}
              aria-hidden
            />
          )}
          <div className="mp2-modal__body">
            <div className="mp2-modal__header">
              <div className="mp2-modal__title-block">
                <span className="mp2-modal__student">{project.student_name}</span>
                <h2 className="mp2-modal__title">{project.title}</h2>
              </div>
              <button
                className="mp2-modal__close"
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mp2-modal__badges">
              <TrackBadge track={project.track} />
              {project.platform_tags.map((t) => (
                <PlatformChip key={t} label={t} />
              ))}
            </div>

            <hr className="mp2-divider" />

            <div className="mp2-modal__section">
              <span className="mp2-modal__section-label">Problem</span>
              <p className="mp2-modal__section-text">{project.problem_full}</p>
            </div>

            {project.audience && (
              <div className="mp2-modal__section">
                <span className="mp2-modal__section-label">Audience</span>
                <p className="mp2-modal__section-text">{project.audience}</p>
              </div>
            )}

            {project.data_description && (
              <div className="mp2-modal__section">
                <span className="mp2-modal__section-label">Data &amp; Output</span>
                <p className="mp2-modal__section-text">{project.data_description}</p>
              </div>
            )}

            {project.platform_raw && (
              <div className="mp2-modal__section">
                <span className="mp2-modal__section-label">Platform</span>
                <p className="mp2-modal__section-text">{project.platform_raw}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Mp2Gallery() {
  const reduceMotion = useReducedMotion() ?? false;

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTrack, setSelectedTrack] = useState<TrackLabel | "All">("All");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const scrollYRef = useRef(0);

  useEffect(() => {
    fetch("/data/mp2_submissions.json")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load: ${r.status}`);
        return r.json();
      })
      .then((data: RawSubmission[]) => {
        const sorted = [...data].sort((a, b) =>
          a.last_name.localeCompare(b.last_name)
        );
        setProjects(sorted.map(transformSubmission));
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const allPlatformTags = useMemo(() => {
    const s = new Set<string>();
    projects.forEach((p) => p.platform_tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (selectedTrack !== "All") list = list.filter((p) => p.track === selectedTrack);
    if (selectedPlatforms.length > 0) {
      list = list.filter((p) =>
        selectedPlatforms.every((tag) => p.platform_tags.includes(tag))
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.student_name.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.problem_full.toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, selectedTrack, selectedPlatforms, search]);

  const openProject = useCallback((p: Project) => {
    scrollYRef.current = window.scrollY;
    setSelectedProject(p);
  }, []);

  const closeProject = useCallback(() => {
    setSelectedProject(null);
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollYRef.current, behavior: "instant" });
    });
  }, []);

  const togglePlatform = useCallback((tag: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]
    );
  }, []);

  const layoutTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.85 };

  const fadeTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

  const isFiltered =
    selectedTrack !== "All" || selectedPlatforms.length > 0 || search.trim() !== "";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="mp2">
        <div className="mp2-header">
          <div>
            <h1>HCDE 530 — MP2 Student Projects</h1>
            <p>{projects.length} project proposals &middot; Spring 2026</p>
          </div>
          <a
            href="https://forms.gle/cPewru2XP8BUgX2r9"
            target="_blank"
            rel="noopener noreferrer"
            className="mp2-submit-btn"
          >
            📷 Submit your project photo
          </a>
        </div>

        {!loading && !error && (
          <FilterBar
            tracks={["Design", "Research", "Both"]}
            selectedTrack={selectedTrack}
            onTrackChange={setSelectedTrack}
            allPlatformTags={allPlatformTags}
            selectedPlatforms={selectedPlatforms}
            onPlatformToggle={togglePlatform}
            search={search}
            onSearch={setSearch}
          />
        )}

        {loading && (
          <p style={{ color: "#9CA3AF", fontSize: "0.9rem" }}>Loading projects…</p>
        )}
        {error && (
          <p style={{ color: "#DC2626", fontSize: "0.9rem" }}>Error: {error}</p>
        )}

        {!loading && !error && (
          <>
            {isFiltered && (
              <p className="mp2-results-meta">
                Showing {filteredProjects.length} of {projects.length}
              </p>
            )}

            <LayoutGroup>
              <ul className="mp2-grid" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                <AnimatePresence initial={false} mode="popLayout">
                  {filteredProjects.map((p) => (
                    <motion.li
                      key={p.id}
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.93 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={
                        reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.93 }
                      }
                      transition={{
                        opacity: fadeTransition,
                        scale: fadeTransition,
                      }}
                      style={{ listStyle: "none" }}
                    >
                      <ProjectCard
                        project={p}
                        onClick={() => openProject(p)}
                        reduceMotion={reduceMotion}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>

                {filteredProjects.length === 0 && (
                  <motion.li
                    key="empty"
                    className="mp2-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={fadeTransition}
                  >
                    No projects match the current filters.
                  </motion.li>
                )}
              </ul>

              <AnimatePresence>
                {selectedProject && (
                  <ProjectModal
                    key={selectedProject.id}
                    project={selectedProject}
                    onClose={closeProject}
                    reduceMotion={reduceMotion}
                  />
                )}
              </AnimatePresence>
            </LayoutGroup>
          </>
        )}
      </div>
    </>
  );
}
