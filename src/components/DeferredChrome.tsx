import { lazy, Suspense, useEffect, useState } from "react";
import {
  afterFirstPaint,
  isCoarsePointer,
  prefersReducedMotion,
} from "@/utils/heroCapabilities";

const Preloader = lazy(() => import("./Preloader"));
const CustomCursor = lazy(() => import("./CustomCursor"));
const CommandPalette = lazy(() => import("./CommandPalette"));

/**
 * Non-critical chrome — loaded after first paint so mobile StaticLanding
 * doesn't pay for cmdk / cursor / preloader on the critical path.
 */
export default function DeferredChrome() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return afterFirstPaint(() => setReady(true));
  }, []);

  if (!ready) return null;

  const coarse = isCoarsePointer();
  const reduce = prefersReducedMotion();

  return (
    <Suspense fallback={null}>
      {!reduce && !coarse && <Preloader />}
      {!reduce && !coarse && <CustomCursor />}
      <CommandPalette />
    </Suspense>
  );
}
