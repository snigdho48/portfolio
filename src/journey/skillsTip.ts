import { projects, skillGroups } from "@/data/portfolio";

/** DOM tooltip for Skills planets. Updated imperatively (no React state on pointer move). */
export const skillsTip = {
  el: null as HTMLElement | null,

  /** One factual line built only from portfolio.ts data (skill groups + project stacks). */
  describe(label: string): string {
    const lc = label.toLowerCase();
    const group = skillGroups.find((g) => g.items.some((i) => i.toLowerCase().includes(lc)));
    const used = projects.filter((p) =>
      p.stack.some((s) => {
        const sl = s.toLowerCase();
        return sl.length > 2 && !sl.includes("placeholder") && (sl.includes(lc) || lc.includes(sl));
      }),
    );
    const parts: string[] = [];
    if (group) parts.push(group.title);
    if (used.length) {
      const names = used.slice(0, 3).map((p) => p.title).join(", ");
      parts.push(`used in ${names}${used.length > 3 ? ` +${used.length - 3}` : ""}`);
    }
    return parts.length ? parts.join(" - ") : "Listed in my CV skills";
  },

  show(label: string, x: number, y: number) {
    const el = this.el;
    if (!el) return;
    el.textContent = "";
    const b = document.createElement("strong");
    b.textContent = label;
    const s = document.createElement("span");
    s.textContent = this.describe(label);
    el.append(b, s);
    el.classList.add("is-on");
    this.move(x, y);
  },

  move(x: number, y: number) {
    const el = this.el;
    if (!el) return;
    const w = el.offsetWidth || 220;
    const px = Math.min(window.innerWidth - w - 12, x + 16);
    el.style.transform = `translate3d(${Math.max(8, px)}px, ${y + 18}px, 0)`;
  },

  hide() {
    this.el?.classList.remove("is-on");
  },
};
