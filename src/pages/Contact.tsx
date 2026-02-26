import { useState, type FormEvent } from "react";
import { BsArrowRight } from "react-icons/bs";
import { Helmet } from "react-helmet-async";
import { useFadeIn } from "@/hooks/useFadeIn";
import emailjs from "@emailjs/browser";

export default function Contact() {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const titleRef = useFadeIn<HTMLHeadingElement>("up", 0.2);
  const formRef  = useFadeIn<HTMLFormElement>("up",    0.4);

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
    <div className="page-root bg-primary/30">
      <Helmet>
        <title>Snigdho | Contact</title>
        <meta name="description" content="Contact MD. Atiquzzaman Snigdho — atiquzzamansnigdho@gmail.com" />
      </Helmet>

      {/* header clearance */}
      <div className="h-[90px] flex-shrink-0" />

      {/* content */}
      <div className="page-body justify-center">
        <div className="container mx-auto xl:pr-24 w-full flex justify-center text-center xl:text-left">
          <div className="flex flex-col w-full max-w-[700px]">
            <h2 ref={titleRef} className="h2 text-center !mb-8 text-white">
              Let&apos;s <span className="text-accent">connect.</span>
            </h2>

            <form
              ref={formRef}
              className="flex flex-col gap-4 w-full"
              onSubmit={handleSubmit}
              autoComplete="off"
              data-no-scroll
            >
              <div className="flex gap-x-4 w-full">
                <input
                  type="text"
                  placeholder="Name"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  disabled={isLoading}
                  required
                />
                <input
                  type="email"
                  placeholder="E-mail"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  disabled={isLoading}
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Subject"
                className="input"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                disabled={isLoading}
                required
              />
              <textarea
                placeholder="Message..."
                className="textarea !h-[120px] xl:!h-[150px]"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                disabled={isLoading}
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="btn rounded-full border border-white/50 max-w-[170px] px-8 transition-all duration-300 flex items-center justify-center overflow-hidden hover:border-accent group disabled:opacity-50 cursor-pointer bg-transparent text-white self-center xl:self-start"
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
          </div>
        </div>
      </div>

      {/* mobile nav clearance */}
      <div className="h-20 xl:h-4 flex-shrink-0" />
    </div>
  );
}
