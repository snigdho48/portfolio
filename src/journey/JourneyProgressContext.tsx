import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import * as THREE from "three";

export type FlyTarget = {
  slug: string;
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
};

type JourneyProgressContextValue = {
  /** Smoothed camera progress 0–1 (read each frame). */
  progressRef: MutableRefObject<number>;
  /** Scroll-driven target progress 0–1. */
  targetProgressRef: MutableRefObject<number>;
  setTargetProgress: (t: number) => void;
  /** Pointer NDC for parallax / cursor glow (−1…1). */
  pointerRef: MutableRefObject<{ x: number; y: number }>;
  setPointer: (x: number, y: number) => void;
  /** Active click-to-fly override (null = follow scroll path). */
  flyTargetRef: MutableRefObject<FlyTarget | null>;
  flyActiveRef: MutableRefObject<boolean>;
  /** Ensures onFlyArrive fires once per flight. */
  flyArrivePendingRef: MutableRefObject<boolean>;
  startFlyTo: (target: FlyTarget) => void;
  /** Set by Landing — called once camera arrives at a panel. */
  onFlyArriveRef: MutableRefObject<((slug: string) => void) | null>;
  /** Work pin: scroll-driven target index (0..n-1, eased) and its smoothed value. */
  workTargetRef: MutableRefObject<number>;
  workIndexRef: MutableRefObject<number>;
  /** Experience pin: eased target index (0..n-1) and its smoothed value. */
  expTargetRef: MutableRefObject<number>;
  expIndexRef: MutableRefObject<number>;
};

const JourneyProgressContext =
  createContext<JourneyProgressContextValue | null>(null);

export function JourneyProgressProvider({ children }: { children: ReactNode }) {
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const flyTargetRef = useRef<FlyTarget | null>(null);
  const flyActiveRef = useRef(false);
  const flyArrivePendingRef = useRef(false);
  const onFlyArriveRef = useRef<((slug: string) => void) | null>(null);
  const workTargetRef = useRef(0);
  const workIndexRef = useRef(0);
  const expTargetRef = useRef(0);
  const expIndexRef = useRef(0);

  const setTargetProgress = useCallback((t: number) => {
    if (flyActiveRef.current) return;
    targetProgressRef.current = Math.min(1, Math.max(0, t));
  }, []);

  const setPointer = useCallback((x: number, y: number) => {
    pointerRef.current.x = x;
    pointerRef.current.y = y;
  }, []);

  const startFlyTo = useCallback((target: FlyTarget) => {
    flyTargetRef.current = {
      slug: target.slug,
      position: target.position.clone(),
      lookAt: target.lookAt.clone(),
    };
    flyActiveRef.current = true;
    flyArrivePendingRef.current = true;
  }, []);

  const value = useMemo(
    () => ({
      progressRef,
      targetProgressRef,
      setTargetProgress,
      pointerRef,
      setPointer,
      flyTargetRef,
      flyActiveRef,
      flyArrivePendingRef,
      startFlyTo,
      onFlyArriveRef,
      workTargetRef,
      workIndexRef,
      expTargetRef,
      expIndexRef,
    }),
    [setTargetProgress, setPointer, startFlyTo],
  );

  return (
    <JourneyProgressContext.Provider value={value}>
      {children}
    </JourneyProgressContext.Provider>
  );
}

export function useJourneyProgress() {
  const ctx = useContext(JourneyProgressContext);
  if (!ctx) {
    throw new Error("useJourneyProgress must be used within JourneyProgressProvider");
  }
  return ctx;
}
