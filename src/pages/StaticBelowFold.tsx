import NowStrip from "@/sections/NowStrip";
import SelectedWork from "@/sections/SelectedWork";
import HowIWork from "@/sections/HowIWork";
import Experience from "@/sections/Experience";
import Skills from "@/sections/Skills";
import About from "@/sections/About";
import Contact from "@/sections/Contact";
import { siteConfig } from "@/data/portfolio";

/** Below-fold static sections — separate chunk from the hero first paint. */
export default function StaticBelowFold() {
  return (
    <>
      <NowStrip />
      <SelectedWork />
      <HowIWork />
      <Experience />
      <Skills />
      <About />
      <Contact />

      <footer className="site-footer" role="contentinfo">
        <div className="container site-footer__inner">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
          <a href="#hero">Back to top</a>
        </div>
      </footer>
    </>
  );
}
