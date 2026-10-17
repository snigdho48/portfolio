import KineticLines from "@/components/KineticLines";
import { experience } from "@/data/portfolio";

export default function Experience() {
  return (
    <section id="experience" className="section" aria-labelledby="experience-heading">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Experience</p>
          <div id="experience-heading">
            <KineticLines as="h2" className="h2">
              {`Ownership across\nproduction systems.`}
            </KineticLines>
          </div>
        </div>

        <ol className="timeline">
          {experience.map((job) => (
            <li key={`${job.company}-${job.period}`} className="timeline__item">
              <div className="timeline__meta">
                <h3 className="h3">{job.role}</h3>
                <p className="timeline__company">
                  {job.company} | {job.location}
                </p>
                <p className="timeline__period">{job.period}</p>
              </div>
              <ul className="timeline__bullets">
                {job.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
