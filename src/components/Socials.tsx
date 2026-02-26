import { socialData } from "@/data/portfolio";
import { useTransition } from "@/context/TransitionContext";

export default function Socials() {
  const { navigateTo } = useTransition();

  return (
    <div className="flex items-center gap-x-5 text-lg">
      {socialData.map((social) => (
        <a
          key={social.name}
          title={social.name}
          href={social.link}
          target="_blank"
          rel="noreferrer noopener"
          className={`${
            social.name === "GitHub"
              ? "bg-accent rounded-full p-[5px] hover:text-white"
              : "hover:text-accent"
          } transition-all duration-300`}
          onClick={(e) => {
            if (social.link.startsWith("/")) {
              e.preventDefault();
              navigateTo(social.link);
            }
          }}
        >
          <social.Icon aria-hidden />
          <span className="sr-only">{social.name}</span>
        </a>
      ))}
    </div>
  );
}
