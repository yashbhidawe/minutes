"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/landing/Logo";

const DASHBOARD_LINKS = [
  ["Meetings", "/dashboard"],
  ["Ask all", "/search"],
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className={`sticky top-0 z-40 border-b bg-[#fafafa]/85 dark:bg-stone-950/85 backdrop-blur-md transition-shadow duration-300 ${
          scrolled ? "border-stone-200 dark:border-stone-800 shadow-[0_8px_30px_-18px_rgb(0_0_0/0.35)]" : "border-stone-200/80 dark:border-stone-800/80"
        }`}
      >
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4" aria-label="Primary">
          <Logo href="/dashboard" />
          <div className="hidden md:flex items-center gap-7 text-[13px] font-medium text-stone-500 dark:text-stone-400">
            {DASHBOARD_LINKS.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`nav-link hover:text-stone-950 dark:hover:text-stone-50 transition-colors ${isActive(href) ? "nav-link-active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-2.5">
            <span className="text-xs text-stone-400 dark:text-stone-500 max-w-[200px] truncate">{user?.email}</span>
            <ThemeToggle />
            <button
              onClick={logout}
              className="btn-interactive px-4 py-2 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-[13px] font-medium rounded-md hover:border-stone-900 dark:hover:border-stone-400 transition-colors"
            >
              Sign out
            </button>
          </div>
          {/* mobile: theme toggle stays outside the menu */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 -mr-2 text-stone-700 dark:text-stone-300 rounded-md"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                {menuOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </nav>

        {/* mobile menu — animated, always in DOM for a11y */}
        <div className="menu-panel md:hidden" data-open={menuOpen}>
          <div>
            <div className="border-t border-stone-200 dark:border-stone-800 bg-[#fafafa] dark:bg-[#0a0a0a] px-6 py-4 space-y-1 text-sm font-medium text-stone-600 dark:text-stone-400">
              {DASHBOARD_LINKS.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  tabIndex={menuOpen ? 0 : -1}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={`block py-2.5 border-b border-stone-100 dark:border-stone-800 hover:text-stone-950 dark:hover:text-stone-50 ${
                    isActive(href) ? "text-stone-950 dark:text-stone-50" : ""
                  }`}
                >
                  {label}
                </Link>
              ))}
              {user?.email && (
                <p className="py-2.5 text-xs text-stone-400 dark:text-stone-500 truncate">{user.email}</p>
              )}
              <div className="pt-2">
                <button
                  onClick={logout}
                  tabIndex={menuOpen ? 0 : -1}
                  className="w-full text-center px-4 py-2.5 border border-stone-300 dark:border-stone-700 rounded-md"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
