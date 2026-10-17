import { lazy, Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Seo from "@/components/Seo";
import {
  JourneyProgressProvider,
  useJourneyProgress,
} from "@/journey/JourneyProgressContext";
import JourneyScroll from "@/journey/JourneyScroll";
import StationHero from "@/journey/StationHero";
import StationWork from "@/journey/StationWork";
import StationExperience from "@/journey/StationExperience";
import StationSkills from "@/journey/StationSkills";
import StationAbout from "@/journey/StationAbout";
import StationContact from "@/journey/StationContact";
import { siteConfig } from "@/data/portfolio";

const JourneyCanvas = lazy(() => import("@/journey/JourneyCanvas"));

function FlyArriveBridge() {
  const navigate = useNavigate();
  const { onFlyArriveRef } = useJourneyProgress();

  useEffect(() => {
    onFlyArriveRef.current = (slug: string) => {
      navigate(`/work/${slug}`);
    };
    return () => {
      onFlyArriveRef.current = null;
    };
  }, [navigate, onFlyArriveRef]);

  return null;
}

/** Desktop scroll-driven 3D journey — dynamically imported so mobile never loads three/R3F. */
export default function JourneyLanding() {
  return (
    <JourneyProgressProvider>
      <JourneyScroll>
        <Seo path="/" />
        <FlyArriveBridge />

        <Suspense fallback={null}>
          <JourneyCanvas />
        </Suspense>

        <div
          id="journey-track"
          className="journey-track journey-mode"
          data-theme="dark"
        >
          <div className="journey-overlay">
            <StationHero />
            <StationWork />
            <StationExperience />
            <StationSkills />
            <StationAbout />
            <StationContact />
          </div>
        </div>

        <footer className="site-footer" role="contentinfo">
          <div className="container site-footer__inner">
            <p>
              © {new Date().getFullYear()} {siteConfig.name}
            </p>
            <a href="#hero">Back to top</a>
          </div>
        </footer>
      </JourneyScroll>
    </JourneyProgressProvider>
  );
}
