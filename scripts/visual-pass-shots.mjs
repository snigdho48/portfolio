import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.VISUAL_URL || "http://127.0.0.1:4173";
const OUT = path.resolve("docs/review/after");

const STATIONS = [
  { id: "hero", t: 0.02 },
  { id: "work", t: 0.215 },
  { id: "experience", t: 0.415 },
  { id: "skills", t: 0.605 },
  { id: "about", t: 0.78 },
  { id: "contact", t: 0.93 },
];

async function waitJourney(page) {
  await page.waitForFunction(
    () =>
      !!document.querySelector(".journey-mode") &&
      !!document.querySelector("canvas"),
    { timeout: 30000 },
  );
  await page.waitForTimeout(1200);
}

async function setProgress(page, t) {
  await page.evaluate((progress) => {
    const max = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    const y = progress * max;
    document.documentElement.scrollTop = y;
    document.body.scrollTop = y;
    window.scrollTo(0, y);
    // Nudge ScrollTrigger if present
    const st = window.ScrollTrigger;
    if (st?.update) st.update();
  }, t);
  // Allow camera lerp + opacity scrub + texture decode to settle
  await page.waitForTimeout(1600);
}

async function isolationSweep(page) {
  const rows = [];
  for (let pct = 0; pct <= 100; pct += 5) {
    const t = pct / 100;
    await setProgress(page, t);
    const sample = await page.evaluate(() => {
      const root = document.querySelector(".journey-mode");
      const style = root ? getComputedStyle(root) : null;
      const ops = {
        hero: Number(style?.getPropertyValue("--journey-op-hero") || 0),
        work: Number(style?.getPropertyValue("--journey-op-work") || 0),
        experience: Number(
          style?.getPropertyValue("--journey-op-experience") || 0,
        ),
        skills: Number(style?.getPropertyValue("--journey-op-skills") || 0),
        about: Number(style?.getPropertyValue("--journey-op-about") || 0),
        contact: Number(style?.getPropertyValue("--journey-op-contact") || 0),
      };
      const active = Object.entries(ops)
        .filter(([, v]) => v > 0.05)
        .map(([k]) => k);
      return { ops, active, overlap: active.length > 1 };
    });
    rows.push({ pct, ...sample });
  }
  return rows;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("theme", "dark");
      Object.defineProperty(Navigator.prototype, "deviceMemory", {
        get: () => 8,
      });
      Object.defineProperty(Navigator.prototype, "hardwareConcurrency", {
        get: () => 8,
      });
      Object.defineProperty(Navigator.prototype, "maxTouchPoints", {
        get: () => 0,
      });
      // Fine pointer so journey mode is not blocked
      const orig = window.matchMedia.bind(window);
      window.matchMedia = (query) => {
        if (query.includes("pointer: coarse")) {
          return {
            matches: false,
            media: query,
            addListener() {},
            removeListener() {},
            addEventListener() {},
            removeEventListener() {},
            dispatchEvent() {
              return false;
            },
            onchange: null,
          };
        }
        if (query.includes("prefers-reduced-motion")) {
          return {
            matches: false,
            media: query,
            addListener() {},
            removeListener() {},
            addEventListener() {},
            removeEventListener() {},
            dispatchEvent() {
              return false;
            },
            onchange: null,
          };
        }
        return orig(query);
      };
    } catch {
      /* ignore */
    }
  });

  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
  await waitJourney(page);

  for (const station of STATIONS) {
    await setProgress(page, station.t);
    const file = path.join(OUT, `${station.id}.png`);
    await page.screenshot({ path: file, type: "png" });
    console.log("shot", station.id, station.t);
  }

  const sweep = await isolationSweep(page);
  const overlaps = sweep.filter((r) => r.overlap);
  const report = {
    overlaps: overlaps.length,
    overlapRows: overlaps,
    samples: sweep.map((r) => ({
      pct: r.pct,
      active: r.active,
      ops: r.ops,
    })),
  };
  await writeFile(
    path.join(OUT, "isolation.json"),
    JSON.stringify(report, null, 2),
  );
  console.log("isolation overlaps:", overlaps.length);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
