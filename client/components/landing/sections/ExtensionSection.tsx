import { Check } from "../Check";
import { Reveal } from "../Reveal";

export function ExtensionSection() {
  return (
    <section id="extension" className="max-w-6xl mx-auto px-6 pb-20 scroll-mt-24" aria-labelledby="extension-heading">
      <Reveal>
        <div className="bg-stone-950 rounded-xl overflow-hidden grid lg:grid-cols-2">
          <div className="p-6 sm:p-8 md:p-12">
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
              <a href="/install" className="btn-interactive px-5 py-2.5 bg-white text-stone-950 text-[13px] font-semibold rounded-md hover:bg-stone-200 transition-colors text-center">
                Get the extension
              </a>
              <a href="#faq" className="btn-interactive px-5 py-2.5 border border-stone-700 text-stone-200 text-[13px] font-medium rounded-md hover:border-stone-400 transition-colors text-center">
                Privacy & FAQ
              </a>
            </div>
          </div>
          <div className="bg-stone-900 border-t lg:border-t-0 lg:border-l border-stone-800 p-6 sm:p-8 md:p-12 flex flex-col justify-center gap-4">
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
  );
}
