import { useState } from "react";
import CountUp from "react-countup";
import { Helmet } from "react-helmet-async";
import Avatar from "@/components/Avatar";
import Circles from "@/components/Circles";
import { useFadeIn } from "@/hooks/useFadeIn";
import { aboutData, stats } from "@/data/portfolio";

export default function About() {
  const [index, setIndex] = useState(0);
  const titleRef  = useFadeIn<HTMLDivElement>("right", 0.2);
  const descRef   = useFadeIn<HTMLParagraphElement>("right", 0.4);
  const statsRef  = useFadeIn<HTMLDivElement>("right", 0.6);
  const tabsRef   = useFadeIn<HTMLDivElement>("left",  0.4);
  const avatarRef = useFadeIn<HTMLDivElement>("right", 0.2);

  return (
    <div className="page-root bg-primary/30 text-center xl:text-left">
      <Helmet>
        <title>Snigdho | About</title>
        <meta name="description" content="About MD. Atiquzzaman Snigdho — 3+ years building production backends." />
      </Helmet>

      <Circles />

      {/* avatar */}
      <div
        ref={avatarRef}
        className="hidden xl:flex absolute bottom-0 -left-[370px] pointer-events-none select-none w-[500px] h-[500px] z-0"
      >
        <Avatar />
      </div>

      {/* header clearance */}
      <div className="h-[90px] flex-shrink-0" />

      {/* content */}
      <div className="page-body">
        <div className="container mx-auto xl:pr-24 w-full">
          <div className="flex flex-col items-center xl:flex-row gap-x-6 gap-y-4">

            {/* left: text + stats */}
            <div className="flex-1 flex flex-col">
              <div ref={titleRef}>
                <h2 className="h2 !mb-3">
                  Crafting robust{" "}
                  <span className="text-accent">backend systems</span> that scale.
                </h2>
              </div>
              <p ref={descRef} className="max-w-[500px] mx-auto xl:mx-0 mb-4 xl:mb-6 px-2 xl:px-0 text-white/60 font-light leading-[1.8] text-sm xl:text-base">
                3+ years ago I started as a Flutter intern. Since then I have built
                enterprise analytics platforms, data-driven PR tools, AI-assisted
                content systems, and deployed them on AWS, DigitalOcean and Linux servers.
              </p>

              {/* counters */}
              <div ref={statsRef} className="hidden md:flex md:max-w-xl xl:max-w-none mx-auto xl:mx-0">
                <div className="flex flex-1 gap-x-2 xl:gap-x-6">
                  {stats.map((stat, i) => (
                    <div
                      key={i}
                      className={`relative flex-1 ${
                        i < stats.length - 1
                          ? "after:w-[1px] after:h-full after:bg-white/10 after:absolute after:top-0 after:right-0"
                          : ""
                      }`}
                    >
                      <div className="text-xl xl:text-4xl font-extrabold text-accent mb-1">
                        <CountUp start={0} end={stat.end} duration={5} suffix={stat.suffix} />
                      </div>
                      <div className="text-[10px] xl:text-xs uppercase tracking-[1px] leading-[1.4] max-w-[100px] text-white/60">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* right: tabs */}
            <div ref={tabsRef} className="flex flex-col w-full xl:max-w-[48%]">
              {/* tab buttons */}
              <div className="flex gap-x-4 xl:gap-x-8 mx-auto xl:mx-0 mb-3">
                {aboutData.map((item, itemI) => (
                  <button
                    key={itemI}
                    type="button"
                    onClick={() => setIndex(itemI)}
                    className={`${
                      index === itemI
                        ? "text-accent after:w-[100%] after:bg-accent"
                        : "text-white/60 after:bg-white"
                    } cursor-pointer capitalize xl:text-lg relative after:w-8 after:h-[2px] after:absolute after:-bottom-1 after:left-0 after:transition-all after:duration-300 bg-transparent border-0 pb-2 text-sm xl:text-base`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              {/* tab content */}
              <div className="py-2 xl:py-4 flex flex-col gap-y-2 items-center xl:items-start max-h-[220px] overflow-y-auto scrollbar-hide">
                {aboutData[index].info.map((item, itemI) => (
                  <div
                    key={itemI}
                    className="flex-shrink-0 flex flex-col md:flex-row max-w-max gap-x-2 items-center text-center text-white/60"
                  >
                    <div className="font-light text-xs xl:text-sm mb-1 md:mb-0">{item.title}</div>
                    {item.stage && <div className="hidden md:flex text-xs">-</div>}
                    {item.stage && <div className="text-xs">{item.stage}</div>}
                    <div className="flex gap-x-3 mt-1 md:mt-0">
                      {item.icons?.map((Icon, iconI) => (
                        <div key={iconI} className="text-xl text-white/80 hover:text-accent transition-colors">
                          <Icon aria-hidden />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* mobile nav clearance */}
      <div className="h-20 xl:h-4 flex-shrink-0" />
    </div>
  );
}
