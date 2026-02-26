import { useLocation } from "react-router-dom";
import { useTransition } from "@/context/TransitionContext";

const ROUTES = [
  { path: "/",             label: "Home"         },
  { path: "/about",        label: "About"        },
  { path: "/services",     label: "Services"     },
  { path: "/work",         label: "Work"         },
  { path: "/testimonials", label: "Testimonials" },
  { path: "/contact",      label: "Contact"      },
];

export default function PageProgress() {
  const { pathname }  = useLocation();
  const { navigateTo } = useTransition();
  const currentIndex  = ROUTES.findIndex((r) => r.path === pathname);

  return (
    <div className="fixed left-4 xl:left-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-y-3 hidden md:flex">
      {ROUTES.map((route, i) => (
        <button
          key={route.path}
          type="button"
          onClick={() => navigateTo(route.path)}
          onFocus={(e) => e.currentTarget.blur()}
          tabIndex={-1}
          aria-label={route.label}
          title={route.label}
          className={`relative group w-2 h-2 rounded-full transition-all duration-500 border-0 cursor-pointer ${
            i === currentIndex
              ? "bg-accent scale-150"
              : "bg-white/30 hover:bg-white/70"
          }`}
        >
          {/* tooltip */}
          <span className="absolute left-5 top-1/2 -translate-y-1/2 hidden group-hover:block bg-white text-primary text-[11px] font-semibold px-2 py-1 rounded-[3px] whitespace-nowrap">
            {route.label}
          </span>
        </button>
      ))}

      {/* page number */}
      <div className="mt-2 text-[10px] text-white/40 font-light text-center tabular-nums">
        {String(currentIndex + 1).padStart(2, "0")}
        <span className="block text-white/20">/{ROUTES.length}</span>
      </div>
    </div>
  );
}
