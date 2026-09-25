import { AuthCta } from "../AuthCta";
import { Check } from "../Check";
import { Reveal } from "../Reveal";

export function ProductDeepDive() {
  return (
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
                "Copy or export your summary in one click",
                "Track every action item through to done",
                "Listen back to any moment, whenever you need it",
              ].map((li) => (
                <li key={li} className="flex items-start gap-2.5">
                  <Check size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{li}</span>
                </li>
              ))}
            </ul>
            <AuthCta variant="compact" />
          </Reveal>
        </div>

        <div className="space-y-4">
          <Reveal>
            <div className="bg-white border border-stone-200 rounded-lg p-5 sm:p-6">
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
            <div className="bg-white border border-stone-200 rounded-lg p-5 sm:p-6">
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
                    <div className="flex items-center justify-between flex-wrap gap-2 gap-y-1 mt-3 pt-2 border-t border-stone-200/60 text-[11px]">
                      <span className="font-medium text-stone-500">{owner}</span>
                      <span className="text-[10px] uppercase tracking-wider bg-stone-100 border border-stone-300 px-2 py-1 rounded text-stone-700 font-mono">{status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="bg-stone-950 text-stone-200 p-5 sm:p-6 rounded-lg font-mono text-xs space-y-2.5">
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
  );
}
