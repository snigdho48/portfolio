import { heroSplit } from "./transitions";
import { STATION_PEAK, STATION_RANGE, stationActive, type StationKey } from "./stationVisibility";

const STATIONS: Array<{ id: StationKey; htmlId: string }> = [
  { id: "hero", htmlId: "hero" },
  { id: "work", htmlId: "work" },
  { id: "experience", htmlId: "experience" },
  { id: "skills", htmlId: "skills" },
  { id: "about", htmlId: "about" },
  { id: "contact", htmlId: "contact" },
];

/**
 * Drive station opacity / hit-testing from one scroll progress value.
 * Uses the same exclusive ranges as the 3D systems.
 */
export function updateStationOpacity(progress: number) {
  const track = document.getElementById("journey-track");
  if (!track) return;

  for (const station of STATIONS) {
    const op = stationActive(progress, station.id);
    track.style.setProperty(`--journey-op-${station.htmlId}`, op.toFixed(3));

    const el = document.getElementById(station.htmlId);
    if (!el) continue;
    const dimmed = op < 0.05;
    el.classList.toggle("is-dimmed", dimmed);
    if (dimmed) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
  }

  // The Experience copy and HUD fade out as the camera dollies into the light (Experience -> Skills warp).
  const x = Math.min(1, Math.max(0, (progress - 0.405) / 0.04));
  track.style.setProperty("--exp-out", (x * x * (3 - 2 * x)).toFixed(3));

  const split = heroSplit(progress);
  track.style.setProperty("--hero-split", split.toFixed(3));
  track.classList.toggle("is-hero-split", split > 0.004);

  // Expose peaks for debug overlays if needed
  void STATION_PEAK;
  void STATION_RANGE;
}
