"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`text-sm transition-colors ${
        active ? "text-stone-900 font-medium" : "text-stone-400 hover:text-stone-600"
      }`}
    >
      {children}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xs tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors">
              Minute AI
            </Link>
            <nav className="flex items-center gap-6">
              <NavLink href="/dashboard">Meetings</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-stone-400">{user?.email}</span>
            <button
              onClick={logout}
              className="text-xs text-stone-400 hover:text-stone-900 transition-colors"
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
