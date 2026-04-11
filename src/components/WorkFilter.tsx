import { useMemo, useState } from "react";

export type WorkIndexItem = {
  slug: string;
  title: string;
  tags: string[];
  summary: string;
  date: string | null;
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
    <div>
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
      <ul className="work-list">
        {filtered.map((i) => (
          <li key={i.slug}>
            <a href={`${base}work/${encodeURIComponent(i.slug)}/`}>
              {i.title}
            </a>
            {i.summary ? <p className="summary">{i.summary}</p> : null}
            {i.date ? <p className="meta">{i.date}</p> : null}
          </li>
        ))}
      </ul>
      {filtered.length === 0 ? (
        <p className="summary">No entries match the selected tags.</p>
      ) : null}
    </div>
  );
}
