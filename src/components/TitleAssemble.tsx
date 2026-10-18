import { useEffect } from "react";
import { loaderDone } from "@/utils/loaderGate";

/**
 * Section titles assemble from scattered letters when their station becomes active, and
 * scatter again when it deactivates. Event-driven (MutationObserver on the station's
 * `is-dimmed` class): no per-frame work. Desktop / full-motion only (mounted by DeferredChrome).
 */
const TARGETS: Array<{ station: string; sel: string }> = [
  { station: "skills", sel: "#skills .journey-h2" },
  { station: "about", sel: "#about .journey-h2" },
  { station: "contact", sel: "#contact h2" },
];

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function split(h: HTMLElement, seed: number) {
  if (h.dataset.asm) return;
  h.dataset.asm = "1";
  const label = h.textContent?.replace(/\s+/g, " ").trim() ?? "";
  h.setAttribute("aria-label", label);
  const rnd = mulberry(seed);
  let n = 0;
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? "";
        const frag = document.createDocumentFragment();
        for (const part of text.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            frag.append(document.createTextNode(" "));
            continue;
          }
          const w = document.createElement("span");
          w.className = "asm-w";
          w.setAttribute("aria-hidden", "true");
          for (const ch of part) {
            const s = document.createElement("span");
            s.className = "asm-ch";
            s.textContent = ch;
            s.style.setProperty("--i", String(n++));
            s.style.setProperty("--dx", `${((rnd() - 0.5) * 120).toFixed(0)}px`);
            s.style.setProperty("--dy", `${((rnd() - 0.5) * 90).toFixed(0)}px`);
            s.style.setProperty("--r", `${((rnd() - 0.5) * 80).toFixed(0)}deg`);
            w.append(s);
          }
          frag.append(w);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    }
  };
  walk(h);
  h.classList.add("is-asm");
}

export default function TitleAssemble() {
  useEffect(() => {
    const obs: MutationObserver[] = [];
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      TARGETS.forEach((t, k) => {
        const st = document.getElementById(t.station);
        const h = document.querySelector<HTMLElement>(t.sel);
        if (!st || !h) return;
        split(h, 1000 + k * 77);
        const sync = () => h.classList.toggle("is-asm-in", !st.classList.contains("is-dimmed"));
        sync();
        const mo = new MutationObserver(sync);
        mo.observe(st, { attributes: true, attributeFilter: ["class"] });
        obs.push(mo);
      });
    };
    const id = window.setTimeout(() => void loaderDone().then(start), 600);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
      obs.forEach((o) => o.disconnect());
    };
  }, []);
  return null;
}
