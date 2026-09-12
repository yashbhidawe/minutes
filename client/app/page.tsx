import type { Metadata } from "next";
import Link from "next/link";
import { DEFINITION_ANSWER, FAQS, STEPS, TICKER } from "@/lib/landing-content";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import {
  AuthCta,
  FaqAccordion,
  HeroDemo,
  LandingNav,
  Logo,
  Reveal,
  Stat,
} from "@/components/landing/interactive";

export const metadata: Metadata = {
  title: "Automatic Meeting Notes for Google Meet",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

/* Structured data: one @graph so crawlers + answer engines get
   Organization, WebSite, SoftwareApplication, FAQPage, HowTo, Breadcrumb. */
function JsonLd() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Chrome",
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "HowTo",
        name: "How to get automatic meeting notes for Google Meet",
        description:
          "Join your call as normal and receive a transcript, summary and action items minutes after you hang up.",
        step: STEPS.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.title,
          text: s.body,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/* --------------------------------- features -------------------------------- */

const FEATURES = [
  {
    title: "No bots, no awkward joins",
    body: "Nothing ever enters your call. No 'bot has joined' moment, no permissions to chase from IT.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    ),
  },
  {
    title: "Transcripts you can trust",
    body: "Every word captured with timestamps. Skim the highlights or drop into any moment instantly.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
    ),
  },
  {
    title: "Summaries worth sharing",
    body: "Every meeting becomes decisions, highlights, blockers and next steps — copy or share in one click.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
    ),
  },
  {
    title: "Action items that stick",
    body: "Owners, priorities and clear statuses. Nothing slips through after the call ends.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
    ),
  },
  {
    title: "A dashboard you'll open",
    body: "All your meetings in one calm place. Search, filter and jump into any conversation in one click.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
    ),
  },
  {
    title: "Private by design",
    body: "Your meetings stay yours. Secure sign-in, a private workspace, and full delete anytime — everything goes with it.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
    ),
  },
];

function Check({ className = "text-emerald-600" }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ----------------------------------- page ----------------------------------- */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 antialiased overflow-x-clip">
      <JsonLd />

      {/* Announcement */}
      <div className="bg-stone-950 text-stone-200 text-center">
        <p className="text-[11px] font-mono uppercase tracking-[0.14em] px-4 py-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 align-middle rec-dot" aria-hidden />
          Automatic notes for Google Meet — decisions &amp; action items in minutes
        </p>
      </div>

      <LandingNav />

      <main>
        {/* Hero */}
        <section className="relative" aria-labelledby="hero-heading">
          <div className="landing-grid absolute inset-0" aria-hidden />
          <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-14 md:pt-24 md:pb-20 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-10 items-center">
            <div>
              <div className="animate-fade-up inline-flex items-center gap-2 bg-white border border-stone-200 rounded-full pl-1.5 pr-3.5 py-1.5 shadow-xs mb-6">
                <span className="text-[10px] uppercase font-mono font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  New
                </span>
                <span className="text-xs font-medium text-stone-600">
                  Automatic notes for every Google Meet
                </span>
              </div>

              <h1
                id="hero-heading"
                className="animate-fade-up-1 text-[42px] leading-[1.02] md:text-[64px] font-light tracking-[-0.03em] text-stone-950"
              >
                Meeting notes,
                <br />
                <span className="font-semibold">automatically.</span>
              </h1>

              <p className="animate-fade-up-2 mt-6 text-[15px] md:text-base leading-relaxed text-stone-500 max-w-xl">
                Minute AI turns your Google Meet into clear summaries, decisions
                and owned action items —{" "}
                <span className="text-stone-900 font-medium">minutes after you hang up.</span>
              </p>

              <div className="animate-fade-up-3">
                <AuthCta variant="hero" />
              </div>

              <ul className="animate-fade-up-4 mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-stone-400">
                <li className="flex items-center gap-1.5">
                  <Check /> No bots in your call
                </li>
                <li className="flex items-center gap-1.5">
                  <Check /> Zero setup for your team
                </li>
                <li className="flex items-center gap-1.5">
                  <Check /> No manual notes again
                </li>
              </ul>
            </div>

            <div className="animate-fade-up-3">
              <HeroDemo />
            </div>
          </div>

          {/* ticker */}
          <div className="ticker-mask relative border-y border-stone-200 bg-white/70 overflow-hidden">
            <div className="animate-ticker flex w-max items-center gap-3 py-3.5 px-3" aria-hidden>
              {[...TICKER, ...TICKER].map((t, i) => (
                <span key={i} className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-stone-500 font-medium">{t}</span>
                  <span className="w-1 h-1 rounded-full bg-stone-300" />
                </span>
              ))}
            </div>
            <span className="sr-only">
              Automatic capture, instant summaries, action items, searchable transcripts.
            </span>
          </div>
        </section>

        {/* AEO definition */}
        <section className="max-w-3xl mx-auto px-6 pt-14" aria-labelledby="what-heading">
          <Reveal>
            <h2 id="what-heading" className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 mb-3 text-center">
              What is Minute AI?
            </h2>
            <p className="text-center text-[17px] md:text-lg leading-relaxed text-stone-700 font-light">
              {DEFINITION_ANSWER}
            </p>
          </Reveal>
        </section>

        {/* Stats */}
        <section className="max-w-6xl mx-auto px-6 py-14" aria-label="Minute AI at a glance">
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat prefix="~" to={3} suffix=" min" label="hang-up → notes in your inbox" />
              <Stat to={100} suffix="%" label="of every call searchable" />
              <Stat to={4} word="sections" label="decisions · highlights · blockers · next steps" />
              <Stat to={0} word="bots" label="ever join your meetings" />
            </div>
          </Reveal>
        </section>

        {/* How it works */}
        <section id="how" className="max-w-6xl mx-auto px-6 pb-20 scroll-mt-24" aria-labelledby="how-heading">
          <Reveal>
            <div className="max-w-2xl mb-10">
              <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 mb-3">How it works</p>
              <h2 id="how-heading" className="text-3xl md:text-4xl font-light tracking-tight text-stone-950">
                Hang up. <span className="font-semibold">Notes appear.</span>
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-stone-500">
                You run the meeting. Minute AI handles the notes — capture,
                transcript, and a summary you can actually act on.
              </p>
            </div>
          </Reveal>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 list-none">
            {STEPS.map((s, i) => (
              <li key={s.n}>
                <Reveal delay={i * 80} className="h-full">
                  <div className="card-lift group bg-white border border-stone-200 rounded-lg p-6 hover:border-stone-900 hover:shadow-[0_16px_40px_-20px_rgb(0_0_0/0.3)] h-full">
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-xs font-mono font-bold text-stone-300 group-hover:text-stone-900 transition-colors">{s.n}</span>
                    </div>
                    <h3 className="text-[15px] font-semibold tracking-tight text-stone-950 mb-2">{s.title}</h3>
                    <p className="text-[13px] leading-relaxed text-stone-500">{s.body}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        {/* Features */}
        <section id="features" className="border-y border-stone-200 bg-white scroll-mt-16" aria-labelledby="features-heading">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <Reveal>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div className="max-w-xl">
                  <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 mb-3">Features</p>
                  <h2 id="features-heading" className="text-3xl md:text-4xl font-light tracking-tight text-stone-950">
                    Everything after <span className="font-semibold">“bye, thanks all”</span>
                  </h2>
                </div>
                <p className="text-sm text-stone-500 max-w-sm leading-relaxed">
                  Calm, minimal and fast — dense where it matters, quiet everywhere else.
                </p>
              </div>
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={(i % 3) * 80}>
                  <div className="card-lift p-6 bg-[#fafaf9] border border-stone-200 rounded-lg hover:bg-white hover:border-stone-300 hover:shadow-xs h-full">
                    <div className="w-9 h-9 rounded-md bg-stone-900 text-white flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-105">
                      {f.icon}
                    </div>
                    <h3 className="text-[15px] font-semibold tracking-tight text-stone-950 mb-2">{f.title}</h3>
                    <p className="text-[13px] leading-relaxed text-stone-500">{f.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Product deep-dive */}
        <section id="product" className="max-w-6xl mx-auto px-6 py-20 scroll-mt-24" aria-labelledby="product-heading">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
            <div className="lg:sticky lg:top-24">
              <Reveal>
                <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 mb-3">Inside a meeting</p>
                <h2 id="product-heading" className="text-3xl md:text-4xl font-light tracking-tight text-stone-950 leading-tight">
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
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 mt-0.5 shrink-0" aria-hidden><polyline points="20 6 9 17 4 12" /></svg>
                      <span className="leading-relaxed">{li}</span>
                    </li>
                  ))}
                </ul>
                <AuthCta variant="compact" />
              </Reveal>
            </div>

            <div className="space-y-4">
              <Reveal>
                <div className="bg-white border border-stone-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4 border-b border-stone-100 pb-3">
                    <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-500">Next steps</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {[
                      "Share the timeline update with stakeholders",
                      "Confirm launch owners for Friday review",
                      "Prep the demo for the weekly sync",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-2.5 text-sm text-stone-800 leading-relaxed">
                        <span className="text-stone-300 font-bold select-none" aria-hidden>•</span>
                        <p className="flex-1">{t}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
              <Reveal delay={80}>
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
                          <span className={`inline-block w-2 h-2 rounded-full mt-1.5 shrink-0 ${dot}`} aria-hidden />
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
              </Reveal>
              <Reveal delay={120}>
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
              </Reveal>
            </div>
          </div>
        </section>

        {/* Extension */}
        <section id="extension" className="max-w-6xl mx-auto px-6 pb-20 scroll-mt-24" aria-labelledby="extension-heading">
          <Reveal>
            <div className="bg-stone-950 rounded-xl overflow-hidden grid lg:grid-cols-2">
              <div className="p-8 md:p-12">
                <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-500 mb-4">Chrome extension</p>
                <h2 id="extension-heading" className="text-3xl md:text-[34px] font-light tracking-tight text-stone-100 leading-tight">
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
                  <a href="https://github.com/yashbhidawe" target="_blank" rel="noreferrer" className="btn-interactive px-5 py-2.5 bg-white text-stone-950 text-[13px] font-semibold rounded-md hover:bg-stone-200 transition-colors text-center">
                    Get the extension
                  </a>
                  <a href="#faq" className="btn-interactive px-5 py-2.5 border border-stone-700 text-stone-200 text-[13px] font-medium rounded-md hover:border-stone-400 transition-colors text-center">
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
                        <Check className="text-emerald-400 mt-0.5 shrink-0" />
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
                        <span className="w-[13px] text-center leading-none mt-0.5 shrink-0" aria-hidden>—</span>
                        <span className="leading-relaxed">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-stone-200 bg-white scroll-mt-16" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto px-6 py-20">
            <Reveal>
              <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 mb-3 text-center">FAQ</p>
              <h2 id="faq-heading" className="text-3xl md:text-4xl font-light tracking-tight text-stone-950 text-center">
                Asked on <span className="font-semibold">every call</span>
              </h2>
            </Reveal>
            <div className="mt-10">
              <FaqAccordion />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-6xl mx-auto px-6 py-20" aria-labelledby="cta-heading">
          <Reveal>
            <div className="relative overflow-hidden bg-stone-950 rounded-xl px-8 py-14 md:p-16 text-center">
              <div className="landing-grid absolute inset-0 opacity-40 invert" aria-hidden />
              <div className="relative">
                <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stone-500 mb-4">Free to start · No credit card</p>
                <h2 id="cta-heading" className="text-3xl md:text-5xl font-light tracking-tight text-white leading-tight">
                  Stop taking notes.
                  <br />
                  <span className="font-semibold">Start shipping.</span>
                </h2>
                <p className="mt-5 text-[15px] text-stone-400 max-w-xl mx-auto leading-relaxed">
                  Create an account, add the extension, and walk out of your next
                  Google Meet with decisions, owners and next steps already written.
                </p>
                <AuthCta variant="final" />
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-[1.2fr_1fr_1fr_1fr] gap-10">
          <div>
            <Logo />
            <p className="mt-4 text-[13px] leading-relaxed text-stone-500 max-w-xs">
              Automatic meeting notes for Google Meet. Decisions, action items and summaries — minutes after you hang up.
            </p>
          </div>
          <nav aria-label="Product">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 mb-4">Product</p>
            <ul className="space-y-2.5 text-[13px] font-medium text-stone-600">
              <li><a href="#how" className="hover:text-stone-950 transition-colors">How it works</a></li>
              <li><a href="#features" className="hover:text-stone-950 transition-colors">Features</a></li>
              <li><a href="#extension" className="hover:text-stone-950 transition-colors">Chrome extension</a></li>
              <li><Link href="/dashboard" className="hover:text-stone-950 transition-colors">Dashboard</Link></li>
            </ul>
          </nav>
          <nav aria-label="Account">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 mb-4">Account</p>
            <ul className="space-y-2.5 text-[13px] font-medium text-stone-600">
              <li><Link href="/login" className="hover:text-stone-950 transition-colors">Sign in</Link></li>
              <li><Link href="/register" className="hover:text-stone-950 transition-colors">Create account</Link></li>
              <li><a href="#faq" className="hover:text-stone-950 transition-colors">FAQ</a></li>
            </ul>
          </nav>
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
