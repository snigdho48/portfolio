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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hp, setHp] = useState("");

  const validate = () => {
    const er: Record<string, string> = {};
    if (form.name.trim().length < 2) er.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) er.email = "Please enter a valid email address.";
    if (form.subject.trim().length < 3) er.subject = "Add a short subject.";
    if (form.message.trim().length < 10) er.message = "Tell me a little more (at least 10 characters).";
    return er;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) {
      setStatus("idle");
      return;
    }
    if (hp) return; // honeypot
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

    if (!serviceId || !templateId || !publicKey || [serviceId, templateId, publicKey].some((v) => v.startsWith("[PLACEHOLDER"))) {
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

  const mailtoHref = `mailto:${siteConfig.email}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`${form.message}\n\n${form.name} <${form.email}>`)}`;

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
          <div className="field">
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
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "err-name" : undefined}
            disabled={isLoading}
          />
{errors.name && (<span id="err-name" className="field-err" role="alert">{errors.name}</span>)}
</div>
          <div className="field">
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
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "err-email" : undefined}
            disabled={isLoading}
          />
{errors.email && (<span id="err-email" className="field-err" role="alert">{errors.email}</span>)}
</div>
        </div>
        <div className="field">
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
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? "err-subject" : undefined}
          disabled={isLoading}
        />
{errors.subject && (<span id="err-subject" className="field-err" role="alert">{errors.subject}</span>)}
</div>
        <div className="field">
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
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "err-message" : undefined}
          disabled={isLoading}
        />
{errors.message && (<span id="err-message" className="field-err" role="alert">{errors.message}</span>)}
</div>
        <input className="form-hp" tabIndex={-1} autoComplete="off" aria-hidden name="company" value={hp} onChange={(e) => setHp(e.target.value)} />
        
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
            Contact form is not wired yet ([PLACEHOLDER] EmailJS keys). <a href={mailtoHref}>Open this message in your email app</a>, or email{" "}
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
