import Contact from "@/sections/Contact";

/** Contact portal HTML - EmailJS form with success/error UI. */
export default function StationContact() {
  return (
    <section
      id="contact"
      className="journey-station journey-station--contact"
      aria-label="Contact"
    >
      <div className="journey-station__inner journey-contact">
        <p className="journey-eyebrow">Contact</p>
        <Contact embedded />
      </div>
    </section>
  );
}
