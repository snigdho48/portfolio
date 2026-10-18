import { scrollNav } from "@/journey/scrollNav";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import Socials from "./Socials";
import { navSections, siteConfig } from "@/data/portfolio";

export default function SiteNav() {
  const { pathname, hash } = useLocation();
  const onLanding = pathname === "/";
  const [active, setActive] = useState("hero");

  useEffect(() => {
    if (!onLanding) return;

    const ids = navSections.map((s) => s.id);
    let raf = 0;
    let current = "";
    // Active section = the one crossing the viewport's vertical centre
    // (robust for the tall pinned Work section and for jump-scrolls).
    const compute = () => {
      raf = 0;
      const mid = window.innerHeight * 0.5;
      let found = "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) {
          found = id;
          break;
        }
      }
      if (found && found !== current) {
        current = found;
        setActive(found);
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // sections mount lazily (journey chunk): re-check for a while
    const timer = window.setInterval(compute, 400);
    compute();

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };  }, [onLanding]);

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const el = document.getElementById(id);
      if (!scrollNav.toSection(id)) el?.scrollIntoView({ behavior: "smooth" });
    }
  }, [hash, pathname]);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="brand-mark" aria-label="Snigdho home">
          Snigdho<span>.</span>
        </Link>

        {onLanding && (
          <nav className="site-nav" aria-label="Sections">
            <ul>
              {navSections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className={`nav-link ${active === section.id ? "is-active" : ""}`}
                    aria-current={active === section.id ? "true" : undefined}
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="site-header__actions">
          {!onLanding && (
            <Link to="/#work" className="nav-link">
              Work
            </Link>
          )}
          <a
            href={siteConfig.cvPath}
            className="nav-link nav-link--cv"
            download
          >
            CV
          </a>
          <kbd className="nav-kbd" title="Command palette">
            Ctrl+K
          </kbd>
          <Socials />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
