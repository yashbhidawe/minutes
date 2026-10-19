"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`text-sm transition-colors ${
        active ? "text-stone-900 dark:text-stone-100 font-medium" : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
      }`}
    >
      {children}
    </Link>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xs tracking-widest uppercase text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              Minutes
            </Link>
            <nav className="flex items-center gap-6">
              <NavLink href="/dashboard">Meetings</NavLink>
              <NavLink href="/search">Ask all</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-stone-400 dark:text-stone-500">{user?.email}</span>
            <ThemeToggle />
            <button
              onClick={logout}
              className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
