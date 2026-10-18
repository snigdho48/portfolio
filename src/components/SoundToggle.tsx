import { useEffect, useState } from "react";
import {
  isSoundOn,
  setSound,
  startSound,
  storedPreference,
  subscribeSound,
  tick,
  whoosh,
} from "@/utils/sfx";
import { WORK_EVENT } from "@/journey/workScroll";
import { EXP_EVENT } from "@/journey/expScroll";

/** Nav mute/unmute. Sound is OFF until the visitor opts in; a remembered "on" resumes on the next gesture. */
export default function SoundToggle() {
  const [on, setOn] = useState(storedPreference());

  useEffect(() => {
    const unsub = subscribeSound(() => setOn(isSoundOn()));
    let resume: (() => void) | undefined;
    if (storedPreference() && !isSoundOn()) {
      resume = () => {
        window.removeEventListener("pointerdown", resume!);
        window.removeEventListener("keydown", resume!);
        if (storedPreference()) startSound();
      };
      window.addEventListener("pointerdown", resume);
      window.addEventListener("keydown", resume);
    }
    const onStation = () => whoosh(1);
    const onIndex = () => tick(1.25);
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.("a, button, [role='button']")) tick(1);
    };
    window.addEventListener("journey-station", onStation);
    window.addEventListener(WORK_EVENT, onIndex);
    window.addEventListener(EXP_EVENT, onIndex);
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      unsub();
      if (resume) {
        window.removeEventListener("pointerdown", resume);
        window.removeEventListener("keydown", resume);
      }
      window.removeEventListener("journey-station", onStation);
      window.removeEventListener(WORK_EVENT, onIndex);
      window.removeEventListener(EXP_EVENT, onIndex);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <button
      type="button"
      className={`sound-toggle${on ? " is-on" : ""}`}
      aria-pressed={on}
      aria-label={on ? "Mute sound" : "Unmute sound"}
      title={on ? "Sound on - click to mute" : "Sound off - click to enable ambient audio"}
      onClick={() => setSound(!isSoundOn())}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        {on ? (
          <>
            <path d="M15.5 9a4 4 0 0 1 0 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M18 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : (
          <path d="m16 9.5 5 5m0-5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}
