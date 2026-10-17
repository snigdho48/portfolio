import { education, languages, siteConfig } from "@/data/portfolio";

/** Calmer HTML overlay for About - soft 3D field behind. */
export default function StationAbout() {
  return (
    <section
      id="about"
      className="journey-station journey-station--about"
      aria-label="About"
    >
      <div className="journey-station__inner journey-about">
        <p className="journey-eyebrow">About</p>
        <h2 className="journey-h2">The quieter stretch.</h2>
        <p className="journey-lead journey-lead--wide">{siteConfig.bio}</p>
        <div className="journey-glass-cards journey-glass-cards--about">
          <article className="journey-glass-card">
            <h3 className="h3">Education</h3>
            <p>{education.degree}</p>
            <p className="journey-glass-card__meta">
              {education.school} | {education.period} | {education.location}
            </p>
            <p>GPA {education.gpa}</p>
          </article>
          <article className="journey-glass-card">
            <h3 className="h3">Languages</h3>
            <ul>
              {languages.map((lang) => (
                <li key={lang.name}>
                  {lang.name} - {lang.level}
                </li>
              ))}
            </ul>
          </article>
          <article className="journey-glass-card">
            <h3 className="h3">Now</h3>
            <p>{siteConfig.now.role}</p>
            <p className="journey-glass-card__meta">
              {siteConfig.now.location} | {siteConfig.now.status}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
