import KineticLines from "@/components/KineticLines";
import { siteConfig } from "@/data/portfolio";

export default function HowIWork() {
  return (
    <section id="how" className="section" aria-labelledby="how-heading">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">How I work</p>
          <div id="how-heading">
            <KineticLines as="h2" className="h2">
              {`Production ownership\n& mentorship.`}
            </KineticLines>
          </div>
          <p className="section-lead">
            From the CV — how I show up on real teams and live systems.
          </p>
        </div>

        <ol className="how-list">
          {siteConfig.howIWork.map((item, i) => (
            <li key={item} className="how-list__item">
              <span className="how-list__num" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <p>{item}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
