import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { afterFirstPaint } from "@/utils/heroCapabilities";
import { shouldUseJourney3D } from "@/utils/journeyMode";

const JourneyScene = lazy(() => import("./JourneyScene"));

/**
 * Fixed full-viewport R3F canvas behind HTML stations.
 * Boots after first paint so the hero particle field is visible immediately
 * (journey mode only — mobile never mounts this via Landing split).
 * Pauses when the tab is hidden or the canvas leaves the viewport.
 */
export default function JourneyCanvas() {
  const [ready, setReady] = useState(false);
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");
  const wrapRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    if (!shouldUseJourney3D()) return;
    return afterFirstPaint(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const el = wrapRef.current;
    if (!el) return;

    const sync = () => {
      const on = !document.hidden && visibleRef.current;
      setFrameloop(on ? "always" : "never");
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry?.isIntersecting ?? false;
        sync();
      },
      { threshold: 0 },
    );
    io.observe(el);

    const onVis = () => sync();
    document.addEventListener("visibilitychange", onVis);
    sync();

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ready]);

  if (!ready) return null;

  return (
    <div ref={wrapRef} className="journey-canvas" aria-hidden>
      <Canvas
        frameloop={frameloop}
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.2, 8], fov: 45, near: 0.1, far: 80 }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={null}>
          <JourneyScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
