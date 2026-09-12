import Link from "next/link";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 shrink-0 rounded-md"
      aria-label="Minute AI — home"
    >
      <span
        className={`w-7 h-7 rounded-md flex items-center justify-center text-[13px] font-bold tracking-tight transition-transform duration-200 hover:scale-105 ${
          dark ? "bg-white text-stone-950" : "bg-stone-900 text-white"
        }`}
      >
        M
      </span>
      <span
        className={`text-[13px] font-semibold tracking-[0.18em] uppercase ${
          dark ? "text-white" : "text-stone-900"
        }`}
      >
        Minute AI
      </span>
    </Link>
  );
}
