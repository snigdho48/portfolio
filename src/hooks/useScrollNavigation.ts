import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ROUTES = [
  "/",
  "/about",
  "/services",
  "/work",
  "/testimonials",
  "/contact",
];

/** Minimum wheel delta to count as intentional scroll */
const MIN_DELTA = 30;
/** Minimum swipe distance (px) on touch */
const MIN_SWIPE = 60;

export function useScrollNavigation() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const touchStartY = useRef(0);
  const lastTrigger = useRef(0);

  useEffect(() => {
    const COOLDOWN = 1400; // ms – matches transition duration

    const canNavigate = () => {
      if (Date.now() - lastTrigger.current < COOLDOWN) return false;
      return true;
    };

    const go = (dir: "next" | "prev") => {
      if (!canNavigate()) return;
      const idx = ROUTES.indexOf(pathname);
      const next = dir === "next"
        ? Math.min(idx + 1, ROUTES.length - 1)
        : Math.max(idx - 1, 0);
      if (next === idx) return;
      lastTrigger.current = Date.now();
      navigate(ROUTES[next]);
    };

    const onWheel = (e: WheelEvent) => {
      // Allow Swiper to scroll its own slides; block everything else
      const target = e.target as HTMLElement;
      const inSwiper = !!target.closest(".swiper-wrapper") ||
                       !!target.closest(".swiper-slide");
      if (inSwiper) return;

      // Always prevent browser scrolling on this full-page site
      e.preventDefault();
      e.stopPropagation();

      if (Math.abs(e.deltaY) < MIN_DELTA) return;
      go(e.deltaY > 0 ? "next" : "prev");
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const diff = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(diff) < MIN_SWIPE) return;
      go(diff > 0 ? "next" : "prev");
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is typing in an input / textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); go("next"); }
      if (e.key === "ArrowUp"   || e.key === "PageUp")   { e.preventDefault(); go("prev"); }
    };

    // ── CAPTURE phase: fires BEFORE Swiper, Three.js canvas, nav buttons etc. ──
    window.addEventListener("wheel",      onWheel,      { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true,  capture: true });
    window.addEventListener("touchend",   onTouchEnd,   { passive: true,  capture: true });
    window.addEventListener("keydown",    onKeyDown,    { capture: true });

    return () => {
      window.removeEventListener("wheel",      onWheel,      { capture: true });
      window.removeEventListener("touchstart", onTouchStart, { capture: true });
      window.removeEventListener("touchend",   onTouchEnd,   { capture: true });
      window.removeEventListener("keydown",    onKeyDown,    { capture: true });
    };
  }, [pathname, navigate]);
}
