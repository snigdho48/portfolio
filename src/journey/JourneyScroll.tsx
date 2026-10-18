import { useEffect, type ReactNode } from "react";
import { afterFirstPaint } from "@/utils/heroCapabilities";
import { useJourneyProgress } from "./JourneyProgressContext";
import { updateStationOpacity } from "./updateStationOpacity";
import { fx } from "./scrollFx";
import { experience, projects } from "@/data/portfolio";
import { EXP_EVENT, expScroll } from "./expScroll";
import { expIndexAt } from "./expTimeline";
import { WORK_EVENT, easeProject, workScroll } from "./workScroll";

/**
 * Lenis + GSAP ScrollTrigger scrub -> journey target progress.
 * One shared gsap.ticker drives lenis.raf.
 * Station opacity is updated from the same onUpdate (no per-frame React state).
 */
export default function JourneyScroll({ children }: { children: ReactNode }) {
  const { setTargetProgress, setPointer, workTargetRef, expTargetRef } = useJourneyProgress();

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -((e.clientY / window.innerHeight) * 2 - 1);
      setPointer(x, y);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => window.removeEventListener("pointermove", onPointer);
  }, [setPointer]);

  useEffect(() => {
    let destroy: (() => void) | undefined;
    let cancelled = false;

    const applyProgress = (progress: number) => {
      setTargetProgress(progress);
      updateStationOpacity(progress);
    };

    // Initial paint before Lenis boots
    applyProgress(0);

    const cancel = afterFirstPaint(() => {
      void (async () => {
        const [{ default: Lenis }, gsapMod, stMod] = await Promise.all([
          import("lenis"),
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
        if (cancelled) return;

        const gsap = gsapMod.default;
        const { ScrollTrigger } = stMod;
        gsap.registerPlugin(ScrollTrigger);

        const track = document.getElementById("journey-track");
        if (!track) return;

        const count = projects.length;
        expScroll.count = experience.length;
        workScroll.count = count;
        const measurePin = () => {
          const pin = Math.round(window.innerHeight * 0.8 * count);
          workScroll.length = pin;
          track.style.setProperty("--work-pin", pin + "px");
          const ep = Math.round(window.innerHeight * 1.6 * expScroll.count);
          expScroll.length = ep;
          track.style.setProperty("--exp-pin", ep + "px");
        };
        const measureStart = () => {
          const w = document.getElementById("work");
          if (w) workScroll.startY = w.getBoundingClientRect().top + window.scrollY;
          const x = document.getElementById("experience");
          if (x) expScroll.startY = x.getBoundingClientRect().top + window.scrollY;
        };
        measurePin();
        measureStart();
        let lastIdx = -1;
        let lastExp = -1;

        const lenis = new Lenis({
          duration: 1.15,
          smoothWheel: true,
        });
        lenis.on("scroll", ScrollTrigger.update);
        lenis.on("scroll", (e: { velocity: number }) => {
          fx.vel = e.velocity;
        });

        const ticker = (time: number) => {
          lenis.raf(time * 1000);
        };
        gsap.ticker.add(ticker);
        gsap.ticker.lagSmoothing(0);

        const proxy = { t: 0 };
        const tween = gsap.to(proxy, {
          t: 1,
          ease: "none",
          scrollTrigger: {
            trigger: track,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.65,
            invalidateOnRefresh: true,
            onRefreshInit: measurePin,
            onRefresh: measureStart,
            onUpdate: (self) => {
              const range = self.end - self.start;
              const y = self.scroll() - self.start;
              const E = workScroll.length;
              const w0 = workScroll.startY - self.start;
              const pinned = Math.min(E, Math.max(0, y - w0));
              const E2 = expScroll.length;
              const e0 = expScroll.startY - self.start;
              const pinnedE = Math.min(E2, Math.max(0, y - e0));
              const base = range - E - E2;
              const p = base > 0 ? (y - pinned - pinnedE) / base : self.progress;
              applyProgress(Math.min(1, Math.max(0, p)));
              const f = easeProject((pinned / E) * (count - 1));
              workTargetRef.current = f;
              const ef = pinnedE / E2;
              expTargetRef.current = ef;
              const eIdx = expIndexAt(ef);
              if (eIdx !== lastExp) {
                lastExp = eIdx;
                window.dispatchEvent(new CustomEvent(EXP_EVENT, { detail: eIdx }));
              }
              const idx = Math.round(f);
              if (idx !== lastIdx) {
                lastIdx = idx;
                window.dispatchEvent(new CustomEvent(WORK_EVENT, { detail: idx }));
              }
            },
          },
        });
        ScrollTrigger.refresh();

        destroy = () => {
          tween.scrollTrigger?.kill();
          tween.kill();
          gsap.ticker.remove(ticker);
          lenis.destroy();
        };
      })();
    });

    return () => {
      cancelled = true;
      cancel();
      destroy?.();
    };
  }, [setTargetProgress, workTargetRef, expTargetRef]);

  return <>{children}</>;
}
