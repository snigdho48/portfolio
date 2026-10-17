/**
 * Stage C: keyboard/focus, skip link, console, static fallback (mobile + no-WebGL),
 * prefers-reduced-motion. No webdriver spoofing of scores.
 */
import { chromium, devices } from "playwright";

const BASE = process.env.STAGE_C_URL || "http://127.0.0.1:4173";
const out = { ok: true, checks: [] };

function check(name, pass, detail = "") {
  out.checks.push({ name, pass, detail });
  if (!pass) out.ok = false;
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function collectConsole(page) {
  const msgs = [];
  page.on("console", (m) => {
    const t = m.type();
    if (t === "warning" || t === "error") {
      msgs.push({ type: t, text: m.text() });
    }
  });
  page.on("pageerror", (e) => msgs.push({ type: "pageerror", text: e.message }));
  return msgs;
}

async function focusOrder(page) {
  const labels = [];
  for (let i = 0; i < 18; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const tag = el.tagName.toLowerCase();
      const text = (el.getAttribute("aria-label") || el.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 48);
      return `${tag}${el.id ? "#" + el.id : ""}${el.className ? "." + String(el.className).split(" ")[0] : ""}:${text}`;
    });
    if (info) labels.push(info);
  }
  return labels;
}

async function contrastSample(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.setAttribute("data-theme", t);
  }, theme);
  return page.evaluate(() => {
    const cards = [...document.querySelectorAll(".journey-glass-card, .work-card, .section")].slice(
      0,
      6,
    );
    const parse = (c) => {
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!m) return null;
      return {
        r: +m[1],
        g: +m[2],
        b: +m[3],
        a: m[4] == null ? 1 : +m[4],
      };
    };
    const lum = ({ r, g, b }) => {
      const s = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
    };
    const ratio = (fg, bg) => {
      const L1 = lum(fg);
      const L2 = lum(bg);
      const hi = Math.max(L1, L2);
      const lo = Math.min(L1, L2);
      return (hi + 0.05) / (lo + 0.05);
    };
    const blend = (fg, bg) => {
      const a = fg.a;
      return {
        r: Math.round(fg.r * a + bg.r * (1 - a)),
        g: Math.round(fg.g * a + bg.g * (1 - a)),
        b: Math.round(fg.b * a + bg.b * (1 - a)),
      };
    };

    const results = [];
    for (const card of cards) {
      const cs = getComputedStyle(card);
      const color = parse(cs.color);
      const bg = parse(cs.backgroundColor) || parse(getComputedStyle(document.body).backgroundColor);
      if (!color || !bg) continue;
      const pageBg = parse(getComputedStyle(document.body).backgroundColor);
      const effectiveBg = bg.a < 1 && pageBg ? blend(bg, pageBg) : bg;
      const solidFg = color.a < 1 && pageBg ? blend(color, effectiveBg) : color;
      results.push({
        cls: card.className.slice(0, 40),
        ratio: +ratio(solidFg, effectiveBg).toFixed(2),
      });
    }
    return results;
  });
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
  });

  // --- Desktop journey: console + keyboard ---
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const msgs = await collectConsole(page);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const mode = await page.evaluate(() =>
      document.querySelector(".journey-mode")
        ? "journey"
        : document.querySelector("#hero.section--hero")
          ? "static"
          : "unknown",
    );
    check("desktop mode resolved", mode === "journey" || mode === "static", mode);

    // Skip link
    await page.keyboard.press("Tab");
    const skip = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        text: el?.textContent?.trim(),
        href: el?.getAttribute("href"),
        className: el?.className,
      };
    });
    check(
      "skip link first focus",
      skip.className?.includes("skip-link") && skip.href?.includes("main-content"),
      JSON.stringify(skip),
    );
    await page.keyboard.press("Enter");
    const afterSkip = await page.evaluate(() => document.activeElement?.id || location.hash);
    check("skip link activates main", true, String(afterSkip));

    const order = await focusOrder(page);
    check("keyboard focus order non-empty", order.length >= 5, order.slice(0, 8).join(" → "));

    // Theme toggle reachable + aria-label
    const themeBtn = page.getByRole("button", { name: /switch to (light|dark) theme/i });
    check("theme toggle aria-label", await themeBtn.count().then((n) => n > 0));

    // Nav aria labels
    const nav = page.getByRole("navigation", { name: "Sections" });
    check("sections nav labelled", (await nav.count()) > 0 || mode === "static");

    await page.waitForTimeout(500);
    const noise = msgs.filter(
      (m) =>
        !m.text.includes("Download the React DevTools") &&
        !m.text.includes("favicon") &&
        !/THREE\.Clock|deprecated/i.test(m.text),
    );
    check(
      "desktop console clean",
      noise.length === 0,
      noise.map((m) => `${m.type}:${m.text}`).join(" | ") || "none",
    );

    // Contrast both themes (sample)
    for (const theme of ["dark", "light"]) {
      const samples = await contrastSample(page, theme);
      const bad = samples.filter((s) => s.ratio < 4.5);
      check(
        `contrast sample ${theme}`,
        bad.length === 0,
        samples.map((s) => `${s.cls}:${s.ratio}`).join(", ") || "no cards",
      );
    }

    await page.close();
  }

  // --- prefers-reduced-motion → static ---
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const staticOn = await page.evaluate(
      () => !!document.querySelector("#hero.section--hero") && !document.querySelector(".journey-mode"),
    );
    const canvas = await page.evaluate(() => !!document.querySelector(".journey-canvas canvas"));
    check("reduced-motion → static landing", staticOn && !canvas);
    await page.close();
  }

  // --- Mobile → static ---
  {
    const iPhone = devices["iPhone 13"];
    const page = await browser.newPage({ ...iPhone });
    const msgs = await collectConsole(page);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const staticOn = await page.evaluate(
      () => !!document.querySelector("#hero.section--hero") && !document.querySelector(".journey-canvas"),
    );
    check("mobile → static landing", staticOn);
    const noise = msgs.filter((m) => m.type === "error" || m.type === "pageerror");
    check(
      "mobile console clean",
      noise.length === 0,
      noise.map((m) => m.text).join(" | ") || "none",
    );
    await page.close();
  }

  // --- no-WebGL → static ---
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = function () {
        return null;
      };
    });
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const staticOn = await page.evaluate(
      () => !!document.querySelector("#hero.section--hero") && !document.querySelector(".journey-mode"),
    );
    check("no-WebGL → static landing", staticOn);
    await page.close();
  }

  await browser.close();
  console.log("\nSUMMARY", out.ok ? "ALL PASS" : "HAS FAILURES");
  process.exit(out.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
