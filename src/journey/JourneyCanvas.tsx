import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { afterFirstPaint, isLowTier } from "@/utils/heroCapabilities";
import { shouldUseJourney3D } from "@/utils/journeyMode";

const JourneyScene = lazy(() => import("./JourneyScene"));

/** If WebGL context creation (or the scene) throws, ask Landing to swap in the static layout. */
class GlFallback extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    window.dispatchEvent(new Event("journey:fallback"));
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Fixed full-viewport R3F canvas behind HTML stations.
 * Boots after first paint so the hero particle field is visible immediately.
 * Pauses when the tab is hidden or the canvas leaves the viewport.
 * Weak devices (low power / touch / narrow) render at DPR 1 without the bloom pass.
 */
export default function JourneyCanvas() {
  const [ready, setReady] = useState(false);
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");
  const wrapRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);
  const [low] = useState(isLowTier);

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
      <GlFallback>
        <Canvas
          frameloop={frameloop}
          dpr={low ? [1, 1] : [1, 1.75]}
          camera={{ position: [0, 1.2, 8], fov: 45, near: 0.1, far: 80 }}
          gl={{
            antialias: false,
            alpha: false,
            powerPreference: low ? "default" : "high-performance",
            stencil: false,
            depth: true,
          }}
          style={{ width: "100%", height: "100%" }}
          onCreated={({ gl }) => {
            // GPU/driver reset or tab eviction: let the browser try to restore the context, else drop to the static layout
            const el = gl.domElement;
            let t = 0;
            el.addEventListener("webglcontextlost", (e) => {
              e.preventDefault();
              window.clearTimeout(t);
              t = window.setTimeout(() => window.dispatchEvent(new Event("journey:fallback")), 2500);
            });
            el.addEventListener("webglcontextrestored", () => window.clearTimeout(t));
          }}
        >
          <Suspense fallback={null}>
            <JourneyScene />
          </Suspense>
        </Canvas>
      </GlFallback>
    </div>
  );
}
