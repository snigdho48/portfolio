import { Link } from "react-router-dom";
import ShotImg from "@/components/ShotImg";
import KineticLines from "@/components/KineticLines";
import { projects } from "@/data/portfolio";

export default function SelectedWork() {
  return (
    <section id="work" className="section" aria-labelledby="work-heading">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Selected work</p>
          <div id="work-heading">
            <KineticLines as="h2" className="h2">
              {`Systems shipped\nin production.`}
            </KineticLines>
          </div>
          <p className="section-lead">
            Eight case studies, from OOH analytics to identity, media and mobile apps.
          </p>
        </div>

        <ul className="work-grid">
          {projects.map((project) => (
            <li key={project.slug}>
              <article className="work-card">
                <Link to={`/work/${project.slug}`} className="work-card__link">
                  <div className="work-card__media">
                    <ShotImg
                      src={project.screenshots[0]?.src ?? ""}
                      alt={project.screenshots[0]?.alt ?? ""}
                      box={1.6}
                      framed={project.screenshots[0]?.framed}
                      sizes="(max-width: 900px) 100vw, 420px"
                    />
                    {project.screenshots[0]?.isPlaceholder && (
                      <span className="placeholder-badge">[PLACEHOLDER]</span>
                    )}
                  </div>
                  <div className="work-card__body">
                    <div className="work-card__top">
                      <h3 className="h3">{project.title}</h3>
                      {project.contributionsArePlaceholder && (
                        <span className="placeholder-badge placeholder-badge--inline">
                          [PLACEHOLDER bullets]
                        </span>
                      )}
                    </div>
                    <p>{project.purpose}</p>
                    <ul className="stack-chips" aria-label="Tech stack">
                      {project.stack.slice(0, 5).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <span className="work-card__cta">Case study -&gt;</span>
                  </div>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
