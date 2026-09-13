"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "./Logo";
import { Arrow } from "./AuthCta";

export const NAV_LINKS = [
  ["How it works", "#how"],
  ["Features", "#features"],
  ["Product", "#product"],
  ["Extension", "#extension"],
  ["FAQ", "#faq"],
] as const;

export function LandingNav() {
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
    const ids = NAV_LINKS.map(([, href]) => href.slice(1));
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
      className={`sticky top-0 z-40 border-b bg-[#fafaf9]/85 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "border-stone-200 shadow-[0_8px_30px_-18px_rgb(0_0_0/0.35)]" : "border-stone-200/80"
      }`}
    >
      <nav
        className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4"
        aria-label="Primary"
      >
        <Logo />
        <div className="hidden md:flex items-center gap-7 text-[13px] font-medium text-stone-500">
          {NAV_LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              aria-current={active === href ? "true" : undefined}
              className={`nav-link hover:text-stone-950 transition-colors ${active === href ? "nav-link-active" : ""}`}
            >
              {label}
            </a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-2.5">
          {token ? (
            <Link
              href="/dashboard"
              className="btn-interactive btn-sheen btn-arrow px-4 py-2 bg-stone-900 text-white text-[13px] font-medium rounded-md hover:bg-stone-700 transition-colors inline-flex items-center gap-1.5"
            >
              Open dashboard <Arrow />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-[13px] font-medium text-stone-600 hover:text-stone-950 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="btn-interactive btn-sheen px-4 py-2 bg-stone-900 text-white text-[13px] font-medium rounded-md hover:bg-stone-700 transition-colors shadow-xs"
              >
                Get started
              </Link>
            </>
          )}
        </div>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden p-2 -mr-2 text-stone-700 rounded-md"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
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
          <div className="border-t border-stone-200 bg-[#fafaf9] px-6 py-4 space-y-1 text-sm font-medium text-stone-600">
            {NAV_LINKS.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                tabIndex={menuOpen ? 0 : -1}
                className="block py-2.5 border-b border-stone-100 last:border-0 hover:text-stone-950"
              >
                {label}
              </a>
            ))}
            <div className="flex gap-2 pt-3">
              {token ? (
                <Link
                  href="/dashboard"
                  tabIndex={menuOpen ? 0 : -1}
                  className="flex-1 text-center px-4 py-2.5 bg-stone-900 text-white text-sm rounded-md"
                >
                  Open dashboard →
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    tabIndex={menuOpen ? 0 : -1}
                    className="flex-1 text-center px-4 py-2.5 border border-stone-300 rounded-md"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    tabIndex={menuOpen ? 0 : -1}
                    className="flex-1 text-center px-4 py-2.5 bg-stone-900 text-white rounded-md"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* scroll progress hairline */}
      <div
        className="absolute bottom-0 left-0 h-[2px] bg-stone-900 transition-[width] duration-100"
        style={{ width: `${progress}%` }}
        aria-hidden
      />
    </header>
  );
}
