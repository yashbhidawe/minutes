import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LANGUAGE_URLS } from "@/lib/site";
import { SiteFooter } from "@/components/landing/sections";

export const metadata: Metadata = {
  title: "Meeting Notes for Google Meet, Zoom and Teams — Minutes",
  description:
    "Minutes records Hindi, English and Hinglish sales calls on Google Meet, Zoom and Microsoft Teams from your Chrome browser. No bot joins the call. Zoom and Teams must be joined in the browser; desktop apps are not supported yet.",
  alternates: {
    canonical: "/meeting-notes-google-meet-zoom-teams",
    languages: LANGUAGE_URLS,
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/meeting-notes-google-meet-zoom-teams`,
    title: "Meeting Notes for Google Meet, Zoom and Teams — Minutes",
    description:
      "Minutes records Hindi, English and Hinglish sales calls on Google Meet, Zoom and Microsoft Teams from your Chrome browser. No bot joins the call. Zoom and Teams must be joined in the browser; desktop apps are not supported yet.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meeting Notes for Google Meet, Zoom and Teams — Minutes",
    description:
      "Minutes records Hindi, English and Hinglish sales calls on Google Meet, Zoom and Microsoft Teams from your Chrome browser. No bot joins the call. Zoom and Teams must be joined in the browser; desktop apps are not supported yet.",
  },
  robots: { index: true, follow: true },
};

export default function PlatformsPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-stone-900 dark:text-stone-50 antialiased flex flex-col">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 dark:border-stone-800/80 bg-[#fafafa]/85 dark:bg-stone-950/85 backdrop-blur-md">
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
            Meeting notes for Google Meet, Zoom and Teams.
          </h1>
          <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed mb-10 max-w-xl">
            One Chrome extension records Hindi, English and Hinglish sales
            calls on whichever platform your customer prefers. No bot joins
            the call.
          </p>

          <table className="w-full border-collapse border border-stone-200 dark:border-stone-800 mt-8 text-sm leading-relaxed">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400">
                <th className="border border-stone-200 dark:border-stone-800 p-3 text-left">Platform</th>
                <th className="border border-stone-200 dark:border-stone-800 p-3 text-left">Status</th>
                <th className="border border-stone-200 dark:border-stone-800 p-3 text-left">How to use it</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
                <td className="border border-stone-200 dark:border-stone-800 p-3 font-medium text-stone-900 dark:text-stone-100">Google Meet</td>
                <td className="border border-stone-200 dark:border-stone-800 p-3 text-stone-600 dark:text-stone-400">Supported</td>
                <td className="border border-stone-200 dark:border-stone-800 p-3 text-stone-600 dark:text-stone-400">Join as usual in Chrome</td>
              </tr>
              <tr className="bg-stone-50 dark:bg-[#141414] border-b border-stone-200 dark:border-stone-800">
                <td className="border border-stone-200 dark:border-stone-800 p-3 font-medium text-stone-900 dark:text-stone-100">Zoom (web client)</td>
                <td className="border border-stone-200 dark:border-stone-800 p-3 text-stone-600 dark:text-stone-400">Supported</td>
                <td className="border border-stone-200 dark:border-stone-800 p-3 text-stone-600 dark:text-stone-400">Choose “Join from your browser”</td>
              </tr>
              <tr className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
                <td className="border border-stone-200 dark:border-stone-800 p-3 font-medium text-stone-900 dark:text-stone-100">Microsoft Teams (web)</td>
                <td className="border border-stone-200 dark:border-stone-800 p-3 text-stone-600 dark:text-stone-400">Supported</td>
                <td className="border border-stone-200 dark:border-stone-800 p-3 text-stone-600 dark:text-stone-400">Choose “Continue on this browser”</td>
              </tr>
              <tr className="bg-stone-50 dark:bg-[#141414] border-b border-stone-200 dark:border-stone-800">
                <td className="border border-stone-200 dark:border-stone-800 p-3 font-medium text-stone-900 dark:text-stone-100">Zoom / Teams desktop apps</td>
                <td className="border border-stone-200 dark:border-stone-800 p-3 text-stone-600 dark:text-stone-400">Not yet</td>
                <td className="border border-stone-200 dark:border-stone-800 p-3 text-stone-600 dark:text-stone-400">Tab capture cannot hear native apps</td>
              </tr>
            </tbody>
          </table>

          <p className="mt-8 text-sm text-stone-500 dark:text-stone-400 max-w-xl">
            Minutes records the audio of the browser tab you are in, plus your
            microphone. That is why calls must be joined in the browser: the
            native Zoom and Teams apps play audio outside Chrome, where an
            extension cannot capture it.
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
