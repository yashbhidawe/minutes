import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/landing/Logo";
import { SiteFooter } from "@/components/landing/sections";
import { SITE_URL } from "@/lib/site";

const title = "Privacy Policy";
const description = "How Minutes handles meeting audio, transcripts, account data, and AI processing.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/privacy" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/privacy`,
    title: `${title} · Minutes`,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0f0f0e] text-stone-900 dark:text-stone-50 antialiased flex flex-col">
      <header className="border-b border-stone-200/80 dark:border-stone-800/80 bg-[#fafaf9]/85 dark:bg-stone-950/85 backdrop-blur-md">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between" aria-label="Primary">
          <Logo />
          <Link href="/" className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-50">
            Back home
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-6 py-14 sm:py-20">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 dark:text-stone-500">Legal</p>
          <h1 className="mt-3 text-4xl font-light tracking-tight text-stone-950 dark:text-stone-50">Privacy Policy</h1>
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">Effective September 25, 2026</p>

          <div className="mt-10 space-y-10 text-sm leading-7 text-stone-600 dark:text-stone-300">
            <section>
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50">Overview</h2>
              <p className="mt-3">
                Minutes records Google Meet audio from a browser extension, creates a timestamped transcript, and generates a summary with decisions and action items. This policy explains what is collected, why it is used, and how to delete meeting data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50">Recording responsibility</h2>
              <p className="mt-3">
                You are responsible for having permission to record a conversation and for informing meeting participants when recording or processing is required. Minutes does not join calls as a bot, but the extension records tab and microphone audio while recording is active. Do not use Minutes to record conversations without the rights or consent required by applicable law and your organization&apos;s policies.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50">Data we collect</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Account information such as your email address and a securely hashed password.</li>
                <li>Meeting metadata such as titles, duration, processing status, and creation dates.</li>
                <li>Meeting audio, transcripts, summaries, notes, and action items that you create or upload.</li>
                <li>Technical information needed to operate the service, including authentication tokens, extension status, and service logs.</li>
                <li>Usage and performance information collected through Vercel Analytics.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50">How data is used</h2>
              <p className="mt-3">
                We use data to provide authentication, record and upload meetings, generate transcripts and summaries, display your dashboard, troubleshoot failures, prevent abuse, and improve Minutes. Audio is sent to Groq for transcription. Transcript text is sent to Google Gemini for summarization. Meeting audio is stored in Cloudflare R2 and application records are stored in a managed PostgreSQL database.
              </p>
              <p className="mt-3">
                These service providers process data only to provide their respective services and under their own terms and policies. They may change as our infrastructure changes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50">Storage and deletion</h2>
              <p className="mt-3">
                Meeting data remains in your account until you delete the meeting. Deleting a meeting removes its transcript, notes, action items, and stored audio object from the active application. We may retain limited information in backups, security logs, or records required by law. To request account deletion, contact the project owner through the contact details below.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50">Sharing and sale</h2>
              <p className="mt-3">
                Minutes does not sell personal information. We share data only with infrastructure and AI providers needed to operate the service, or when required to protect the service, comply with law, or respond to a valid legal request.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50">Security</h2>
              <p className="mt-3">
                We use HTTPS, authenticated access controls, hashed passwords, and restricted service credentials. No online service can guarantee absolute security. Contact us promptly if you believe your account or meeting data has been exposed.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-stone-950 dark:text-stone-50">Changes and contact</h2>
              <p className="mt-3">
                We may update this policy as the product or infrastructure changes. The effective date above identifies the current version. For privacy questions or deletion requests, contact the project owner through{" "}
                <a href="https://itsokyash.online" target="_blank" rel="noreferrer" className="text-stone-900 dark:text-stone-100 underline underline-offset-4">
                  itsokyash.online
                </a>
                .
              </p>
            </section>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
