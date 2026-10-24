"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";

export const HINDI_NAV_LINKS = [
  ["कैसे काम करता है", "#how"],
  ["विशेषताएं", "#features"],
  ["सेल्स टीम", "/hi/sales-teams"],
  ["हिंदी हिंग्लिश ट्रांसक्रिप्शन", "/hi/hindi-hinglish-transcription"],
  ["एक्सटेंशन", "/install"],
] as const;

export function HindiNav() {
  const { token } = useAuth();

  return (
    <header
      className="sticky top-0 z-40 border-b bg-[#fafaf9]/85 dark:bg-stone-950/85 backdrop-blur-md border-stone-200/80 dark:border-stone-800/80"
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4" aria-label="प्राथमिक">
        <Link href="/hi/" className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-50">
          Minutes
        </Link>
        <div className="hidden md:flex items-center gap-7 text-[13px] font-medium text-stone-500 dark:text-stone-400">
          {HINDI_NAV_LINKS.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="nav-link hover:text-stone-950 dark:hover:text-stone-50 transition-colors"
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
              className="px-4 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-[13px] font-medium rounded-md hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors"
            >
              डैशबोर्ड खोलें
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
                className="px-4 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-[13px] font-medium rounded-md hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors shadow-xs"
              >
                शुरू करें
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
