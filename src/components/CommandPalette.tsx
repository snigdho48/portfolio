import { lazy, Suspense, useEffect, useState } from "react";

const CommandPaletteModal = lazy(() => import("./CommandPaletteModal"));

/** Lightweight shell — cmdk chunk loads only when opened. */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        className="cmdk-trigger"
        onClick={() => setOpen(true)}
        aria-label="Ctrl+K"
        title="Open command palette (Ctrl+K)"
      >
        <span aria-hidden="true">Ctrl+K</span>
      </button>

      {open && (
        <Suspense fallback={null}>
          <CommandPaletteModal open={open} onOpenChange={setOpen} />
        </Suspense>
      )}
    </>
  );
}
