import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LANGUAGE_URLS } from "@/lib/site";
import { SiteFooter } from "@/components/landing/sections";

export const metadata: Metadata = {
  title: "Hindi, English, and Hinglish Meeting Transcription — Minutes",
  description:
    "Meeting transcription that works in Hindi, English, and Hinglish. Captures mixed-language sales calls in the same sentence, with timestamps and summaries. Open source.",
  alternates: {
    canonical: "/hindi-hinglish-transcription",
    languages: LANGUAGE_URLS,
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/hindi-hinglish-transcription`,
    title: "Hindi, English, and Hinglish Meeting Transcription — Minutes",
    description:
      "Meeting transcription that works in Hindi, English, and Hinglish. Captures mixed-language sales calls in the same sentence, with timestamps and summaries. Open source.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hindi, English, and Hinglish Meeting Transcription — Minutes",
    description:
      "Meeting transcription that works in Hindi, English, and Hinglish. Captures mixed-language sales calls in the same sentence, with timestamps and summaries. Open source.",
  },
  robots: { index: true, follow: true },
};

export default function HindiHinglishTranscriptionPage() {
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
            Transcription
          </p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight leading-tight text-stone-950 dark:text-stone-50 mb-6">
            Hindi, English, and Hinglish — in the same sentence.
          </h1>
          <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed mb-10 max-w-xl">
            Most meeting tools are English-first. Minutes is built for the
            way Indian sales teams actually talk — Hindi, English, and
            Hinglish mixed together. Get a timestamped transcript and
            summary after every call. Open source.
          </p>

          <div className="space-y-8 mt-12">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-3">One language switch at a time</h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                You don&apos;t need to select a language before the call.
                Hindi, English, and Hinglish are captured together as you
                speak.
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-3">Timestamps you can click</h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                Every word in the transcript is timestamped. Click a moment
                and the audio jumps there so you can verify what was said.
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-3">Summaries after the call</h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                Decisions, blockers, and next steps are extracted from the
                transcript. Every answer cites the source moment.
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50 mb-3">No bot joins your call</h2>
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                The extension records tab and microphone audio from your
                browser. Nothing appears as a participant in your Google
                Meet.
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
