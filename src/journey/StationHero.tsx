import KineticLines from "@/components/KineticLines";
import { siteConfig } from "@/data/portfolio";

/** Hero overlay: centred wordmark + subtitle over the particle waves. Opacity is driven by CSS vars. */
export default function StationHero() {
  return (
    <section
      id="hero"
      className="journey-station journey-station--hero"
      aria-label="Introduction"
    >
      <div className="journey-station__inner journey-hero">
        <KineticLines as="h1" className="h1 journey-hero__title" delay={0.05}>
          SNIGDHO
        </KineticLines>
        <p className="journey-hero__sub">
          <span>{siteConfig.title}</span>
          <i className="journey-hero__dot" aria-hidden />
          <span>Full-Stack</span>
          <i className="journey-hero__dot" aria-hidden />
          <span>Cloud</span>
        </p>
      </div>
      <a href="#work" className="journey-hero__cue" aria-label="Scroll to work">
        <span className="journey-hero__cue-ring">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m6 9.5 6 6 6-6" />
          </svg>
        </span>
        <span className="journey-hero__cue-line" />
        <span className="journey-hero__cue-word">Scroll</span>
      </a>
    </section>
  );
}