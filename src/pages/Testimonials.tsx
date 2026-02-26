import { Helmet } from "react-helmet-async";
import TestimonialSlider from "@/components/TestimonialSlider";
import { useFadeIn } from "@/hooks/useFadeIn";

export default function Testimonials() {
  const titleRef  = useFadeIn<HTMLHeadingElement>("up", 0.2);
  const sliderRef = useFadeIn<HTMLDivElement>("up",     0.4);

  return (
    <div className="page-root bg-primary/30 text-center">
      <Helmet>
        <title>Snigdho | Testimonials</title>
        <meta name="description" content="What colleagues and clients say about Snigdho." />
      </Helmet>

      {/* header clearance */}
      <div className="h-[90px] flex-shrink-0" />

      {/* content */}
      <div className="page-body flex-col justify-center">
        <div className="container mx-auto xl:pr-24 w-full">
          <h2 ref={titleRef} className="h2 !mb-6 text-white">
            What clients<span className="text-accent"> say.</span>
          </h2>
          <div ref={sliderRef}>
            <TestimonialSlider />
          </div>
        </div>
      </div>

      {/* mobile nav clearance */}
      <div className="h-20 xl:h-4 flex-shrink-0" />
    </div>
  );
}
