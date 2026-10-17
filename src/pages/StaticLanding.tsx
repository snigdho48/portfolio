import { lazy, Suspense, useEffect, useState } from "react";
import Seo from "@/components/Seo";
import { siteConfig } from "@/data/portfolio";
import { afterFirstPaint } from "@/utils/heroCapabilities";

const StaticBelowFold = lazy(() => import("./StaticBelowFold"));

/**
 * Fully visible static landing for reduced-motion / mobile / no-WebGL.
 * Hero paints immediately; below-fold sections load after first paint.
 */
export default function StaticLanding() {
  const [below, setBelow] = useState(false);

  useEffect(() => {
    return afterFirstPaint(() => setBelow(true));
  }, []);

  return (
    <>
      <Seo path="/" />

      <section id="hero" className="section section--hero" aria-label="Introduction">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{siteConfig.title}</p>
            <h1 className="h1 hero-title">SNIGDHO</h1>
            <p className="hero-bio">
              {siteConfig.tagline}. {siteConfig.headline.replace("\n", " ")}
            </p>
            <p className="hero-bio">{siteConfig.bio}</p>
            <div className="hero-cta">
              <a href="#work" className="btn-primary">
                View work
              </a>
              <a href="#contact" className="btn-ghost">
                Contact
              </a>
              <a
                href={siteConfig.cvPath}
                className="btn-link"
                download
                target="_blank"
                rel="noreferrer"
              >
                Download CV
              </a>
            </div>
            <p className="hero-meta">
              {siteConfig.now.role}
              {" | "}
              {siteConfig.now.location}
              {" | "}
              <span className="journey-hero__status">{siteConfig.now.status}</span>
            </p>
          </div>
        </div>
      </section>

      {below && (
        <Suspense fallback={null}>
          <StaticBelowFold />
        </Suspense>
      )}
    </>
  );
}
