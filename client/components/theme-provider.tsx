"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
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

const THEME_KEY = "theme";

// localStorage is an external store, so the theme is read through
// useSyncExternalStore rather than mirrored into React state from an effect.
// That keeps the server-rendered markup and the first client render in
// agreement (both "light") and lets React reconcile the stored preference
// right after hydration.
const themeListeners = new Set<() => void>();

function notifyThemeChange() {
  for (const listener of themeListeners) listener();
}

function subscribeToTheme(onStoreChange: () => void) {
  themeListeners.add(onStoreChange);
  // Fires in other tabs, so the theme stays in sync across windows.
  window.addEventListener("storage", onStoreChange);
  return () => {
    themeListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getThemeSnapshot(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    // storage can be unavailable in private mode
    return "light";
  }
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

function persistTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // storage can be unavailable in private mode
  }
  notifyThemeChange();
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
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );
  const themeRef = useRef<Theme>(theme);

  useEffect(() => {
    themeRef.current = theme;
    applyThemeClass(theme);
  }, [theme]);

  const toggleTheme = useCallback((point?: TogglePoint) => {
    const next: Theme = themeRef.current === "light" ? "dark" : "light";

    const commit = () => {
      themeRef.current = next;
      applyThemeClass(next);
      persistTheme(next);
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
