import { lazy, Suspense, useEffect, useState } from "react";
import Seo from "@/components/Seo";
import StaticLanding from "@/pages/StaticLanding";
import { shouldUseStaticLanding } from "@/utils/journeyMode";

/** Journey path is a separate chunk (three / R3F load only when WebGL exists). */
const JourneyLanding = lazy(() => import("./JourneyLanding"));

function resolveLandingMode(): "static" | "journey" {
  return shouldUseStaticLanding() ? "static" : "journey";
}

/**
 * The 3D journey is used on every device. The static landing is a last resort for when WebGL is
 * unavailable, or when creating the WebGL context throws (JourneyCanvas dispatches "journey:fallback").
 */
export default function Landing() {
  const [mode, setMode] = useState(resolveLandingMode);

  useEffect(() => {
    const onFail = () => setMode("static");
    window.addEventListener("journey:fallback", onFail);
    return () => window.removeEventListener("journey:fallback", onFail);
  }, []);

  if (mode === "static") {
    return <StaticLanding />;
  }

  return (
    <Suspense fallback={<Seo path="/" />}>
      <JourneyLanding />
    </Suspense>
  );
}
