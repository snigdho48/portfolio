import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ordered } from "./workPath";
import { WORK_EVENT, goToWorkIndex } from "./workScroll";

/**
 * Pinned Work sequence: this column stays locked while the page scrolls and
 * swaps content per active project; the 3D panels advance along the path.
 * Content comes only from portfolio.ts.
 */
export default function StationWork() {
  const list = useMemo(() => ordered(), []);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const on = (e: Event) => setIdx((e as CustomEvent<number>).detail);
    window.addEventListener(WORK_EVENT, on);
    return () => window.removeEventListener(WORK_EVENT, on);
  }, []);

  const p = list[Math.min(idx, list.length - 1)];
  const cover = p.screenshots[0];
  const purpose = p.purpose.split(/(?<=\.)\s/)[0];
  const n = String(idx + 1).padStart(2, "0");
  const total = String(list.length).padStart(2, "0");

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      goToWorkIndex(Math.min(list.length - 1, idx + 1));
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      goToWorkIndex(Math.max(0, idx - 1));
    }
  };

  return (
    <section
      id="work"
      className="journey-station journey-station--work"
      aria-label="Featured work"
    >
      <div className="work-pin">
        <div className="journey-station__inner journey-col">
          <p className="journey-eyebrow">Featured work</p>
          <p className="work-counter" aria-hidden>
            <b>{n}</b> / {total}
          </p>
          <div key={p.slug} className="work-meta" aria-live="polite">
            <h2 className="work-name work-swap">{p.title}</h2>
            <p className="journey-lead work-swap work-swap--2">{purpose}</p>
            <ul className="work-chips work-swap work-swap--3" aria-label="Stack">
              {p.stack.slice(0, 6).map((s) => (
                <li key={s} className="work-chip">
                  {s}
                </li>
              ))}
            </ul>
            <div className="work-swap work-swap--4">
              <Link to={`/work/${p.slug}`} className="journey-cta">
                View case study <span aria-hidden>&rarr;</span>
              </Link>
              {cover?.isPlaceholder && (
                <span className="placeholder-badge placeholder-badge--inline work-ph">
                  [PLACEHOLDER] cover pending
                </span>
              )}
            </div>
          </div>
          <div
            className="work-dots"
            role="group"
            aria-label="Projects"
            onKeyDown={onKey}
          >
            {list.map((q, i) => (
              <button
                key={q.slug}
                type="button"
                className="work-dot"
                aria-label={`${String(i + 1).padStart(2, "0")} ${q.title}`}
                aria-current={i === idx}
                onClick={() => goToWorkIndex(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}