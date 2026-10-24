import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LANGUAGE_URLS } from "@/lib/site";
import { SiteFooter } from "@/components/landing/sections";

export const metadata: Metadata = {
  title: "Minutes vs Google Meet Native Notes — Minutes",
  description:
    "Comparing Minutes and Google Meet native notes. Google Meet does not include built-in transcription and meeting notes on free plans; Minutes captures Hindi, English, and Hinglish sales calls. Open source. Factual comparison only.",
  alternates: {
    canonical: "/comparisons/google-meet-native-notes",
    languages: LANGUAGE_URLS,
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/comparisons/google-meet-native-notes`,
    title: "Minutes vs Google Meet Native Notes — Minutes",
    description:
      "Comparing Minutes and Google Meet native notes. Google Meet does not include built-in transcription and meeting notes on free plans; Minutes captures Hindi, English, and Hinglish sales calls. Open source. Factual comparison only.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Minutes vs Google Meet Native Notes — Minutes",
    description:
      "Comparing Minutes and Google Meet native notes. Google Meet does not include built-in transcription and meeting notes on free plans; Minutes captures Hindi, English, and Hinglish sales calls. Open source. Factual comparison only.",
  },
  robots: { index: true, follow: true },
};

export default function GoogleMeetComparisonPage() {
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
            Comparison
          </p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight leading-tight text-stone-950 dark:text-stone-50 mb-6">
            Minutes vs Google Meet native notes.
          </h1>
          <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed mb-10 max-w-xl">
            Factual comparison only. No accuracy percentages, no user
            counts, and no claims we can&apos;t verify.
          </p>

          <table className="w-full border-collapse border border-stone-200 dark:border-stone-800 mt-8 text-sm leading-relaxed">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400">
                <th className="border border-stone-200 dark:border-stone-800 p-3 text-left">Feature</th>
                <th className="border border-stone-200 dark:border-stone-800 p-3 text-left">Minutes</th>
                <th className="border border-stone-200 dark:border-stone-800 p-3 text-left">Google Meet native notes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
                <td className="border border-stone-200 dark:border-stone-800 p-3 font-medium text-stone-900 dark:text-stone-100">Built-in transcription and notes</td>
                <td className="border border-stone-200 dark:border-stone-800 p-3 text-stone-600 dark:text-stone-400">Yes, via Chrome extension</td>
                <td className="border border-stone-200 dark:border-stone-800 p-3 text-stone-600 dark:text-stone-400">Not included on free plans</td>
              </tr>
              <tr className="bg-stone-50 dark:bg-[#1a1817] border-b border-stone-200 dark:border-stone-800">
                <td className="border border-stone-200 dark:border-stone-800 p-3 font-medium text-stone-900 dark:text-stone-100">Hindi, English, Hinglish in one call</td>
                <td className="border border-stone-200 dark:border-stone-800 p-3 text-stone-600 dark:text-stone-400">Yes</td>
                <td className="border border-stone-200 dark:border-stone-800 p-3 text-stone-600 dark:text-stone-400">Not applicable — no built-in transcription</td>
              </tr>
              <tr className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
                <td className="border border-stone-200 dark:border-stone-800 p-3 font-medium text-stone-900 dark:text-stone-100">Bot joins your meeting</td>
                <td className="border border-stone-200 dark:border-stone-800 p-3 text-stone-600 dark:text-stone-400">No</td>
                <td className="border border-stone-200 dark:border-stone-800 p-3 text-stone-600 dark:text-stone-400">Not applicable</td>
              </tr>
              <tr className="bg-stone-50 dark:bg-[#1a1817] border-b border-stone-200 dark:border-stone-800">
                <td className="border border-stone-200 dark:border-stone-800 p-3 font-medium text-stone-900 dark:text-stone-100">Open source</td>
                <td className="border border-stone-200 dark:border-stone-800 p-3 text-stone-600 dark:text-stone-400">Yes</td>
                <td className="border border-stone-200 dark:border-stone-800 p-3 text-stone-600 dark:text-stone-400">No</td>
              </tr>
              <tr className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
                <td className="border border-stone-200 dark:border-stone-800 p-3 font-medium text-stone-900 dark:text-stone-100">Cited transcript answers</td>
                <td className="border border-stone-200 dark:border-stone-800 p-3 text-stone-600 dark:text-stone-400">Yes</td>
                <td className="border border-stone-200 dark:border-stone-800 p-3 text-stone-600 dark:text-stone-400">Not applicable</td>
              </tr>
            </tbody>
          </table>

          <p className="mt-8 text-sm text-stone-500 dark:text-stone-400 max-w-xl">
            Source: Google Meet Help documentation states transcription is
            not available on free editions. Check meet.google.com and
            Google Workspace Help directly for current details — features
            and eligibility change over time.
          </p>

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
