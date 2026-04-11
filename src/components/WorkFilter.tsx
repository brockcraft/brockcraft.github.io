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

  return (
    <div className="work-filter">
      {allTags.length > 0 ? (
        <div className="tag-bar" role="group" aria-label="Filter by tag">
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
      ) : null}

      <ul className="work-grid">
        {filtered.map((i) => (
          <li key={i.slug} className="work-card">
            <a className="work-card__link" href={`${base}work/${encodeURIComponent(i.slug)}/`}>
              <div className="work-card__thumb">
                <img src={i.imageUrl} alt="" width="640" height="400" loading="lazy" decoding="async" />
              </div>
              <div className="work-card__body">
                <h2 className="work-card__title">{i.title}</h2>
                {i.summary ? <p className="work-card__summary">{i.summary}</p> : null}
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
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="work-empty">No entries match the selected tags.</p>
      ) : null}
    </div>
  );
}
