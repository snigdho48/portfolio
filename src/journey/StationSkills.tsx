import { skillsTip } from "./skillsTip";
import { useEffect, useRef } from "react";
import { projects, siteConfig, skillGroups } from "@/data/portfolio";

/** Years of experience, read from the CV bio (never hard-coded). */
const years = siteConfig.bio.match(/(\d+)\s+years/)?.[1] ?? "3";
/** Second sentence of the CV bio: what the stack is. */
const lead = siteConfig.bio.split(". ")[1] ?? siteConfig.bio;
/** Every skill listed in the CV skill groups. */
const skillCount = skillGroups.reduce((n, g) => n + g.items.length, 0);

const icon = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
  "aria-hidden": true,
} as const;

const stats = [
  {
    value: `${years}+`,
    label: "Years exp.",
    svg: (
      <svg {...icon}>
        <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" />
        <path d="m3 12 9 4.5 9-4.5" />
        <path d="m3 16.5 9 4.5 9-4.5" />
      </svg>
    ),
  },
  {
    value: String(projects.length),
    label: "Projects",
    svg: (
      <svg {...icon}>
        <path d="m8 7-5 5 5 5" />
        <path d="m16 7 5 5-5 5" />
        <path d="m14 4-4 16" />
      </svg>
    ),
  },
  {
    value: `${skillCount}`,
    label: "Skills listed",
    svg: (
      <svg {...icon}>
        <rect x="5" y="5" width="14" height="14" rx="2" />
        <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </svg>
    ),
  },
];

/** Copy column on the left - the 3D energy sphere + glass tiles fill the right. */
export default function StationSkills() {
  const ref = useRef<HTMLElement>(null);

  // Footer progress bar: how far the visitor is through this station (no React state).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      el.style.setProperty("--skills-p", p.toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="skills"
      ref={ref}
      className="journey-station journey-station--skills"
      aria-label="Skills"
    >
      <div className="journey-station__inner journey-col">
        <p className="journey-eyebrow">Skills &amp; Technologies</p>
        <h2 className="journey-h2 skills-h2">
          <span>Building solutions</span> <span>with the right <em>tools</em></span>
        </h2>
        <p className="journey-lead">{lead}.</p>
        <a href="#work" className="skills-link">
          View projects <span aria-hidden>&rarr;</span>
        </a>
        <dl className="skills-stats">
          {stats.map((s) => (
            <div key={s.label} className="skills-stats__item">
              <span className="skills-stats__icon">{s.svg}</span>
              <div>
                <dd>{s.value}</dd>
                <dt>{s.label}</dt>
              </div>
            </div>
          ))}
        </dl>
        {/* full CV competency list stays available to assistive tech */}
        <ul className="journey-sr-only">
          {skillGroups.map((g) => (
            <li key={g.title}>
              {g.title}: {g.items.join(", ")}
            </li>
          ))}
        </ul>
      </div>
      <div className="skills-foot" aria-hidden>
        <div className="skills-progress">
          <span>01</span>
          <i><b /></i>
          <span>04</span>
        </div>
        <div className="skills-hint">
          <svg viewBox="0 0 16 24" width="16" height="24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="1.5" y="1.5" width="13" height="21" rx="6.5" />
            <path d="M8 6v4" strokeLinecap="round" />
          </svg>
          <span>Scroll to explore</span>
        </div>
      </div>
      <div className="skills-tip" role="tooltip" ref={(el) => { skillsTip.el = el; }} />
    </section>
  );
}