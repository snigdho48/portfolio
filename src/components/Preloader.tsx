import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/utils/heroCapabilities";

const STORAGE_KEY = "snigdho-preloader-seen";

/** Brief translucent brand flash — pointer-events none, won't block LCP. */
export default function Preloader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    setVisible(true);
    const hide = window.setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
    }, 480);

    return () => window.clearTimeout(hide);
  }, []);

  if (!visible) return null;

  return (
    <div className="preloader" role="status" aria-live="polite" aria-busy="true">
      <div className="preloader__mark">
        Snigdho<span>.</span>
      </div>
    </div>
  );
}
