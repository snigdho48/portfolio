import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { FaQuoteLeft } from "react-icons/fa";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const testimonialData = [
  {
    name: "Colleague",
    position: "Senior Engineer",
    message:
      "Snigdho consistently delivers clean, well-architected backend solutions. His Django APIs are production-ready from day one — reliable, performant, and well-documented.",
  },
  {
    name: "Team Lead",
    position: "Engineering Manager",
    message:
      "One of the most reliable engineers I have worked with. Snigdho takes ownership of every system he touches and has a great eye for scalability.",
  },
  {
    name: "Client",
    position: "Product Owner",
    message:
      "The Braincount platform exceeded our expectations. Snigdho's work on the analytics APIs and background pipelines gave us real-time data insights we didn't think were possible on our timeline.",
  },
];

export default function TestimonialSlider() {
  return (
    <Swiper
      navigation
      pagination={{ clickable: true }}
      modules={[Navigation, Pagination]}
      className="h-[320px] xl:h-[360px]"
    >
      {testimonialData.map((person, i) => (
        <SwiperSlide key={i}>
          <div className="flex flex-col items-center md:flex-row gap-x-8 h-full px-8 md:px-16">
            {/* avatar placeholder + name */}
            <div className="w-full max-w-[220px] flex flex-col xl:justify-center items-center relative mx-auto xl:mx-0">
              <div className="flex flex-col justify-center text-center">
                <div className="mb-2 mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-accent to-[#4b3792] flex items-center justify-center text-2xl font-bold text-white select-none">
                  {person.name.charAt(0)}
                </div>
                <div className="text-lg text-white">{person.name}</div>
                <div className="text-[12px] uppercase font-extralight tracking-widest text-white/60">
                  {person.position}
                </div>
              </div>
            </div>

            {/* quote */}
            <div className="flex-1 flex flex-col justify-center before:w-[1px] xl:before:bg-white/20 xl:before:absolute xl:before:left-0 xl:before:h-[200px] relative xl:pl-20 mt-4 md:mt-0">
              <div className="mb-4">
                <FaQuoteLeft
                  className="text-4xl xl:text-6xl text-white/20 mx-auto md:mx-0"
                  aria-hidden
                />
              </div>
              <div className="xl:text-lg text-center md:text-left text-white/80">
                {person.message}
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
