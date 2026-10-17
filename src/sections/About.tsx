import KineticLines from "@/components/KineticLines";
import { education, languages, siteConfig } from "@/data/portfolio";

export default function About() {
  return (
    <section id="about" className="section" aria-labelledby="about-heading">
      <div className="container about-grid">
        <div>
          <p className="eyebrow">About</p>
          <div id="about-heading">
            <KineticLines as="h2" className="h2">
              {`Engineer who owns\nthe backend.`}
            </KineticLines>
          </div>
          <p className="section-lead">{siteConfig.bio}</p>
          <p className="about-availability">{siteConfig.availability}</p>
        </div>

        <div className="about-aside">
          <figure className="about-portrait">
            <img
              src={siteConfig.avatar}
              alt={`${siteConfig.name} portrait`}
              width={400}
              height={400}
              loading="lazy"
              decoding="async"
            />
          </figure>
          <div className="about-block">
            <h3 className="h3">Education</h3>
            <p>
              {education.degree}
              <br />
              {education.school}
              <br />
              {education.period} | {education.location}
              <br />
              GPA {education.gpa}
            </p>
          </div>
          <div className="about-block">
            <h3 className="h3">Languages</h3>
            <ul>
              {languages.map((lang) => (
                <li key={lang.name}>
                  {lang.name} - {lang.level}
                </li>
              ))}
            </ul>
          </div>
          <div className="about-block">
            <h3 className="h3">Based in</h3>
            <p>{siteConfig.location}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
