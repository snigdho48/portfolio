import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Pagination } from "swiper/modules";
import { RxArrowTopRight } from "react-icons/rx";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";
import { services } from "@/data/portfolio";

export default function ServiceSlider() {
  return (
    <Swiper
      breakpoints={{
        320: { slidesPerView: 1, spaceBetween: 12 },
        640: { slidesPerView: 2, spaceBetween: 15 },
        1200: { slidesPerView: 3, spaceBetween: 15 },
      }}
      pagination={{ clickable: true }}
      modules={[FreeMode, Pagination]}
      freeMode
      speed={400}
      className="h-[220px] sm:h-[260px] xl:h-[300px] service-swiper"
    >
      {services.map((item, i) => (
        <SwiperSlide key={i} className="h-full!">
          <div className="bg-[rgba(65,47,123,0.15)] h-full min-h-0 rounded-lg px-4 py-4 sm:px-5 sm:py-5 xl:px-6 xl:py-6 flex flex-col gap-2 group cursor-pointer hover:bg-[rgba(89,65,169,0.15)] transition-colors duration-300 overflow-hidden">
            <div className="text-2xl sm:text-3xl xl:text-4xl text-accent shrink-0">
              <item.Icon aria-hidden />
            </div>
            <div className="min-h-0 flex-1 flex flex-col">
              <div className="mb-1 text-base sm:text-lg text-white font-medium shrink-0 drop-shadow-sm">{item.title}</div>
              <p className="leading-normal text-white/70 font-light text-xs sm:text-sm line-clamp-3 sm:line-clamp-4 overflow-hidden">
                {item.description}
              </p>
            </div>
            <div className="text-2xl xl:text-3xl text-white/60 shrink-0 self-end">
              <RxArrowTopRight
                className="group-hover:rotate-45 group-hover:text-accent transition-transform duration-300"
                aria-hidden
              />
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
