import { Helmet } from "react-helmet-async";
import ParticlesContainer from "@/components/ParticlesContainer";
import ProjectsBtn from "@/components/ProjectsBtn";
import Avatar from "@/components/Avatar";
import { useFadeIn } from "@/hooks/useFadeIn";
import { siteConfig } from "@/data/portfolio";

export default function Home() {
  const titleRef  = useFadeIn<HTMLHeadingElement>("down", 0.2);
  const descRef   = useFadeIn<HTMLParagraphElement>("down", 0.3);
  const btnRef    = useFadeIn<HTMLDivElement>("down", 0.4);
  const avatarRef = useFadeIn<HTMLDivElement>("up",   0.5);

  return (
    <div className="page-root bg-primary/60">
      <Helmet>
        <title>Snigdho | Software Engineer</title>
        <meta name="description" content="MD. Atiquzzaman Snigdho — Software Engineer specializing in Django, React & Cloud." />
      </Helmet>

      {/* text layer — full bleed so it sits behind particles/avatar */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-black/30 to-black/10 z-10">
        <div className="h-full flex flex-col justify-center xl:pt-0 text-center xl:text-left container mx-auto xl:pr-24 pt-24 pb-24 xl:pb-0">
          <h1 ref={titleRef} className="h1">
            Building{" "}
            <br className="hidden xl:block" />
            Production{" "}
            <span className="text-accent">Backend Systems.</span>
          </h1>
          <p
            ref={descRef}
            className="max-w-sm xl:max-w-xl mx-auto xl:mx-0 mb-8 xl:mb-12 text-white/60 font-light leading-[1.8]"
          >
            {siteConfig.bio}
          </p>
          <div className="flex justify-center xl:hidden">
            <ProjectsBtn />
          </div>
          <div ref={btnRef} className="hidden xl:flex">
            <ProjectsBtn />
          </div>
        </div>
      </div>

      {/* scroll hint */}
      <div className="absolute bottom-24 xl:bottom-8 left-1/2 xl:left-auto xl:right-[8%] -translate-x-1/2 xl:translate-x-0 z-20 flex flex-col items-center gap-1 pointer-events-none opacity-60">
        <span className="text-[10px] tracking-widest uppercase text-white/50">Scroll</span>
        <div className="w-px h-6 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
      </div>

      {/* right side: particles + 3D avatar */}
      <div className="absolute right-0 bottom-0 w-full xl:w-[1280px] h-full z-0">
        <div
          className="w-full h-full absolute xl:bg-[radial-gradient(ellipse_at_center,_rgba(241,48,36,0.15)_0%,_transparent_70%)] mix-blend-color-dodge"
          aria-hidden
        />
        <ParticlesContainer />
        <div
          ref={avatarRef}
          className="absolute bottom-0 xl:bottom-0 right-0 xl:right-[8%] w-full xl:w-auto h-full max-w-[737px] max-h-[678px]"
        >
          <Avatar />
        </div>
      </div>
    </div>
  );
}
