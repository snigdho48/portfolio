import { Link } from "react-router-dom";
import { HiArrowRight } from "react-icons/hi2";

export default function ProjectsBtn() {
  return (
    <div className="mx-auto xl:mx-0">
      <Link
        to="/work"
        aria-label="View my projects"
        className="relative w-[185px] h-[185px] flex justify-center items-center bg-circle-star bg-cover bg-center bg-no-repeat group block"
      >
        {/* spinning text ring — same size as modern-portfolio */}
        <svg
          viewBox="0 0 148 148"
          className="animate-spin-slow w-full h-full max-w-[141px] max-h-[148px] pointer-events-none select-none absolute"
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
      </Link>
    </div>
  );
}
