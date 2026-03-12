import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { BsArrowRight } from "react-icons/bs";
import { Helmet } from "react-helmet-async";
import { fadeIn } from "@/variants";
import emailjs from "@emailjs/browser";

export default function Contact() {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const serviceId  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string | undefined;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
    const publicKey  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string | undefined;

    if (!serviceId || !templateId || !publicKey) {
      alert("Contact form not yet configured. Please email directly: atiquzzamansnigdho@gmail.com");
      setIsLoading(false);
      return;
    }

    emailjs.send(serviceId, templateId, form, publicKey)
      .then(() => {
        alert("Thank you. I will get back to you ASAP.");
        setForm({ name: "", email: "", subject: "", message: "" });
      })
      .catch(() => alert("Something went wrong. Please try again."))
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="h-full bg-primary/30">
      <Helmet>
        <title>Snigdho | Contact</title>
        <meta name="description" content="Contact MD. Atiquzzaman Snigdho — atiquzzamansnigdho@gmail.com" />
      </Helmet>

      <div className="container mx-auto py-32 text-center xl:text-left flex items-center justify-center h-full">
        <div className="flex flex-col w-full max-w-[700px]">
          <motion.div variants={fadeIn("up", 0.2)} initial="hidden" animate="show" exit="hidden">
            <h2 className="h2 text-center mb-12">
              Let&apos;s <span className="text-accent">connect.</span>
            </h2>
          </motion.div>

          <motion.div variants={fadeIn("up", 0.4)} initial="hidden" animate="show" exit="hidden">
            <form
              name="contact"
              className="flex-1 flex flex-col gap-6 w-full mx-auto"
              onSubmit={handleSubmit}
              autoComplete="off"
              autoCapitalize="off"
              data-no-scroll
            >
            <div className="flex gap-x-6 w-full">
              <input
                type="text"
                name="name"
                id="contact-name"
                placeholder="Name"
                autoComplete="name"
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                disabled={isLoading}
                required
              />
              <input
                type="email"
                name="email"
                id="contact-email"
                placeholder="E-mail"
                autoComplete="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                disabled={isLoading}
                required
              />
            </div>
            <input
              type="text"
              name="subject"
              id="contact-subject"
              placeholder="Subject"
              className="input"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              disabled={isLoading}
              required
            />
            <textarea
              name="message"
              id="contact-message"
              placeholder="Message..."
              className="textarea"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              disabled={isLoading}
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="btn rounded-full border border-white/50 max-w-[170px] px-8 transition-all duration-300 flex items-center justify-center overflow-hidden hover:border-accent group disabled:opacity-50 cursor-pointer bg-transparent text-white relative"
            >
              <span className="group-hover:-translate-y-[120%] group-hover:opacity-0 transition-all duration-500">
                {isLoading ? "Sending…" : "Let's talk"}
              </span>
              <BsArrowRight
                className="-translate-y-[120%] opacity-0 group-hover:flex group-hover:-translate-y-0 group-hover:opacity-100 transition-all duration-300 absolute text-[22px]"
                aria-hidden
              />
            </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
