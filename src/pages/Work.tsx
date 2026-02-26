import { Helmet } from "react-helmet-async";
import Bulb from "@/components/Bulb";
import Circles from "@/components/Circles";
import WorkSlider from "@/components/WorkSlider";
import { useFadeIn } from "@/hooks/useFadeIn";

export default function Work() {
  const titleRef  = useFadeIn<HTMLDivElement>("up",   0.2);
  const descRef   = useFadeIn<HTMLParagraphElement>("up", 0.4);
  const sliderRef = useFadeIn<HTMLDivElement>("down", 0.6);

  return (
    <div className="page-root bg-primary/30">
      <Helmet>
        <title>Snigdho | Work</title>
        <meta name="description" content="Projects by MD. Atiquzzaman Snigdho — Braincount, Papercable, Chobirbaksho and more." />
      </Helmet>

      <Circles />

      {/* header clearance */}
      <div className="h-[90px] flex-shrink-0" />

      {/* content */}
      <div className="page-body">
        <div className="container mx-auto xl:pr-24 w-full">
          <div className="flex flex-col xl:flex-row gap-x-8 gap-y-4">
            {/* text */}
            <div className="text-center flex xl:w-[30vw] flex-col lg:text-left">
              <div ref={titleRef}>
                <h2 className="h2 xl:mt-4 !mb-3">
                  My work<span className="text-accent">.</span>
                </h2>
              </div>
              <p ref={descRef} className="mb-2 max-w-[400px] mx-auto lg:mx-0 text-white/60 font-light leading-[1.8] text-sm xl:text-base">
                Production-grade systems across OOH analytics, PR outreach, AI
                content creation, omnichannel marketing, and mobile identity verification.
              </p>
            </div>

            {/* slider */}
            <div ref={sliderRef} className="w-full xl:max-w-[65%]">
              <WorkSlider />
            </div>
          </div>
        </div>
      </div>

      {/* mobile nav clearance */}
      <div className="h-20 xl:h-4 flex-shrink-0" />
      <Bulb />
    </div>
  );
}
