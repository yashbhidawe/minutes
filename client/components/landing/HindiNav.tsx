"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "./Logo";
import { Arrow } from "./AuthCta";

export const HINDI_NAV_LINKS = [
  ["कैसे काम करता है", "#how"],
  ["विशेषताएं", "#features"],
  ["सेल्स टीम", "/hi/sales-teams"],
  ["हिंदी हिंग्लिश ट्रांसक्रिप्शन", "/hi/hindi-hinglish-transcription"],
  ["एक्सटेंशन", "/install"],
] as const;

export function HindiNav() {
  const { token } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 8);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  /* Scrollspy — highlights the nav link for the section in view */
  useEffect(() => {
    const ids = HINDI_NAV_LINKS.map(([, href]) => href.slice(1));
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(`#${e.target.id}`);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-[#fafaf9]/85 dark:bg-stone-950/85 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "border-stone-200 dark:border-stone-800 shadow-[0_8px_30px_-18px_rgb(0_0_0/0.35)]" : "border-stone-200/80 dark:border-stone-800/80"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4" aria-label="प्राथमिक">
        <Logo />
        <div className="hidden md:flex items-center gap-7 text-[13px] font-medium text-stone-500 dark:text-stone-400">
          {HINDI_NAV_LINKS.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={active === href ? "true" : undefined}
              className={`nav-link hover:text-stone-950 dark:hover:text-stone-50 transition-colors ${active === href ? "nav-link-active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-2.5">
          <ThemeToggle />
          <Link
            href="/"
            className="px-4 py-2 text-[13px] font-medium text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-50 transition-colors"
          >
            English
          </Link>
          {token ? (
            <Link
              href="/dashboard"
              className="btn-interactive btn-sheen btn-arrow px-4 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-[13px] font-medium rounded-md hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors inline-flex items-center gap-1.5"
            >
              डैशबोर्ड खोलें <Arrow />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-[13px] font-medium text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-50 transition-colors"
              >
                साइन इन करें
              </Link>
              <Link
                href="/register"
                className="btn-interactive btn-sheen px-4 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-[13px] font-medium rounded-md hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors shadow-xs"
              >
                शुरू करें
              </Link>
            </>
          )}
        </div>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden p-2 -mr-2 text-stone-700 dark:text-stone-300 rounded-md"
          aria-label={menuOpen ? "मेनू बंद करें" : "मेनू खोलें"}
          aria-expanded={menuOpen}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            {menuOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </nav>

      {/* mobile menu — animated, always in DOM for a11y */}
      <div className="menu-panel md:hidden" data-open={menuOpen}>
        <div>
          <div className="border-t border-stone-200 dark:border-stone-800 bg-[#fafaf9] dark:bg-stone-950 px-6 py-4 space-y-1 text-sm font-medium text-stone-600 dark:text-stone-400">
            {HINDI_NAV_LINKS.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                tabIndex={menuOpen ? 0 : -1}
                className="block py-2.5 border-b border-stone-100 dark:border-stone-800 last:border-0 hover:text-stone-950 dark:hover:text-stone-50"
              >
                {label}
              </a>
            ))}
            <ThemeToggle
              showLabel
              tabIndex={menuOpen ? 0 : -1}
              className="border-b border-stone-100 dark:border-stone-800 hover:text-stone-950 dark:hover:text-stone-50"
            />
            <Link
              href="/"
              tabIndex={menuOpen ? 0 : -1}
              className="block py-2.5 border-b border-stone-100 dark:border-stone-800 hover:text-stone-950 dark:hover:text-stone-50"
            >
              English
            </Link>
            <div className="flex gap-2 pt-3">
              {token ? (
                <Link
                  href="/dashboard"
                  tabIndex={menuOpen ? 0 : -1}
                  className="flex-1 text-center px-4 py-2.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-sm rounded-md"
                >
                  डैशबोर्ड खोलें →
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    tabIndex={menuOpen ? 0 : -1}
                    className="flex-1 text-center px-4 py-2.5 border border-stone-300 dark:border-stone-700 rounded-md"
                  >
                    साइन इन करें
                  </Link>
                  <Link
                    href="/register"
                    tabIndex={menuOpen ? 0 : -1}
                    className="flex-1 text-center px-4 py-2.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded-md"
                  >
                    शुरू करें
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* scroll progress hairline */}
      <div
        className="absolute bottom-0 left-0 h-[2px] bg-stone-900 dark:bg-stone-100 transition-[width] duration-100"
        style={{ width: `${progress}%` }}
        aria-hidden
      />
    </header>
  );
}
