import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import KineticLines from "@/components/KineticLines";
import ScreenshotGallery from "@/components/ScreenshotGallery";
import ShotImg from "@/components/ShotImg";
import Seo from "@/components/Seo";
import {
  getAdjacentProjects,
  getProjectBySlug,
  siteConfig,
} from "@/data/portfolio";
import {
  afterEngagement,
  prefersReducedMotion,
} from "@/utils/heroCapabilities";

export default function CaseStudy() {
  const { slug = "" } = useParams();
  const project = getProjectBySlug(slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (!project) return;
    if (prefersReducedMotion()) return;

    let revert: (() => void) | undefined;
    let cancelled = false;

    const cancelIdle = afterEngagement(() => {
      void (async () => {
        const gsapMod = await import("gsap");
        if (cancelled) return;
        const gsap = gsapMod.default;
        const tween = gsap.from(".case-study__reveal", {
          y: 28,
          opacity: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power2.out",
          clearProps: "all",
        });
        revert = () => {
          tween.kill();
        };
      })();
    });

    return () => {
      cancelled = true;
      cancelIdle();
      revert?.();
    };
  }, [slug, project]);

  if (!project) {
    return <Navigate to="/" replace />;
  }

  const { prev, next } = getAdjacentProjects(slug);
  const description = project.purpose
    .replace(/\s*\[PLACEHOLDER:[^\]]*\]/gi, "")
    .trim();

  return (
    <article className="case-study">
      <Seo
        title={project.title}
        description={description}
        path={`/work/${project.slug}`}
        image={siteConfig.ogImage}
        type="article"
      />

      <header className="case-hero">
        <div className="container case-hero__inner">
          <Link to="/#work" className="case-study__back case-study__reveal">
            ← Selected work
          </Link>

          <p className="eyebrow case-study__reveal">Case study</p>
          <KineticLines as="h1" className="h1 case-hero__title">
            {project.title}
          </KineticLines>

          <p className="case-hero__lede case-study__reveal">{project.purpose}</p>

          <div className="case-hero__actions case-study__reveal">
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="btn-primary"
            >
              Live project ↗
            </a>
            <a href="#gallery" className="btn-ghost">
              View screenshots
            </a>
            {project.contributionsArePlaceholder && (
              <span className="placeholder-badge placeholder-badge--inline">
                [PLACEHOLDER contributions]
              </span>
            )}
          </div>

          <ul className="stack-chips case-hero__stack case-study__reveal" aria-label="Tech stack preview">
            {project.stack.slice(0, 6).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="case-hero__cover container case-study__reveal">
          <button
            type="button"
            className="case-hero__cover-btn"
            onClick={() => {
              document.getElementById("gallery")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
            aria-label="Jump to screenshot gallery"
          >
            <ShotImg
              src={project.screenshots[0]?.src ?? ""}
              alt={project.screenshots[0]?.alt ?? ""}
              box={16 / 9}
              framed={project.screenshots[0]?.framed}
              eager
            />
            {project.screenshots[0]?.isPlaceholder && (
              <span className="placeholder-badge">[PLACEHOLDER]</span>
            )}
          </button>
        </div>
      </header>

      <div className="container case-study__body">
        <section className="case-study__block case-study__reveal" id="purpose">
          <h2 className="h3">Purpose</h2>
          <p>{project.purpose}</p>
        </section>

        <section className="case-study__block case-study__reveal" id="contributions">
          <h2 className="h3">
            Contributions
            {project.contributionsArePlaceholder && (
              <span className="placeholder-badge placeholder-badge--inline">
                [PLACEHOLDER]
              </span>
            )}
          </h2>
          <ol className="case-contrib">
            {project.contributions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>
        </section>

        <section className="case-study__block case-study__reveal" id="stack">
          <h2 className="h3">Tech stack</h2>
          <ul className="stack-chips stack-chips--lg">
            {project.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        <div id="gallery" className="case-study__reveal">
          <ScreenshotGallery
            images={project.screenshots}
            projectTitle={project.title}
          />
        </div>

        <nav className="case-study__nav case-study__reveal" aria-label="Project pagination">
          {prev ? (
            <Link to={`/work/${prev.slug}`} className="case-pager case-pager--prev">
              <span className="case-pager__label">Previous</span>
              <span className="case-pager__title">← {prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`/work/${next.slug}`} className="case-pager case-pager--next">
              <span className="case-pager__label">Next</span>
              <span className="case-pager__title">{next.title} -&gt;</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </article>
  );
}
