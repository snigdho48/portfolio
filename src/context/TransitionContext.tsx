import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";

interface TransitionContextType {
  navigateTo: (path: string) => void;
  isAnimating: React.MutableRefObject<boolean>;
}

const TransitionContext = createContext<TransitionContextType>({
  navigateTo: () => {},
  isAnimating: { current: false },
});

export function TransitionProvider({ children }: { children: ReactNode }) {
  const reactNavigate = useNavigate();
  const p1 = useRef<HTMLDivElement>(null);
  const p2 = useRef<HTMLDivElement>(null);
  const p3 = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);

  const navigateTo = useCallback(
    (path: string) => {
      if (isAnimating.current) return;
      if (!p1.current || !p2.current || !p3.current) {
        reactNavigate(path);
        return;
      }

      isAnimating.current = true;
      const panels = [p3.current, p2.current, p1.current];

      // 1. Animate current page content out (element transition)
      gsap.to(contentRef.current, {
        opacity: 0,
        y: -24,
        duration: 0.28,
        ease: "expo.in",
        onComplete: () => {
          // 2. Prepare new content position (will mount after navigate)
          if (contentRef.current) {
            gsap.set(contentRef.current, { opacity: 0, y: 24 });
          }
          // 3. Panels sweep in
          gsap
            .timeline({
              onComplete: () => {
                isAnimating.current = false;
                // 5. Animate new page content in
                if (contentRef.current) {
                  gsap.to(contentRef.current, {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    ease: "expo.out",
                    clearProps: "transform",
                  });
                }
              },
              defaults: { ease: "expo.inOut" },
            })
            .set(panels, { x: "100%", display: "block", willChange: "transform" })
            .to(panels, { x: "0%", duration: 0.55, stagger: 0.08 })
            .call(() => { reactNavigate(path); })
            .to(panels, {
              x: "-100%",
              duration: 0.55,
              stagger: 0.08,
              delay: 0.12,
            })
            .set(panels, { display: "none", willChange: "auto" });
        },
      });
    },
    [reactNavigate]
  );

  return (
    <TransitionContext.Provider value={{ navigateTo, isAnimating }}>
      {/* Transition overlay panels */}
      <div ref={p1} role="presentation" aria-hidden
        className="fixed inset-0 z-[70] hidden pointer-events-none"
        style={{ background: "linear-gradient(135deg,#1e1347 0%,#2e2257 100%)" }}
      />
      <div ref={p2} role="presentation" aria-hidden
        className="fixed inset-0 z-[60] hidden pointer-events-none"
        style={{ background: "linear-gradient(135deg,#2b1e5e 0%,#3b2d71 100%)" }}
      />
      <div ref={p3} role="presentation" aria-hidden
        className="fixed inset-0 z-[50] hidden pointer-events-none"
        style={{ background: "linear-gradient(135deg,#38267a 0%,#4b3792 100%)" }}
      />
      <div ref={contentRef} className="w-full min-h-screen">
        {children}
      </div>
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  return useContext(TransitionContext);
}
