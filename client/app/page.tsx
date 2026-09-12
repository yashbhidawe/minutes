"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

/* ---------------------------------- data ---------------------------------- */

const STEPS = [
  {
    n: "01",
    title: "Meet like normal",
    body: "Join your Google Meet as usual. No bots to invite, nothing to click, zero setup for your team.",
  },
  {
    n: "02",
    title: "We capture it",
    body: "Minute AI captures the conversation automatically and takes over the moment the call ends.",
  },
  {
    n: "03",
    title: "Read every word",
    body: "Get a full transcript you can skim, search and revisit — every key moment timestamped.",
  },
  {
    n: "04",
    title: "Walk away with clarity",
    body: "Decisions, highlights, blockers, next steps and owned action items — ready to share in minutes.",
  },
];

const FEATURES = [
  {
    title: "No bots, no awkward joins",
    body: "Nothing ever enters your call. No 'bot has joined' moment, no permissions to chase from IT.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    ),
  },
  {
    title: "Transcripts you can trust",
    body: "Every word captured with timestamps. Skim the highlights or drop into any moment instantly.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
    ),
  },
  {
    title: "Summaries worth sharing",
    body: "Every meeting becomes decisions, highlights, blockers and next steps — copy or share in one click.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
    ),
  },
  {
    title: "Action items that stick",
    body: "Owners, priorities and clear statuses. Nothing slips through after the call ends.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
    ),
  },
  {
    title: "A dashboard you'll open",
    body: "All your meetings in one calm place. Search, filter and jump into any conversation in one click.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
    ),
  },
  {
    title: "Private by design",
    body: "Your meetings stay yours. Secure sign-in, a private workspace, and full delete anytime — everything goes with it.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
    ),
  },
];

const FAQS = [
  {
    q: "Does a bot join my meeting?",
    a: "No. Nothing joins your call and your team sees no change. Minute AI works quietly in the background while you meet like normal.",
  },
  {
    q: "Do I need permission from IT or the host?",
    a: "No. There is nothing for an admin to install and no settings to change. If you can join the call, Minute AI can take notes for you.",
  },
  {
    q: "How fast do I get notes?",
    a: "Minutes after you hang up. Your dashboard updates on its own — you'll see the meeting move from recording to a finished summary without refreshing.",
  },
  {
    q: "What do I actually get per meeting?",
    a: "A searchable transcript, a clean summary (key decisions, highlights, blockers, next steps), action items with owners, plus the audio to listen back. Copy it, share it, done.",
  },
  {
    q: "Is my meeting data private?",
    a: "Yes. Meetings live in your private account only. Delete a meeting and its notes, action items and transcript are gone for good.",
  },
  {
    q: "What does it cost?",
    a: "Free to start, no credit card required. Create an account, add the extension, and capture your next meeting.",
  },
];

const TICKER = [
  "Automatic capture",
  "Instant summaries",
  "Action items",
  "Searchable transcripts",
  "Decisions & next steps",
  "One-click sharing",
  "Private by default",
  "No bots",
];

/* --------------------------------- pieces --------------------------------- */

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0">
      <span
        className={`w-7 h-7 rounded-md flex items-center justify-center text-[13px] font-bold tracking-tight ${
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

function Waveform({ bars = 28, className = "" }: { bars?: number; className?: string }) {
  const heights = [10, 18, 26, 14, 30, 22, 12, 28, 16, 34, 20, 11, 26, 32, 15, 24, 18, 30, 13, 22, 28, 16, 34, 19, 12, 26, 20, 30];
  return (
    <div className={`flex items-center gap-[3px] h-9 ${className}`} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="wave-bar w-[3px] rounded-full bg-stone-300"
          style={{
            height: `${heights[i % heights.length]}px`,
            animationDelay: `${(i % 12) * 0.12}s`,
            animationDuration: `${1.1 + ((i * 7) % 10) / 10}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------------------------------- page ---------------------------------- */

export default function LandingPage() {
  const { token } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 antialiased overflow-x-clip">
      {/* Announcement */}
      <div className="bg-stone-950 text-stone-200 text-center">
        <p className="text-[11px] font-mono uppercase tracking-[0.14em] px-4 py-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 align-middle rec-dot" />
          Automatic notes for Google Meet — decisions &amp; action items in minutes
        </p>
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#fafaf9]/85 backdrop-blur-md">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Logo />
          <div className="hidden md:flex items-center gap-7 text-[13px] font-medium text-stone-500">
            <a href="#how" className="hover:text-stone-950 transition-colors">How it works</a>
            <a href="#features" className="hover:text-stone-950 transition-colors">Features</a>
            <a href="#product" className="hover:text-stone-950 transition-colors">Product</a>
            <a href="#extension" className="hover:text-stone-950 transition-colors">Extension</a>
            <a href="#faq" className="hover:text-stone-950 transition-colors">FAQ</a>
          </div>
          <div className="hidden md:flex items-center gap-2.5">
            {token ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-stone-900 text-white text-[13px] font-medium rounded-md hover:bg-stone-700 transition-colors"
              >
                Open dashboard →
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
                  className="px-4 py-2 bg-stone-900 text-white text-[13px] font-medium rounded-md hover:bg-stone-700 transition-colors shadow-xs"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 -mr-2 text-stone-700"
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {menuOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </nav>
        {menuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-[#fafaf9] px-6 py-4 space-y-1 text-sm font-medium text-stone-600">
            {[
              ["How it works", "#how"],
              ["Features", "#features"],
              ["Product", "#product"],
              ["Extension", "#extension"],
              ["FAQ", "#faq"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block py-2.5 border-b border-stone-100 last:border-0 hover:text-stone-950"
              >
                {label}
              </a>
            ))}
            <div className="flex gap-2 pt-3">
              {token ? (
                <Link href="/dashboard" className="flex-1 text-center px-4 py-2.5 bg-stone-900 text-white text-sm rounded-md">
                  Open dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/login" className="flex-1 text-center px-4 py-2.5 border border-stone-300 rounded-md">
                    Sign in
                  </Link>
                  <Link href="/register" className="flex-1 text-center px-4 py-2.5 bg-stone-900 text-white rounded-md">
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="landing-grid absolute inset-0" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-14 md:pt-24 md:pb-20 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-10 items-center">
          {/* Copy */}
          <div>
            <div className="animate-fade-up inline-flex items-center gap-2 bg-white border border-stone-200 rounded-full pl-1.5 pr-3.5 py-1.5 shadow-xs mb-6">
              <span className="text-[10px] uppercase font-mono font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                New
              </span>
              <span className="text-xs font-medium text-stone-600">
                Automatic notes for every Google Meet
              </span>
            </div>

            <h1 className="animate-fade-up-1 text-[42px] leading-[1.02] md:text-[64px] font-light tracking-[-0.03em] text-stone-950">
              Meeting notes,
              <br />
              <span className="font-semibold">automatically.</span>
            </h1>

            <p className="animate-fade-up-2 mt-6 text-[15px] md:text-base leading-relaxed text-stone-500 max-w-xl">
              Minute AI turns your Google Meet into clear summaries, decisions
              and owned action items —{" "}
              <span className="text-stone-900 font-medium">minutes after you hang up.</span>
            </p>

            <div className="animate-fade-up-3 mt-8 flex flex-col sm:flex-row gap-3">
              {token ? (
                <>
                  <Link
                    href="/dashboard"
                    className="px-6 py-3 bg-stone-900 text-white text-sm font-medium rounded-md hover:bg-stone-700 transition-colors text-center shadow-xs"
                  >
                    Open dashboard →
                  </Link>
                  <a
                    href="#how"
                    className="px-6 py-3 bg-white border border-stone-300 text-stone-800 text-sm font-medium rounded-md hover:border-stone-900 transition-colors text-center"
                  >
                    How it works
                  </a>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="px-6 py-3 bg-stone-900 text-white text-sm font-medium rounded-md hover:bg-stone-700 transition-colors text-center shadow-xs"
                  >
                    Start capturing — it&apos;s free
                  </Link>
                  <Link
                    href="/login"
                    className="px-6 py-3 bg-white border border-stone-300 text-stone-800 text-sm font-medium rounded-md hover:border-stone-900 transition-colors text-center"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>

            <div className="animate-fade-up-4 mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-stone-400">
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><polyline points="20 6 9 17 4 12" /></svg>
                No bots in your call
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><polyline points="20 6 9 17 4 12" /></svg>
                Zero setup for your team
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><polyline points="20 6 9 17 4 12" /></svg>
                No manual notes again
              </span>
            </div>
          </div>

          {/* Product mock */}
          <div className="animate-fade-up-3 relative">
            <div className="absolute -inset-6 bg-gradient-to-b from-stone-200/50 via-transparent to-transparent blur-2xl rounded-full" aria-hidden />
            <div className="relative bg-white border border-stone-200 rounded-xl shadow-[0_24px_60px_-24px_rgb(0_0_0/0.25)] overflow-hidden">
              {/* window bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50/60">
                <div className="flex items-center gap-1.5">
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
                    <p className="text-[15px] font-semibold tracking-tight text-stone-950">Weekly Team Sync</p>
                    <p className="text-[11px] text-stone-400 font-medium mt-0.5">Tuesday · 32 min</p>
                  </div>
                  <Waveform bars={18} />
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-3">
                  <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-stone-400 mb-2.5">Key decisions</p>
                  <ul className="space-y-2 text-[13px] leading-relaxed text-stone-800">
                    <li className="flex gap-2"><span className="text-stone-300 font-bold">•</span>Approved the new onboarding flow for next sprint.</li>
                    <li className="flex gap-2"><span className="text-stone-300 font-bold">•</span>Paused the homepage rewrite until research lands.</li>
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <p className="text-xs font-medium text-stone-900 leading-snug">Send updated timeline to the team</p>
                    </div>
                    <p className="text-[11px] text-stone-400 font-medium">Priya · <span className="uppercase font-mono text-[10px]">high</span></p>
                  </div>
                  <div className="p-3.5 bg-stone-950 rounded-lg">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">[04:12]</p>
                    <p className="text-[12px] leading-relaxed text-stone-200 font-medium">“…so the summary lands before standup…”</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-t border-stone-100 bg-white">
                <div className="flex gap-2">
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded bg-stone-100 border border-stone-200 text-stone-700">Copy summary</span>
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded bg-stone-100 border border-stone-200 text-stone-700">Share</span>
                </div>
                <span className="text-[11px] font-semibold text-stone-900">View →</span>
              </div>
            </div>

            {/* floating chips */}
            <div className="hidden sm:flex absolute -left-8 top-16 items-center gap-2 bg-stone-950 text-white text-[11px] font-medium pl-2.5 pr-3 py-2 rounded-lg shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 rec-dot" />
              Notes in progress…
            </div>
            <div className="hidden sm:block absolute -right-5 -bottom-5 bg-white border border-stone-200 rounded-lg px-3.5 py-2.5 shadow-lg">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">Action items</p>
              <p className="text-sm font-bold text-stone-950 mt-0.5">3 assigned · 1 done</p>
            </div>
          </div>
        </div>

        {/* ticker */}
        <div className="relative border-y border-stone-200 bg-white/70 overflow-hidden">
          <div className="animate-ticker flex w-max items-center gap-3 py-3.5 px-3">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-stone-500 font-medium">{t}</span>
                <span className="w-1 h-1 rounded-full bg-stone-300" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["~3 min", "hang-up → notes in your inbox"],
            ["100%", "of every call searchable"],
            ["4 sections", "decisions · highlights · blockers · next steps"],
            ["0 bots", "ever join your meetings"],
          ].map(([big, small]) => (
            <div key={small} className="p-5 bg-white border border-stone-200 rounded-lg">
              <p className="text-2xl font-bold tracking-tight text-stone-950">{big}</p>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 mt-1.5 leading-relaxed">{small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-6xl mx-auto px-6 pb-20 scroll-mt-24">
        <div className="max-w-2xl mb-10">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 mb-3">How it works</p>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-stone-950">
            Hang up. <span className="font-semibold">Notes appear.</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-stone-500">
            You run the meeting. Minute AI handles the notes — capture,
            transcript, and a summary you can actually act on.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s) => (
            <div key={s.n} className="group bg-white border border-stone-200 rounded-lg p-6 hover:border-stone-900 hover:shadow-[0_16px_40px_-20px_rgb(0_0_0/0.3)] transition-all">
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-mono font-bold text-stone-300 group-hover:text-stone-900 transition-colors">{s.n}</span>
              </div>
              <h3 className="text-[15px] font-semibold tracking-tight text-stone-950 mb-2">{s.title}</h3>
              <p className="text-[13px] leading-relaxed text-stone-500">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-stone-200 bg-white scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div className="max-w-xl">
              <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 mb-3">Features</p>
              <h2 className="text-3xl md:text-4xl font-light tracking-tight text-stone-950">
                Everything after <span className="font-semibold">“bye, thanks all”</span>
              </h2>
            </div>
            <p className="text-sm text-stone-500 max-w-sm leading-relaxed">
              Calm, minimal and fast — dense where it matters, quiet everywhere else.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 bg-[#fafaf9] border border-stone-200 rounded-lg hover:bg-white hover:border-stone-300 hover:shadow-xs transition-all">
                <div className="w-9 h-9 rounded-md bg-stone-900 text-white flex items-center justify-center mb-5">
                  {f.icon}
                </div>
                <h3 className="text-[15px] font-semibold tracking-tight text-stone-950 mb-2">{f.title}</h3>
                <p className="text-[13px] leading-relaxed text-stone-500">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product deep-dive */}
      <section id="product" className="max-w-6xl mx-auto px-6 py-20 scroll-mt-24">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 mb-3">Inside a meeting</p>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight text-stone-950 leading-tight">
              One page. <span className="font-semibold">Full context.</span>
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-stone-500">
              Structured notes on the left, accountable action items on the
              right, and the full conversation one click below.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-stone-600">
              {[
                "Copy or share your summary in one click",
                "Track every action item through to done",
                "Listen back to any moment, whenever you need it",
              ].map((li) => (
                <li key={li} className="flex items-start gap-2.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 mt-0.5 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                  <span className="leading-relaxed">{li}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex gap-3">
              <Link href={token ? "/dashboard" : "/register"} className="px-5 py-2.5 bg-stone-900 text-white text-[13px] font-medium rounded-md hover:bg-stone-700 transition-colors">
                {token ? "Open dashboard →" : "Try it free →"}
              </Link>
              <a href="#extension" className="px-5 py-2.5 border border-stone-300 text-[13px] font-medium rounded-md hover:border-stone-900 transition-colors">
                Get the extension
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-stone-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-stone-100 pb-3">
                <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-500">Next steps</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  "Share the timeline update with stakeholders",
                  "Confirm launch owners for Friday review",
                  "Prep the demo for the weekly sync",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-2.5 text-sm text-stone-800 leading-relaxed">
                    <span className="text-stone-300 font-bold select-none">•</span>
                    <p className="flex-1">{t}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-stone-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
                <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-500">Action items</h3>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">3</span>
              </div>
              <div className="space-y-3">
                {[
                  ["Send the revised timeline to the team", "Yash", "bg-red-500", "in progress"],
                  ["Confirm the research readout date", "Priya", "bg-amber-400", "to do"],
                  ["Publish notes to the shared doc", "Unassigned", "bg-emerald-500", "done"],
                ].map(([desc, owner, dot, status]) => (
                  <div key={desc} className="p-3.5 bg-stone-50 border border-stone-200 rounded">
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`inline-block w-2 h-2 rounded-full mt-1.5 shrink-0 ${dot}`} />
                      <p className="text-xs text-stone-900 font-medium leading-relaxed flex-1">{desc}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-stone-200/60 text-[11px]">
                      <span className="font-medium text-stone-500">{owner}</span>
                      <span className="text-[10px] uppercase tracking-wider bg-stone-100 border border-stone-300 px-2 py-1 rounded text-stone-700 font-mono">{status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-stone-950 text-stone-200 p-6 rounded-lg font-mono text-xs space-y-2.5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-stone-500 font-sans font-semibold mb-1">Full transcript</p>
              {[
                ["00:00", "Alright, let's keep this tight — recap decisions, then blockers."],
                ["04:12", "If the summary lands before standup, nobody needs to rewatch the call."],
                ["11:47", "Action items need owners. Unowned tasks just evaporate."],
              ].map(([ts, text]) => (
                <div key={ts} className="flex items-start gap-4 p-1 rounded">
                  <span className="text-stone-500 font-bold select-none shrink-0">[{ts}]</span>
                  <p className="text-stone-200 leading-relaxed font-sans text-[13px]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Extension */}
      <section id="extension" className="max-w-6xl mx-auto px-6 pb-20 scroll-mt-24">
        <div className="bg-stone-950 rounded-xl overflow-hidden grid lg:grid-cols-2">
          <div className="p-8 md:p-12">
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-500 mb-4">Chrome extension</p>
            <h2 className="text-3xl md:text-[34px] font-light tracking-tight text-stone-100 leading-tight">
              Installs in a minute. <span className="font-semibold">Works every call.</span>
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-stone-400">
              Add Minute AI once, sign in, and forget it exists. It handles the
              rest quietly in the background.
            </p>
            <ol className="mt-8 space-y-4">
              {[
                ["1", "Add Minute AI to Chrome"],
                ["2", "Sign in once"],
                ["3", "Run your Meet — notes appear after"],
              ].map(([n, t]) => (
                <li key={n} className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-md bg-stone-800 border border-stone-700 text-stone-100 text-[13px] font-bold flex items-center justify-center shrink-0">{n}</span>
                  <p className="text-sm text-stone-300 font-medium">{t}</p>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="https://github.com/yashbhidawe" target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-white text-stone-950 text-[13px] font-semibold rounded-md hover:bg-stone-200 transition-colors text-center">
                Get the extension
              </a>
              <a href="#faq" className="px-5 py-2.5 border border-stone-700 text-stone-200 text-[13px] font-medium rounded-md hover:border-stone-400 transition-colors text-center">
                Privacy & FAQ
              </a>
            </div>
          </div>
          <div className="bg-stone-900 border-t lg:border-t-0 lg:border-l border-stone-800 p-8 md:p-12 flex flex-col justify-center gap-4">
            <div className="bg-stone-950 border border-stone-800 rounded-lg p-6">
              <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-stone-500 mb-4">What you get</p>
              <ul className="space-y-3">
                {[
                  "Summaries minutes after every call",
                  "Decisions, blockers & owners, sorted",
                  "Searchable history of every meeting",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-stone-200">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 mt-0.5 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                    <span className="leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-stone-950 border border-stone-800 rounded-lg p-6">
              <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-stone-500 mb-4">What you&apos;ll never see</p>
              <ul className="space-y-3">
                {[
                  "No bots joining your calls",
                  "No popups or extra windows",
                  "No setup for your teammates",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-stone-400">
                    <span className="w-[15px] text-center leading-none mt-0.5 shrink-0">—</span>
                    <span className="leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-stone-200 bg-white scroll-mt-16">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 mb-3 text-center">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-stone-950 text-center">
            Asked on <span className="font-semibold">every call</span>
          </h2>
          <div className="mt-10 divide-y divide-stone-200 border-y border-stone-200">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 py-5 text-left group"
                  >
                    <span className={`text-[15px] font-medium tracking-tight ${open ? "text-stone-950" : "text-stone-700 group-hover:text-stone-950"} transition-colors`}>
                      {f.q}
                    </span>
                    <span className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 transition-all ${open ? "bg-stone-950 text-white border-stone-950" : "border-stone-300 text-stone-500"}`}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={`transition-transform ${open ? "rotate-45" : ""}`}>
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </button>
                  {open && (
                    <p className="pb-6 text-sm leading-relaxed text-stone-500 max-w-2xl animate-fade-up">{f.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="relative overflow-hidden bg-stone-950 rounded-xl px-8 py-14 md:p-16 text-center">
          <div className="landing-grid absolute inset-0 opacity-40 invert" aria-hidden />
          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stone-500 mb-4">Free to start · No credit card</p>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight text-white leading-tight">
              Stop taking notes.
              <br />
              <span className="font-semibold">Start shipping.</span>
            </h2>
            <p className="mt-5 text-[15px] text-stone-400 max-w-xl mx-auto leading-relaxed">
              Create an account, add the extension, and walk out of your next
              Google Meet with decisions, owners and next steps already written.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              {token ? (
                <Link href="/dashboard" className="px-7 py-3 bg-white text-stone-950 text-sm font-semibold rounded-md hover:bg-stone-200 transition-colors">
                  Open dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/register" className="px-7 py-3 bg-white text-stone-950 text-sm font-semibold rounded-md hover:bg-stone-200 transition-colors">
                    Create free account
                  </Link>
                  <Link href="/login" className="px-7 py-3 border border-stone-700 text-stone-200 text-sm font-medium rounded-md hover:border-stone-400 transition-colors">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-[1.2fr_1fr_1fr_1fr] gap-10">
          <div>
            <Logo />
            <p className="mt-4 text-[13px] leading-relaxed text-stone-500 max-w-xs">
              Automatic meeting notes for Google Meet. Decisions, action items and summaries — minutes after you hang up.
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 mb-4">Product</p>
            <ul className="space-y-2.5 text-[13px] font-medium text-stone-600">
              <li><a href="#how" className="hover:text-stone-950 transition-colors">How it works</a></li>
              <li><a href="#features" className="hover:text-stone-950 transition-colors">Features</a></li>
              <li><a href="#extension" className="hover:text-stone-950 transition-colors">Chrome extension</a></li>
              <li><Link href="/dashboard" className="hover:text-stone-950 transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 mb-4">Account</p>
            <ul className="space-y-2.5 text-[13px] font-medium text-stone-600">
              <li><Link href="/login" className="hover:text-stone-950 transition-colors">Sign in</Link></li>
              <li><Link href="/register" className="hover:text-stone-950 transition-colors">Create account</Link></li>
              <li><a href="#faq" className="hover:text-stone-950 transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 mb-4">Built by</p>
            <ul className="space-y-2.5 text-[13px] font-medium text-stone-600">
              <li><a href="https://itsokyash.online" target="_blank" rel="noreferrer" className="hover:text-stone-950 transition-colors">itsokyash.online ↗</a></li>
              <li><a href="https://github.com/yashbhidawe" target="_blank" rel="noreferrer" className="hover:text-stone-950 transition-colors">GitHub ↗</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-stone-200">
          <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-stone-400">© 2026 Minute AI. Meeting notes, automatically.</p>
            <p className="text-[11px] font-mono uppercase tracking-wider text-stone-300">No bots were invited to this meeting</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
