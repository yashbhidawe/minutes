import type { Metadata } from "next";
import Link from "next/link";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Logo } from "@/components/landing/Logo";
import { SiteFooter } from "@/components/landing/sections";
import { SITE_URL } from "@/lib/site";

const title = "Install the Chrome Extension";
const description =
  "Download the Minute AI Chrome extension and install it in about 2 minutes. Free manual install while we prepare the Chrome Web Store listing.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/install" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/install`,
    title: `${title} · Minute AI`,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} · Minute AI`,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

async function getExtensionVersion(): Promise<string> {
  try {
    const file = await fs.readFile(
      path.join(process.cwd(), "public", "extension-version.json"),
      "utf-8"
    );
    const data = JSON.parse(file) as { version?: string };
    return data.version || "1.0.0";
  } catch {
    return "1.0.0";
  }
}

const STEPS = [
  {
    n: "1",
    title: "Download and unzip",
    body: "Click the download button below to get minute-ai-extension.zip, then unzip it. You'll get a folder called minute-ai-extension — keep it somewhere safe (don't delete it after installing, Chrome reads from it).",
  },
  {
    n: "2",
    title: "Open the extensions page",
    body: "In Chrome (or Edge / Brave), go to chrome://extensions. You can paste that into your address bar.",
  },
  {
    n: "3",
    title: "Enable Developer mode",
    body: "Flip on the Developer mode toggle in the top-right corner of the extensions page. This is required because we're not on the Chrome Web Store yet — it costs nothing and changes nothing about browsing.",
  },
  {
    n: "4",
    title: "Load the extension",
    body: "Click Load unpacked and select the unzipped minute-ai-extension folder. Minute AI should appear in your extensions list.",
  },
  {
    n: "5",
    title: "Pin it to your toolbar",
    body: "Click the puzzle-piece icon in Chrome's toolbar, then pin Minute AI so you can see when it's recording.",
  },
  {
    n: "6",
    title: "Sign in",
    body: "Click the Minute AI icon and sign in with your Minute AI account (or sign in on the web dashboard first — the session syncs automatically). Then join a Google Meet and you're set.",
  },
];

const TROUBLESHOOTING = [
  {
    q: "Chrome says the download is unsafe",
    a: "Chrome warns about all extension zips downloaded outside the Web Store. The file only contains our extension source (HTML/JS/icons) — proceed with Keep, then unzip and continue.",
  },
  {
    q: "“Load unpacked” is missing or greyed out",
    a: "Developer mode must be on first (top-right toggle on chrome://extensions). On a work laptop managed by IT, your admin may have disabled sideloading — you'll need their permission or a personal profile.",
  },
  {
    q: "The extension shows “Not logged in”",
    a: "Sign in on the web dashboard, then open the extension popup again — it picks up your session automatically. You can also sign in with email + password directly inside the popup.",
  },
  {
    q: "Recording starts but notes never appear",
    a: "Make sure you stayed on the Meet tab until recording started, allowed microphone access, and that the backend is reachable. Open the dashboard — if the meeting row shows an error, that message tells you what failed.",
  },
  {
    q: "How do I update to a new version?",
    a: "There's no auto-update outside the Web Store yet. Download the new zip, unzip it over the old folder (or delete the old folder and unzip fresh), then go to chrome://extensions and hit Reload on Minute AI. Your login is preserved.",
  },
];

export default async function InstallPage() {
  const version = await getExtensionVersion();

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 antialiased flex flex-col">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#fafaf9]/85 backdrop-blur-md">
        <nav
          className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4"
          aria-label="Primary"
        >
          <Logo />
          <div className="flex items-center gap-2.5">
            <Link
              href="/register"
              className="px-4 py-2 bg-stone-900 text-white text-[13px] font-medium rounded-md hover:bg-stone-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 pt-14 pb-8">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 mb-3">
            Chrome extension · v{version}
          </p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight leading-tight">
            Install Minute AI <span className="font-semibold">in 2 minutes.</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-stone-500 max-w-2xl">
            We&apos;re not on the Chrome Web Store yet, so installation is a
            free manual setup: download the file, flip on Developer mode, and
            load the extension. No fees, no terminal commands.
          </p>

          <div className="mt-8 bg-stone-950 rounded-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <a
                href="/minute-ai-extension.zip"
                download
                className="px-6 py-3 bg-white text-stone-950 text-sm font-semibold rounded-md hover:bg-stone-200 transition-colors text-center"
              >
                Download extension v{version} (.zip)
              </a>
              <div className="text-[13px] leading-relaxed text-stone-400">
                <p>Works on Chrome, Edge and Brave (desktop).</p>
                <p className="mt-1">
                  Prefer GitHub? Grab it from{" "}
                  <a
                    href="https://github.com/yashbhidawe/minuteai"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-stone-200"
                  >
                    the repo releases
                  </a>
                  .
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-stone-500">
              Note: outside the Web Store there are no automatic updates — when
              we ship a new version, re-download the zip and hit Reload on{" "}
              <span className="font-mono">chrome://extensions</span>.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 pb-8">
          <ol className="space-y-4">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="flex gap-4 bg-white border border-stone-200 rounded-xl p-5 sm:p-6"
              >
                <span className="w-8 h-8 rounded-md bg-stone-900 text-white text-[13px] font-bold flex items-center justify-center shrink-0">
                  {s.n}
                </span>
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight">
                    {s.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-500">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10">
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 mb-3">
              Troubleshooting
            </p>
            <div className="divide-y divide-stone-200 border-y border-stone-200">
              {TROUBLESHOOTING.map((t) => (
                <details key={t.q} className="group py-5">
                  <summary className="cursor-pointer text-[15px] font-medium tracking-tight text-stone-700 group-open:text-stone-950 hover:text-stone-950 list-none flex items-center justify-between gap-4">
                    {t.q}
                    <span
                      aria-hidden
                      className="w-7 h-7 rounded-full border border-stone-300 text-stone-500 flex items-center justify-center shrink-0 text-lg leading-none group-open:rotate-45 group-open:bg-stone-950 group-open:text-white group-open:border-stone-950 transition-all"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500 max-w-2xl">
                    {t.a}
                  </p>
                </details>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              className="px-6 py-3 bg-stone-900 text-white text-sm font-medium rounded-md hover:bg-stone-700 transition-colors text-center"
            >
              Create your free account
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-white border border-stone-300 text-stone-800 text-sm font-medium rounded-md hover:border-stone-900 transition-colors text-center"
            >
              Open dashboard
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
