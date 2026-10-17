import { useState, type FormEvent } from "react";
import KineticLines from "@/components/KineticLines";
import { siteConfig, socialData } from "@/data/portfolio";

type ContactProps = {
  /** When true, omit outer section chrome (used inside journey station). */
  embedded?: boolean;
};

export default function Contact({ embedded = false }: ContactProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "success" | "error" | "unconfigured"
  >("idle");
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("idle");

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID as
      | string
      | undefined;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as
      | string
      | undefined;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as
      | string
      | undefined;

    if (!serviceId || !templateId || !publicKey) {
      setStatus("unconfigured");
      setIsLoading(false);
      return;
    }

    void import("@emailjs/browser")
      .then(({ default: emailjs }) =>
        emailjs.send(serviceId, templateId, form, publicKey),
      )
      .then(() => {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
      })
      .catch(() => setStatus("error"))
      .finally(() => setIsLoading(false));
  };

  const body = (
    <div className={embedded ? "contact-grid contact-grid--embed" : "contact-grid"}>
      <div>
        {!embedded && <p className="eyebrow">Contact</p>}
        <div id={embedded ? undefined : "contact-heading"}>
          {embedded ? (
            <h2 className="h2">Let&apos;s build the next system.</h2>
          ) : (
            <KineticLines as="h2" className="h2">
              {`Let's build the\nnext system.`}
            </KineticLines>
          )}
        </div>
        <p className="section-lead">
          Prefer email?{" "}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          <br />
          {siteConfig.phone}
        </p>
        <div className="contact-links">
          {socialData.map((s) => (
            <a
              key={s.name}
              href={s.link}
              target={s.link.startsWith("mailto:") ? undefined : "_blank"}
              rel="noreferrer noopener"
              aria-label={s.name}
            >
              <s.Icon aria-hidden /> {s.name}
            </a>
          ))}
          <a href={siteConfig.cvPath} download>
            Download CV
          </a>
        </div>
      </div>

      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <div className="contact-form__row">
          <label className="sr-only" htmlFor="contact-name">
            Name
          </label>
          <input
            id="contact-name"
            className="input"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            disabled={isLoading}
          />
          <label className="sr-only" htmlFor="contact-email">
            Email
          </label>
          <input
            id="contact-email"
            className="input"
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            disabled={isLoading}
          />
        </div>
        <label className="sr-only" htmlFor="contact-subject">
          Subject
        </label>
        <input
          id="contact-subject"
          className="input"
          name="subject"
          placeholder="Subject"
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          required
          disabled={isLoading}
        />
        <label className="sr-only" htmlFor="contact-message">
          Message
        </label>
        <textarea
          id="contact-message"
          className="textarea"
          name="message"
          placeholder="Message..."
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          required
          disabled={isLoading}
        />
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send message"}
        </button>

        {status === "success" && (
          <p className="form-status form-status--ok" role="status">
            Thanks - I&apos;ll get back to you ASAP.
          </p>
        )}
        {status === "error" && (
          <p className="form-status form-status--err" role="alert">
            Something went wrong. Please email me directly.
          </p>
        )}
        {status === "unconfigured" && (
          <p className="form-status form-status--err" role="alert">
            Contact form not configured yet. Email{" "}
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
          </p>
        )}
      </form>
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <section
      id="contact"
      className="section section--contact"
      aria-labelledby="contact-heading"
    >
      <div className="container">{body}</div>
    </section>
  );
}
