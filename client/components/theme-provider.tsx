"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

type TogglePoint = { clientX: number; clientY: number };

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: (point?: TogglePoint) => void;
} | undefined>(undefined);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // storage can be unavailable in private mode
  }
}

function playTick() {
  try {
    const Ctor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1500, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.035);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
    osc.onended = () => void ctx.close();
  } catch {
    // sound is best-effort
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const themeRef = useRef<Theme>("light");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("theme");
    } catch {
      stored = null;
    }
    const initial: Theme = stored === "dark" ? "dark" : "light";
    themeRef.current = initial;
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggleTheme = useCallback((point?: TogglePoint) => {
    const next: Theme = themeRef.current === "light" ? "dark" : "light";

    const commit = () => {
      themeRef.current = next;
      applyTheme(next);
      setTheme(next);
    };

    playTick();

    const doc = document as ViewTransitionDocument;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (point && !prefersReducedMotion && typeof doc.startViewTransition === "function") {
      const { clientX: x, clientY: y } = point;
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );
      const transition = doc.startViewTransition(commit);
      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${radius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 400,
              easing: "cubic-bezier(0, 0, 1, 1)",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        })
        .catch(() => {});
      transition.finished.catch(() => {});
    } else {
      commit();
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
