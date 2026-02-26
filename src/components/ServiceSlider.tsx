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
        320: { slidesPerView: 1, spaceBetween: 15 },
        640: { slidesPerView: 3, spaceBetween: 15 },
      }}
      pagination={{ clickable: true }}
      modules={[FreeMode, Pagination]}
      freeMode
      className="h-[200px] sm:h-[260px] xl:h-[300px]"
    >
      {services.map((item, i) => (
        <SwiperSlide key={i}>
          <div className="bg-[rgba(65,47,123,0.15)] h-max rounded-lg px-6 py-8 flex sm:flex-col gap-x-6 sm:gap-x-0 group cursor-pointer hover:bg-[rgba(89,65,169,0.15)] transition-all duration-300">
            <div className="text-4xl text-accent mb-4">
              <item.Icon aria-hidden />
            </div>
            <div className="mb-8">
              <div className="mb-2 text-lg text-white">{item.title}</div>
              <p className="max-w-[350px] leading-normal text-white/60 font-light text-sm">
                {item.description}
              </p>
            </div>
            <div className="text-3xl text-white/60">
              <RxArrowTopRight
                className="group-hover:rotate-45 group-hover:text-accent transition-all duration-300"
                aria-hidden
              />
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
