import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import { useMemo, useState } from "react";

export type WorkIndexItem = {
  slug: string;
  title: string;
  tags: string[];
  summary: string;
  date: string | null;
  /** Notion Cover URL, or a curated /legacy/ image from the server */
  imageUrl: string;
};

const base = import.meta.env.BASE_URL || "/";

export default function WorkFilter({ items }: { items: WorkIndexItem[] }) {
  const reduceMotion = useReducedMotion();

  const allTags = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    if (!selected.length) return items;
    return items.filter((i) => selected.every((t) => i.tags.includes(t)));
  }, [items, selected]);

  function toggle(tag: string) {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag],
    );
  }

  const layoutTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 420, damping: 34, mass: 0.85 };

  const fadeTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

  return (
    <div className="work-filter">
      <div className="work-filter__toolbar">
        <span className="work-filter__label" id="work-filter-label">
          Filter
        </span>
        <div
          className="work-filter__chips"
          role="group"
          aria-labelledby="work-filter-label"
        >
          <button
            type="button"
            className="tag-bar__all"
            aria-pressed={selected.length === 0}
            onClick={() => setSelected([])}
          >
            All
          </button>
          <div className="tag-bar-scroll">
            <div className="tag-bar tag-bar--hscroll">
              {allTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={selected.includes(t)}
                  onClick={() => toggle(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <LayoutGroup id="work-tiles">
        <ul className="work-grid work-grid--tiles">
          <AnimatePresence initial={false} mode="popLayout">
            {filtered.map((i) => (
              <motion.li
                key={i.slug}
                layout
                className="work-card"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                transition={{
                  layout: layoutTransition,
                  opacity: fadeTransition,
                  scale: fadeTransition,
                }}
              >
                <a
                  className="work-card__link"
                  href={`${base}work/${encodeURIComponent(i.slug)}/`}
                >
                  <div className="work-card__thumb">
                    <img
                      src={i.imageUrl}
                      alt=""
                      width="640"
                      height="400"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="work-card__body">
                    <h2 className="work-card__title">{i.title}</h2>
                    {i.summary ? (
                      <p className="work-card__summary">{i.summary}</p>
                    ) : null}
                    {i.date ? <p className="work-card__meta">{i.date}</p> : null}
                    {i.tags.length > 0 ? (
                      <div className="work-card__tags">
                        {i.tags.map((t) => (
                          <span key={t} className="work-card__tag">
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </a>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </LayoutGroup>

      <AnimatePresence>
        {filtered.length === 0 ? (
          <motion.p
            key="empty"
            className="work-empty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={fadeTransition}
          >
            No entries match the selected tags.
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
