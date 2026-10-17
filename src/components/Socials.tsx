import { Link } from "react-router-dom";
import { socialData } from "@/data/portfolio";

export default function Socials() {

  return (
    <div className="flex items-center gap-x-5 text-lg">
      {socialData.map((social) => {
        const isInternal = social.link.startsWith("/");
        const className =
          "hover:text-accent transition-colors duration-300 text-[color:var(--text-muted)]";
        if (isInternal) {
          return (
            <Link
              key={social.name}
              to={social.link}
              title={social.name}
              className={className}
            >
              <social.Icon aria-hidden />
              <span className="sr-only">{social.name}</span>
            </Link>
          );
        }
        return (
          <a
            key={social.name}
            title={social.name}
            href={social.link}
            target="_blank"
            rel="noreferrer noopener"
            className={className}
          >
            <social.Icon aria-hidden />
            <span className="sr-only">{social.name}</span>
          </a>
        );
      })}
    </div>
  );
}
