import { useEffect, useMemo, useState } from "react";
import { experience } from "@/data/portfolio";
import { EXP_EVENT, goToExpIndex } from "./expScroll";

/** Big label per role: the first year of the period, or "Present" for the current role. */
function yearLabel(period: string): string {
  if (/present/i.test(period)) return "Present";
  return period.match(/\d{4}/)?.[0] ?? period;
}

const dash = (s: string) => s.replace(/\s-\s/g, " \u2013 ");

/**
 * Pinned Experience sequence (same pattern as Work): the left column stays
 * locked and swaps per role while a glowing ball travels the 3D path. The 3D
 * timeline writes each node's screen position to the year labels in the
 * fixed layer. All text comes from portfolio.ts.
 */
export default function StationExperience() {
  // CV lists newest first; the path climbs from the earliest role to today.
  const list = useMemo(() => [...experience].reverse(), []);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const on = (e: Event) => setIdx((e as CustomEvent<number>).detail);
    window.addEventListener(EXP_EVENT, on);
    return () => window.removeEventListener(EXP_EVENT, on);
  }, []);

  const job = list[Math.min(idx, list.length - 1)];
  const n = String(idx + 1).padStart(2, "0");
  const total = String(list.length).padStart(2, "0");

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      goToExpIndex(Math.min(list.length - 1, idx + 1));
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      goToExpIndex(Math.max(0, idx - 1));
    }
  };

  return (
    <section
      id="experience"
      className="journey-station journey-station--experience"
      aria-label="Experience"
    >
      <div className="work-pin exp-pin">
        <div className="journey-station__inner journey-col">
          <p className="journey-eyebrow">Experience</p>
          <p className="work-counter" aria-hidden>
            <b>{n}</b> / {total}
          </p>
          <div key={`${job.company}-${job.period}`} className="work-meta" aria-live="polite">
            <p className="exp-year-big work-swap">{yearLabel(job.period)}</p>
            <h2 className="work-name work-swap work-swap--2">{job.company}</h2>
            <p className="exp-role work-swap work-swap--2">
              <span>{job.role}</span>
              <i aria-hidden />
              <span>{dash(job.period)}</span>
            </p>
            <ul className="exp-bullets work-swap work-swap--3">
              {job.bullets.slice(0, 4).map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          <div className="work-dots" role="group" aria-label="Roles" onKeyDown={onKey}>
            {list.map((q, i) => (
              <button
                key={`${q.company}-${q.period}`}
                type="button"
                className="work-dot"
                aria-label={`${yearLabel(q.period)} ${q.company}`}
                aria-current={i === idx}
                onClick={() => goToExpIndex(i)}
              />
            ))}
          </div>
          <p className="journey-scroll-hint">
            <span>Scroll to explore</span>
            <span aria-hidden>&darr;</span>
            <i aria-hidden />
          </p>
        </div>
      </div>

      <div className="journey-exp-layer" aria-hidden>
        {list.map((q, i) => (
          <div key={`${q.company}-${q.period}`} className="journey-exp-anchor" data-exp-anchor={i}>
            <p className="journey-exp-year">{yearLabel(q.period)}</p>
          </div>
        ))}
      </div>

      {/* every role stays available to assistive tech */}
      <ul className="journey-sr-only">
        {list.map((q) => (
          <li key={`${q.company}-${q.period}`}>
            {q.company}, {q.role}, {q.period}: {q.bullets.join(" ")}
          </li>
        ))}
      </ul>
    </section>
  );
}