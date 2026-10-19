import { lazy, Suspense, useEffect, useState } from "react";
import {
  afterFirstPaint,
  isCoarsePointer,
  prefersReducedMotion,
} from "@/utils/heroCapabilities";

const Loader = lazy(() => import("./Loader"));
const CustomCursor = lazy(() => import("./CustomCursor"));
const CursorTrail = lazy(() => import("./CursorTrail"));
const Magnetic = lazy(() => import("./Magnetic"));
const TitleAssemble = lazy(() => import("./TitleAssemble"));
const ScrollRing = lazy(() => import("./ScrollRing"));
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
      <Loader />
      {!reduce && !coarse && <CustomCursor />}
      {!reduce && !coarse && <CursorTrail />}
      {!reduce && !coarse && <Magnetic />}
      {!reduce && <TitleAssemble />}
      <ScrollRing />
      <CommandPalette />
    </Suspense>
  );
}
