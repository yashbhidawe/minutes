"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function Arrow() {
  return (
    <span aria-hidden className="arrow inline-block transition-transform duration-200">
      →
    </span>
  );
}

export function AuthCta({ variant }: { variant: "hero" | "compact" | "final" }) {
  const { token } = useAuth();

  if (variant === "final") {
    return (
      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
        {token ? (
          <Link
            href="/dashboard"
            className="btn-interactive btn-arrow px-7 py-3 bg-white text-stone-950 text-sm font-semibold rounded-md hover:bg-stone-200 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            Open dashboard <Arrow />
          </Link>
        ) : (
          <>
            <Link
              href="/register"
              className="btn-interactive px-7 py-3 bg-white text-stone-950 text-sm font-semibold rounded-md hover:bg-stone-200 transition-colors text-center"
            >
              Create free account
            </Link>
            <Link
              href="/login"
              className="btn-interactive px-7 py-3 border border-stone-700 text-stone-200 text-sm font-medium rounded-md hover:border-stone-400 transition-colors text-center"
            >
              Sign in
            </Link>
          </>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="mt-7 flex gap-3">
        <Link
          href={token ? "/dashboard" : "/register"}
          className="btn-interactive btn-sheen btn-arrow px-5 py-2.5 bg-stone-900 text-white text-[13px] font-medium rounded-md hover:bg-stone-700 transition-colors inline-flex items-center gap-1.5"
        >
          {token ? (
            <>
              Open dashboard <Arrow />
            </>
          ) : (
            <>
              Try it free <Arrow />
            </>
          )}
        </Link>
        <Link
          href="/install"
          className="btn-interactive px-5 py-2.5 border border-stone-300 text-[13px] font-medium rounded-md hover:border-stone-900 transition-colors"
        >
          Get the extension
        </Link>
      </div>
    );
  }

  // hero
  return (
    <div className="mt-8 flex flex-col sm:flex-row gap-3">
      {token ? (
        <>
          <Link
            href="/install"
            className="btn-interactive btn-sheen px-6 py-3 bg-stone-900 text-white text-sm font-medium rounded-md hover:bg-stone-700 transition-colors text-center shadow-xs"
          >
            Get the extension
          </Link>
          <a
            href="#how"
            className="btn-interactive px-6 py-3 bg-white border border-stone-300 text-stone-800 text-sm font-medium rounded-md hover:border-stone-900 transition-colors text-center"
          >
            How it works
          </a>
        </>
      ) : (
        <>
          <Link
            href="/register"
            className="btn-interactive btn-sheen px-6 py-3 bg-stone-900 text-white text-sm font-medium rounded-md hover:bg-stone-700 transition-colors text-center shadow-xs"
          >
            Start capturing — it&apos;s free
          </Link>
          <Link
            href="/login"
            className="btn-interactive px-6 py-3 bg-white border border-stone-300 text-stone-800 text-sm font-medium rounded-md hover:border-stone-900 transition-colors text-center"
          >
            Sign in
          </Link>
        </>
      )}
    </div>
  );
}
