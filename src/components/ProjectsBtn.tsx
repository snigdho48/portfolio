import { HiArrowRight } from "react-icons/hi2";
import { useTransition } from "@/context/TransitionContext";

export default function ProjectsBtn() {
  const { navigateTo } = useTransition();

  return (
    <div className="mx-auto xl:mx-0">
      <button
        type="button"
        onClick={() => navigateTo("/work")}
        onFocus={(e) => e.currentTarget.blur()}
        tabIndex={-1}
        aria-label="View my projects"
        className="relative w-[185px] h-[185px] flex justify-center items-center bg-circle-star bg-cover bg-center bg-no-repeat group cursor-pointer border-0 bg-transparent"
      >
        {/* spinning text ring */}
        <svg
          viewBox="0 0 148 148"
          className="animate-spin-slow w-full h-full max-w-[141px] max-h-[141px] pointer-events-none select-none absolute"
          aria-hidden
        >
          <defs>
            <path id="textCircle" d="M 74,74 m -60,0 a 60,60 0 1,1 120,0 a 60,60 0 1,1 -120,0" />
          </defs>
          <text fontSize="10.5" fill="white" letterSpacing="3.2">
            <textPath href="#textCircle">
              MY PROJECTS ● MY PROJECTS ●
            </textPath>
          </text>
        </svg>
        <HiArrowRight
          className="absolute text-4xl group-hover:translate-x-2 transition-all duration-300"
          aria-hidden
        />
      </button>
    </div>
  );
}
