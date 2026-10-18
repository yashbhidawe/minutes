"use client";

export function HeroDemo() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-gradient-to-b from-stone-200/40 via-transparent to-transparent blur-3xl rounded-full" aria-hidden />
      <div className="demo-card relative bg-white border border-stone-200 rounded-2xl shadow-[0_30px_60px_-20px_rgb(0_0_0/0.15)] overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80')] bg-cover bg-center opacity-10 pointer-events-none" aria-hidden />
        <div className="relative z-10">
          {/* window bar */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-stone-100 bg-stone-50/80 backdrop-blur">
            <div className="flex items-center gap-1.5 shrink-0" aria-hidden>
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-stone-800" />
            </div>
            <span className="text-[10px] font-mono text-stone-400 truncate">Your meeting summary</span>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold tracking-tight text-stone-950">
                  Weekly Team Sync
                </p>
                <p className="text-[11px] text-stone-400 font-medium mt-0.5">
                  Tuesday · 32 min · 4 people
                </p>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-4">
              <p className="text-[10px] font-bold tracking-wider uppercase text-stone-400 mb-2.5">Key decisions</p>
              <ul className="space-y-2 text-[13px] leading-relaxed text-stone-800">
                <li className="flex gap-2">
                  <span className="text-stone-300 font-bold shrink-0" aria-hidden>•</span>
                  Approved the new onboarding flow for next sprint.
                </li>
                <li className="flex gap-2">
                  <span className="text-stone-300 font-bold shrink-0" aria-hidden>•</span>
                  Paused the homepage rewrite until research lands.
                </li>
              </ul>
            </div>

            <div className="bg-stone-950 text-stone-200 rounded-xl p-4 font-mono text-xs">
              <p className="text-[10px] uppercase tracking-[0.16em] text-stone-500 font-sans font-semibold mb-2">Transcript highlight</p>
              <div className="flex items-start gap-3">
                <span className="text-stone-600 font-bold shrink-0 mt-0.5">[04:12]</span>
                <p className="text-stone-300 leading-relaxed">“…so the summary lands before standup, nobody needs to rewatch the call.”</p>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 border-t border-stone-100 bg-stone-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">A</div>
              <div className="flex-1">
                <p className="text-[12px] text-stone-700 leading-relaxed">
                  What did we decide about the launch?
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-end gap-2">
              <div className="max-w-[80%] bg-white border border-stone-200 text-xs text-stone-800 leading-relaxed rounded-lg rounded-bl-sm px-3 py-2">
                <p>Launch stays on Friday. The homepage rewrite is paused until research lands.</p>
                <div className="flex gap-1.5 mt-1.5 pt-1 border-t border-stone-100/50">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-600">▶ 04:12</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-600">▶ 18:40</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
