import { lazy, Suspense, useState } from "react";
import Seo from "@/components/Seo";
import StaticLanding from "@/pages/StaticLanding";
import { shouldUseStaticLanding } from "@/utils/journeyMode";

/** Journey path is a separate chunk — never pulled in on StaticLanding / mobile. */
const JourneyLanding = lazy(() => import("./JourneyLanding"));

function resolveLandingMode(): "static" | "journey" {
  return shouldUseStaticLanding() ? "static" : "journey";
}

/**
 * Sync mode on first client render (no pending empty frame).
 * Mobile / reduced-motion / no-WebGL → StaticLanding only.
 */
export default function Landing() {
  const [mode] = useState(resolveLandingMode);

  if (mode === "static") {
    return <StaticLanding />;
  }

  return (
    <Suspense fallback={<Seo path="/" />}>
      <JourneyLanding />
    </Suspense>
  );
}
