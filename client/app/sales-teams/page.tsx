import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LANGUAGE_URLS } from "@/lib/site";
import { SiteFooter } from "@/components/landing/sections";

export const metadata: Metadata = {
  title: "Meeting Notes for Sales Teams India — Minutes",
  description:
    "Minutes is meeting notes for Indian sales teams. It captures Hindi, English, and Hinglish sales calls in the same sentence, then gives you timestamps, summaries, and action items. Open source.",
  alternates: {
    canonical: "/sales-teams",
    languages: LANGUAGE_URLS,
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/sales-teams`,
    title: "Meeting Notes for Sales Teams India — Minutes",
    description:
      "Minutes is meeting notes for Indian sales teams. It captures Hindi, English, and Hinglish sales calls in the same sentence, then gives you timestamps, summaries, and action items. Open source.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meeting Notes for Sales Teams India — Minutes",
    description:
      "Minutes is meeting notes for Indian sales teams. It captures Hindi, English, and Hinglish sales calls in the same sentence, then gives you timestamps, summaries, and action items. Open source.",
  },
  robots: { index: true, follow: true },
};

export default function SalesTeamsPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0f0f0e] text-stone-900 dark:text-stone-50 antialiased flex flex-col">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 dark:border-stone-800/80 bg-[#fafaf9]/85 dark:bg-stone-950/85 backdrop-blur-md">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4" aria-label="Primary">
          <Link href="/" className="text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-50">
            Minutes
          </Link>
          <div className="flex items-center gap-2.5">
            <Link href="/install" className="px-4 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-[13px] font-medium rounded-md hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors">
              Get the extension
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 pt-14 pb-24">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 dark:text-stone-500 mb-3">
            Sales teams
          </p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight leading-tight text-stone-950 dark:text-stone-50 mb-6">
            Meeting notes built for Indian sales calls.
          </h1>
          <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed mb-10 max-w-xl">
            Your client calls run in Hindi, English, and Hinglish — often
            in the same sentence. Minutes captures the call, then gives you
            timestamps, summaries, and action items you can use for
            follow-ups. No bot joins your call. Open source.
          </p>

          <div className="space-y-8 mt-12">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-3">Mixed-language calls</h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                Hindi, English, and Hinglish are captured together. You
                don&apos;t need to pick one language before the call starts.
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-3">Timestamps and summaries</h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                Every moment is timestamped. Summaries surface decisions,
                blockers, and next steps so nothing evaporates after the
                call ends.
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-3">Action items for follow-up</h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                Copy action items straight into your follow-up message.
                Every answer cites the transcript, so you can click back to
                the exact moment.
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-3">No bot, no admin setup</h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                The extension records from your browser. Nothing joins your
                Google Meet as a participant. Install and start recording.
              </p>
            </div>
          </div>

          <div className="mt-16 flex flex-col sm:flex-row gap-3">
            <Link href="/install" className="px-6 py-3 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-sm font-medium rounded-md hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors text-center">
              Get the extension
            </Link>
            <Link href="/" className="px-6 py-3 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-sm font-medium rounded-md hover:border-stone-900 dark:hover:border-stone-400 transition-colors text-center">
              Back to homepage
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
