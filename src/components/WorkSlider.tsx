import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { BsArrowRight } from "react-icons/bs";
import "swiper/css";
import "swiper/css/pagination";
import { workSlides, projectDescriptions } from "@/data/portfolio";

export default function WorkSlider() {
  return (
    <Swiper
      spaceBetween={10}
      pagination={{ clickable: true }}
      modules={[Pagination]}
      speed={400}
      className="h-[200px] sm:h-[260px] xl:h-[300px] work-swiper"
    >
      {workSlides.slides.map((slide, i) => (
        <SwiperSlide key={i} className="h-full!">
          <div className="grid grid-cols-2 grid-rows-2 gap-2 sm:gap-4 h-full w-full min-h-0">
            {slide.images.map((image, imageI) => (
              <div
                key={imageI}
                className="relative rounded-lg overflow-hidden flex items-center justify-center group cursor-pointer min-h-0 bg-opacity-100"
                style={{ backgroundColor: image.color }}
              >
                <div className="flex items-center justify-center relative w-full h-full min-h-0 group p-3 sm:p-4">
                  {/* project name */}
                  <div className="text-center z-10 relative">
                    <p className="text-white font-semibold text-sm sm:text-base drop-shadow-sm">{image.title}</p>
                    <p className="text-white/70 text-xs mt-1 hidden sm:block max-w-[140px] mx-auto">
                      {projectDescriptions[image.title] ?? ""}
                    </p>
                  </div>

                  {/* overlay gradient on hover */}
                  <div
                    className="absolute inset-0 bg-linear-to-l from-transparent via-[#e838cc] to-[#4a22bd] opacity-0 group-hover:opacity-80 transition-opacity duration-500"
                    aria-hidden
                  />

                  {/* live project link */}
                  <div className="absolute bottom-0 translate-y-full group-hover:-translate-y-4 group-hover:sm:-translate-y-8 transition-transform duration-300 z-20">
                    <a
                      href={image.link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center gap-x-2 text-[13px] tracking-[0.2em] text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="delay-100">LIVE</span>
                      <span className="translate-y-[500%] group-hover:translate-y-0 transition-all duration-300 delay-150">PROJECT</span>
                      <BsArrowRight className="text-xl translate-y-[500%] group-hover:translate-y-0 transition-all duration-300 delay-150" aria-hidden />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
