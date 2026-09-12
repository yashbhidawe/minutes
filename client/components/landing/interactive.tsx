"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { FAQS } from "@/lib/landing-content";

/* ---------------------------------- Logo ---------------------------------- */

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

/* -------------------------------- Auth CTAs -------------------------------- */

function Arrow() {
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
          className="btn-interactive btn-arrow px-5 py-2.5 bg-stone-900 text-white text-[13px] font-medium rounded-md hover:bg-stone-700 transition-colors inline-flex items-center gap-1.5"
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
        <a
          href="#extension"
          className="btn-interactive px-5 py-2.5 border border-stone-300 text-[13px] font-medium rounded-md hover:border-stone-900 transition-colors"
        >
          Get the extension
        </a>
      </div>
    );
  }

  // hero
  return (
    <div className="mt-8 flex flex-col sm:flex-row gap-3">
      {token ? (
        <>
          <Link
            href="/dashboard"
            className="btn-interactive btn-arrow px-6 py-3 bg-stone-900 text-white text-sm font-medium rounded-md hover:bg-stone-700 transition-colors text-center shadow-xs inline-flex items-center justify-center gap-1.5"
          >
            Open dashboard <Arrow />
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
            className="btn-interactive px-6 py-3 bg-stone-900 text-white text-sm font-medium rounded-md hover:bg-stone-700 transition-colors text-center shadow-xs"
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

/* --------------------------------- Nav bar --------------------------------- */

const NAV_LINKS = [
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
            <a key={href} href={href} className="nav-link hover:text-stone-950 transition-colors">
              {label}
            </a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-2.5">
          {token ? (
            <Link
              href="/dashboard"
              className="btn-interactive btn-arrow px-4 py-2 bg-stone-900 text-white text-[13px] font-medium rounded-md hover:bg-stone-700 transition-colors inline-flex items-center gap-1.5"
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
                className="btn-interactive px-4 py-2 bg-stone-900 text-white text-[13px] font-medium rounded-md hover:bg-stone-700 transition-colors shadow-xs"
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

/* ------------------------------ Reveal on scroll ----------------------------- */

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* --------------------------------- CountUp ---------------------------------- */

export function CountUp({
  to,
  prefix = "",
  suffix = "",
}: {
  to: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (to === 0) return;
    const run = () => {
      if (started.current) return;
      started.current = true;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setVal(to);
        return;
      }
      const dur = 1300;
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(2, -10 * p); // easeOutExpo
        setVal(Math.round((p === 1 ? to : to * eased) * 10) / 10);
        if (p < 1) requestAnimationFrame(tick);
        else setVal(to);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            run();
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  const display = Number.isInteger(to) ? Math.round(val) : val.toFixed(0);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

export function Stat({
  to,
  prefix = "",
  suffix = "",
  word = "",
  label,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  word?: string;
  label: string;
}) {
  return (
    <div className="card-lift p-5 bg-white border border-stone-200 rounded-lg">
      <p className="text-2xl font-bold tracking-tight text-stone-950">
        <CountUp to={to} prefix={prefix} suffix={suffix} />
        {word ? ` ${word}` : null}
      </p>
      <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 mt-1.5 leading-relaxed">
        {label}
      </p>
    </div>
  );
}

/* ------------------------------- FAQ accordion ------------------------------- */

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-stone-200 border-y border-stone-200">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q}>
            <h3>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                id={`faq-button-${i}`}
                className="w-full flex items-center justify-between gap-4 py-5 text-left group rounded-sm"
              >
                <span
                  className={`text-[15px] font-medium tracking-tight transition-colors ${
                    isOpen ? "text-stone-950" : "text-stone-700 group-hover:text-stone-950"
                  }`}
                >
                  {f.q}
                </span>
                <span
                  className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isOpen
                      ? "bg-stone-950 text-white border-stone-950 rotate-45"
                      : "border-stone-300 text-stone-500 group-hover:border-stone-500"
                  }`}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
            </h3>
            {/* always in DOM: crawlable + smoothly animated */}
            <div
              id={`faq-panel-${i}`}
              role="region"
              aria-labelledby={`faq-button-${i}`}
              className="faq-panel"
              data-open={isOpen}
            >
              <div>
                <p className="pb-6 text-sm leading-relaxed text-stone-500 max-w-2xl">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------- Waveform ---------------------------------- */

const WAVE_HEIGHTS = [
  10, 18, 26, 14, 30, 22, 12, 28, 16, 34, 20, 11, 26, 32, 15, 24, 18, 30, 13, 22,
  28, 16, 34, 19, 12, 26, 20, 30,
];

function Waveform({ bars = 28, className = "" }: { bars?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-[3px] h-9 ${className}`} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="wave-bar w-[3px] rounded-full bg-stone-300"
          style={{
            height: `${WAVE_HEIGHTS[i % WAVE_HEIGHTS.length]}px`,
            animationDelay: `${(i % 12) * 0.12}s`,
            animationDuration: `${1.1 + ((i * 7) % 10) / 10}s`,
          }}
        />
      ))}
    </div>
  );
}

/* --------------------------------- Hero demo --------------------------------- */

const COPY_TEXT = `Weekly Team Sync (Tuesday · 32 min)

Key Decisions:
• Approved the new onboarding flow for next sprint
• Paused the homepage rewrite until research lands

Next Steps:
• Share the timeline update with stakeholders
• Confirm launch owners for Friday review

Action Items:
• [ ] Send updated timeline to the team (Priya)
• [ ] Confirm research readout date (Priya)`;

const STATUS_ORDER = ["to do", "in progress", "done"] as const;
type DemoStatus = (typeof STATUS_ORDER)[number];

const DEMO_ACTIONS: { desc: string; owner: string; dot: string; status: DemoStatus }[] = [
  { desc: "Send the revised timeline to the team", owner: "Yash", dot: "bg-red-500", status: "in progress" },
  { desc: "Confirm the research readout date", owner: "Priya", dot: "bg-amber-400", status: "to do" },
  { desc: "Publish notes to the shared doc", owner: "Unassigned", dot: "bg-emerald-500", status: "done" },
];

export function HeroDemo() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const [copied, setCopied] = useState(false);
  const [actions, setActions] = useState(DEMO_ACTIONS);

  const doneCount = actions.filter((a) => a.status === "done").length;

  const onMove = useCallback((e: React.PointerEvent) => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const r = wrap.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.classList.add("tilting");
      card.style.transform = `perspective(1100px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
    });
  }, []);

  const onLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    cancelAnimationFrame(raf.current);
    card.classList.remove("tilting");
    card.style.transform = "";
  }, []);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(COPY_TEXT);
    } catch {
      /* clipboard unavailable — still show feedback */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, []);

  const cycleStatus = useCallback((idx: number) => {
    setActions((prev) =>
      prev.map((a, i) =>
        i === idx
          ? { ...a, status: STATUS_ORDER[(STATUS_ORDER.indexOf(a.status) + 1) % STATUS_ORDER.length] }
          : a
      )
    );
  }, []);

  return (
    <div ref={wrapRef} onPointerMove={onMove} onPointerLeave={onLeave} className="relative">
      <div
        className="absolute -inset-6 bg-gradient-to-b from-stone-200/50 via-transparent to-transparent blur-2xl rounded-full"
        aria-hidden
      />
      <div
        ref={cardRef}
        className="tilt demo-card group relative bg-white border border-stone-200 rounded-xl shadow-[0_24px_60px_-24px_rgb(0_0_0/0.25)] overflow-hidden"
      >
        {/* window bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50/60">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-stone-800" />
          </div>
          <p className="text-[11px] font-mono text-stone-400">Your meeting summary</p>
          <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded border font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-current rec-dot" />
            ready
          </span>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-stone-950">
                Weekly Team Sync
              </p>
              <p className="text-[11px] text-stone-400 font-medium mt-0.5">Tuesday · 32 min</p>
            </div>
            <Waveform bars={18} />
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-3">
            <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-stone-400 mb-2.5">
              Key decisions
            </p>
            <ul className="space-y-2 text-[13px] leading-relaxed text-stone-800">
              <li className="flex gap-2">
                <span className="text-stone-300 font-bold" aria-hidden>
                  •
                </span>
                Approved the new onboarding flow for next sprint.
              </li>
              <li className="flex gap-2">
                <span className="text-stone-300 font-bold" aria-hidden>
                  •
                </span>
                Paused the homepage rewrite until research lands.
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => cycleStatus(0)}
              title="Try it — click to cycle the status"
              className="card-lift text-left p-3.5 bg-stone-50 border border-stone-200 rounded-lg cursor-pointer"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <p
                  className={`text-xs font-medium leading-snug transition-all duration-300 ${
                    actions[0].status === "done"
                      ? "text-stone-400 line-through"
                      : "text-stone-900"
                  }`}
                >
                  {actions[0].desc}
                </p>
              </div>
              <p className="text-[11px] text-stone-400 font-medium">
                {actions[0].owner} ·{" "}
                <span className="uppercase font-mono text-[10px] underline decoration-dotted underline-offset-2">
                  {actions[0].status} ↻
                </span>
              </p>
            </button>
            <div className="p-3.5 bg-stone-950 rounded-lg">
              <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                [04:12]
              </p>
              <p className="text-[12px] leading-relaxed text-stone-200 font-medium">
                “…so the summary lands before standup…”
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-stone-100 bg-white">
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`btn-interactive text-[11px] font-medium px-2.5 py-1 rounded border transition-colors inline-flex items-center gap-1.5 ${
                copied
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-stone-100 border-stone-200 text-stone-700 hover:border-stone-400"
              }`}
            >
              {copied ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied
                </>
              ) : (
                "Copy summary"
              )}
            </button>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded bg-stone-100 border border-stone-200 text-stone-700">
              Share
            </span>
          </div>
          <span className="text-[11px] font-semibold text-stone-900">View →</span>
        </div>
      </div>

      {/* floating chips */}
      <div className="animate-floaty hidden sm:flex absolute -left-8 top-16 items-center gap-2 bg-stone-950 text-white text-[11px] font-medium pl-2.5 pr-3 py-2 rounded-lg shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 rec-dot" />
        Notes in progress…
      </div>
      <div className="animate-floaty-delayed hidden sm:block absolute -right-5 -bottom-5 bg-white border border-stone-200 rounded-lg px-3.5 py-2.5 shadow-lg">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">
          Action items
        </p>
        <p className="text-sm font-bold text-stone-950 mt-0.5 tabular-nums">
          {actions.length} assigned · {doneCount} done
        </p>
      </div>
    </div>
  );
}
