"use client";

export function HeroDemo() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-gradient-to-b from-stone-200/40 via-transparent to-transparent blur-3xl rounded-full dark:from-stone-900/20" aria-hidden />
      <div className="demo-card relative bg-white dark:bg-[#1a1817] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-[0_30px_60px_-20px_rgb(0_0_0/0.15)] overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80')] bg-cover bg-center opacity-10 pointer-events-none dark:opacity-5" aria-hidden />
        <div className="relative z-10">
          {/* window bar */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur">
            <div className="flex items-center gap-1.5 shrink-0" aria-hidden>
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-stone-800 dark:bg-stone-900" />
            </div>
            <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 truncate">Your meeting summary</span>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold tracking-tight text-stone-950 dark:text-white">
                  Weekly Team Sync
                </p>
                <p className="text-[11px] text-stone-400 dark:text-stone-500 font-medium mt-0.5">
                  Tuesday · 32 min · 4 people
                </p>
              </div>
            </div>

            <div className="bg-stone-50 dark:bg-[#272727] border border-stone-200 dark:border-stone-800 rounded-xl p-4 mb-4">
              <p className="text-[10px] font-bold tracking-wider uppercase text-stone-400 dark:text-stone-500 mb-2.5">Key decisions</p>
              <ul className="space-y-2 text-[13px] leading-relaxed text-stone-800 dark:text-stone-200">
                <li className="flex gap-2">
                  <span className="text-stone-300 font-bold dark:text-stone-400 shrink-0" aria-hidden>•</span>
                  Approved the new onboarding flow for next sprint.
                </li>
                <li className="flex gap-2">
                  <span className="text-stone-300 font-bold dark:text-stone-400 shrink-0" aria-hidden>•</span>
                  Paused the homepage rewrite until research lands.
                </li>
              </ul>
            </div>

            <div className="bg-stone-950 dark:bg-[#121212] text-stone-200 dark:text-stone-300 rounded-xl p-4 font-mono text-xs">
              <p className="text-[10px] uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400 font-sans font-semibold mb-2">Transcript highlight</p>
              <div className="flex items-start gap-3">
                <span className="text-stone-600 dark:text-stone-400 font-bold shrink-0 mt-0.5">[04:12]</span>
                <p className="text-stone-300 dark:text-stone-200 leading-relaxed">“…so the summary lands before standup, nobody needs to rewatch the call.”</p>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-[#1f1f1e]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">A</div>
              <div className="flex-1">
                <p className="text-[12px] text-stone-700 dark:text-stone-300 leading-relaxed">
                  What did we decide about the launch?
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-end gap-2">
              <div className="max-w-[80%] bg-white dark:bg-[#1a1817] border border-stone-200 dark:border-stone-800 text-xs text-stone-800 dark:text-stone-200 leading-relaxed rounded-lg rounded-bl-sm px-3 py-2">
                <p>Launch stays on Friday. The homepage rewrite is paused until research lands.</p>
                <div className="flex gap-1.5 mt-1.5 pt-1 border-t border-stone-100 dark:border-stone-800/50">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400">▶ 04:12</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400">▶ 18:40</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
