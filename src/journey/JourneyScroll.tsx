import { useEffect, type ReactNode } from "react";
import { afterFirstPaint, isCoarsePointer, prefersReducedMotion } from "@/utils/heroCapabilities";
import { scrollNav } from "./scrollNav";
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

    let lastStation = -1;
    const applyProgress = (progress: number) => {
      const st = Math.round(progress * 5);
      if (st !== lastStation) {
        if (lastStation !== -1) window.dispatchEvent(new CustomEvent("journey-station", { detail: st }));
        lastStation = st;
      }
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
        // iOS/Android URL bars resize the viewport while scrolling: do not re-measure on those (small, vertical-only) resizes
        ScrollTrigger.config({ ignoreMobileResize: true });

        const track = document.getElementById("journey-track");
        if (!track) return;

        const count = projects.length;
        expScroll.count = experience.length;
        workScroll.count = count;
        let stableH = window.innerHeight;
        let stableW = window.innerWidth;
        const measurePin = () => {
          // keep the pin lengths steady while the mobile URL bar shows/hides (<150px height-only change)
          if (Math.abs(window.innerHeight - stableH) > 150 || window.innerWidth !== stableW) {
            stableH = window.innerHeight;
            stableW = window.innerWidth;
          }
          const pin = Math.round(stableH * 0.8 * count);
          workScroll.length = pin;
          track.style.setProperty("--work-pin", pin + "px");
          const ep = Math.round(stableH * 1.6 * expScroll.count);
          expScroll.length = ep;
          track.style.setProperty("--exp-pin", ep + "px");
        };
        // Scroll (excluding the two pins) at which each station's section reaches the viewport top, and how long it
        // holds there (a section taller than the viewport, e.g. About/Contact on a short landscape phone, keeps its
        // station while its text scrolls). Keeps the 3D in step with the real DOM layout at any viewport size.
        const STATION_IDS = ["hero", "work", "experience", "skills", "about", "contact"];
        let anchors: Array<[number, number, number]> = [];
        const measureAnchors = (trackStart: number) => {
          const vh = window.innerHeight;
          const out: Array<[number, number, number]> = [];
          let pinsBefore = 0;
          STATION_IDS.forEach((id, k) => {
            const el = id === "hero" ? track : document.getElementById(id);
            if (!el) return;
            const top = id === "hero" ? trackStart : el.getBoundingClientRect().top + window.scrollY;
            const pin = id === "work" ? workScroll.length : id === "experience" ? expScroll.length : 0;
            const h = id === "hero" ? (document.getElementById("hero")?.offsetHeight ?? vh) : el.offsetHeight;
            const a = id === "hero" ? 0 : Math.max(0, top - trackStart - pinsBefore);
            out.push([a, a + Math.max(0, h - pin - vh), k * 0.2]);
            if (id === "work") pinsBefore += workScroll.length;
            if (id === "experience") pinsBefore += expScroll.length;
          });
          anchors = out;
        };
        const progressAt = (u: number) => {
          const A = anchors;
          if (A.length < 2) return -1;
          if (u <= A[0][1]) return A[0][2];
          for (let i = 1; i < A.length; i++) {
            if (u <= A[i][0]) {
              const pb = A[i - 1][1];
              const span = Math.max(1, A[i][0] - pb);
              return A[i - 1][2] + (A[i][2] - A[i - 1][2]) * Math.min(1, Math.max(0, (u - pb) / span));
            }
            if (u <= A[i][1]) return A[i][2];
          }
          return A[A.length - 1][2];
        };
        const measureStart = () => {
          const w = document.getElementById("work");
          if (w) workScroll.startY = w.getBoundingClientRect().top + window.scrollY;
          const x = document.getElementById("experience");
          if (x) expScroll.startY = x.getBoundingClientRect().top + window.scrollY;
          const trackTop = track.getBoundingClientRect().top + window.scrollY;
          measureAnchors(trackTop);
        };
        measurePin();
        measureStart();
        let lastIdx = -1;
        let lastExp = -1;

        const lenis = new Lenis({
          // Premium inertia: long exponential ease-out, slightly damped wheel,
          // native touch on coarse pointers (syncTouch stays off).
          duration: 1.35,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: !prefersReducedMotion(),
          wheelMultiplier: 0.9,
          touchMultiplier: 1.2,
          syncTouch: false,
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

        // ---- section/station snapping (desktop, motion allowed) ----
        scrollNav.lenis = lenis as never;
        const snapOn = !prefersReducedMotion() && !isCoarsePointer();
        let idleT = 0;
        let lastY = -1;
        let pointerDown = false;
        const onIdle = () => {
          if (!snapOn || cancelled) return;
          const y = lenis.scroll;
          if (pointerDown || lenis.isScrolling || scrollNav.animating || Math.abs(y - lastY) > 1) {
            lastY = y;
            arm();
            return;
          }
          const p = scrollNav.nearest(y);
          const d = Math.abs(p.y - y);
          if (d > 3) {
            const dur = Math.min(1, Math.max(0.6, 0.5 + (d / window.innerHeight) * 0.2));
            scrollNav.to(p.y, { duration: dur });
          }
        };
        const arm = () => {
          window.clearTimeout(idleT);
          idleT = window.setTimeout(onIdle, 150);
        };
        lenis.on("scroll", arm);
        const onDown = () => {
          pointerDown = true;
          scrollNav.cancel();
        };
        const onUp = () => {
          pointerDown = false;
          arm();
        };
        const onKey = (e: KeyboardEvent) => {
          if (!e.ctrlKey && !e.metaKey) scrollNav.cancel();
        };
        window.addEventListener("pointerdown", onDown, { passive: true });
        window.addEventListener("pointerup", onUp, { passive: true });
        window.addEventListener("keydown", onKey);
        (window as unknown as { __snapPoints?: () => unknown }).__snapPoints = () => scrollNav.points();

        const proxy = { t: 0 };
        const tween = gsap.to(proxy, {
          t: 1,
          ease: "none",
          scrollTrigger: {
            trigger: track,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.35,
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
              const pa = progressAt(y - pinned - pinnedE);
              const p = pa >= 0 ? pa : base > 0 ? (y - pinned - pinnedE) / base : self.progress;
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
          window.clearTimeout(idleT);
          window.removeEventListener("pointerdown", onDown);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("keydown", onKey);
          scrollNav.lenis = null;
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
