"use client";

import type { MouseEvent } from "react";
import { useTheme } from "@/components/theme-provider";

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v1m0 16v1m9-8h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0" />
    </svg>
  );
}

export function ThemeToggle({
  className = "",
  showLabel = false,
  tabIndex,
}: {
  className?: string;
  showLabel?: boolean;
  tabIndex?: number;
}) {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "light" ? "Switch to dark mode" : "Switch to light mode";

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX > 0 ? e.clientX : rect.left + rect.width / 2;
    const y = e.clientY > 0 ? e.clientY : rect.top + rect.height / 2;
    toggleTheme({ clientX: x, clientY: y });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      tabIndex={tabIndex}
      className={
        showLabel
          ? `flex w-full items-center justify-between gap-3 py-2.5 text-left ${className}`
          : `p-2 text-stone-600 hover:text-stone-950 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors ${className}`
      }
    >
      {showLabel && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
      <span className="transition-transform duration-300">
        {theme === "light" ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  );
}
