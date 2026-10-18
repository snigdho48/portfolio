import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";

export type Theme = "dark" | "light";

export type ThemeToggleOrigin = {
  x: number;
  y: number;
};

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: (origin?: ThemeToggleOrigin) => void;
};

const STORAGE_KEY = "snigdho-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  // Honor explicit user toggle only â€” never follow system light on first visit
  if (stored === "dark" || stored === "light") return stored;
  return "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function supportsViewTransitions(): boolean {
  return typeof document.startViewTransition === "function";
}

/** Distance from (x, y) to the farthest viewport corner. */
function farthestCornerRadius(x: number, y: number): number {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return Math.hypot(Math.max(x, vw - x), Math.max(y, vh - y));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback((origin?: ThemeToggleOrigin) => {
    if (!supportsViewTransitions() || prefersReducedMotion()) {
      setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
      return;
    }

    const x = origin?.x ?? window.innerWidth / 2;
    const y = origin?.y ?? window.innerHeight / 2;
    const r = farthestCornerRadius(x, y);

    const root = document.documentElement;
    root.style.setProperty("--theme-vt-x", `${x}px`);
    root.style.setProperty("--theme-vt-y", `${y}px`);
    root.style.setProperty("--theme-vt-r", `${r}px`);
    root.dataset.themeTransition = "circle";

    // Must call via document â€” unbound startViewTransition throws Illegal invocation
    if (typeof document.startViewTransition !== "function") {
      delete root.dataset.themeTransition;
      root.style.removeProperty("--theme-vt-x");
      root.style.removeProperty("--theme-vt-y");
      root.style.removeProperty("--theme-vt-r");
      setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
      return;
    }

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
      });
    });

    void transition.finished.finally(() => {
      delete root.dataset.themeTransition;
      root.style.removeProperty("--theme-vt-x");
      root.style.removeProperty("--theme-vt-y");
      root.style.removeProperty("--theme-vt-r");
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- shared constants/helpers live next to the component
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
