import KineticLines from "@/components/KineticLines";
import { skillGroups } from "@/data/portfolio";

export default function Skills() {
  return (
    <section id="skills" className="section" aria-labelledby="skills-heading">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Skills</p>
          <div id="skills-heading">
            <KineticLines as="h2" className="h2">
              {`Core competencies\nfrom the CV.`}
            </KineticLines>
          </div>
        </div>

        <div className="skills-grid">
          {skillGroups.map((group) => (
            <article key={group.title} className="skill-card">
              <h3 className="h3">{group.title}</h3>
              <ul className="stack-chips">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
