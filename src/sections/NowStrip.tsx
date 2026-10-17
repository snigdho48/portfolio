import { siteConfig } from "@/data/portfolio";

/** Compact status strip under the hero — current role, place, availability. */
export default function NowStrip() {
  const { now } = siteConfig;

  return (
    <aside className="now-strip" aria-label="Current status">
      <div className="container now-strip__inner">
        <p className="now-strip__label">Now</p>
        <ul className="now-strip__items">
          <li>
            <span className="now-strip__key">Role</span>
            <span>{now.role}</span>
          </li>
          <li>
            <span className="now-strip__key">Location</span>
            <span>{now.location}</span>
          </li>
          <li>
            <span className="now-strip__key">Status</span>
            <span className="now-strip__status">{now.status}</span>
          </li>
        </ul>
      </div>
    </aside>
  );
}
