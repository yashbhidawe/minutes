import { Reveal } from "../Reveal";
import { Check } from "../Check";

export function AskSection() {
  return (
    <section id="ask" className="bg-white dark:bg-stone-950 border-y border-stone-200 dark:border-stone-900 px-6 pb-24 scroll-mt-24" aria-labelledby="ask-heading">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <h2 id="ask-heading" className="text-3xl md:text-4xl font-light tracking-tight text-stone-950 dark:text-stone-50 mb-6">
            Ask your meetings anything.
          </h2>
          <p className="text-stone-600 dark:text-stone-300 leading-relaxed mb-10 max-w-xl">
            Open any processed meeting and type a question. Answers are
            grounded in that meeting's transcript and cite the exact moments —
            click a citation and the audio jumps there.
          </p>
        </Reveal>

        <div className="relative overflow-hidden bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-b from-stone-50 dark:from-stone-700/30 via-transparent to-transparent blur-2xl" aria-hidden />
          <div className="relative p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold tracking-wider uppercase text-stone-400 dark:text-stone-400">Weekly Team Sync</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900">answered</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-end">
                <p className="max-w-[80%] bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs leading-relaxed rounded-lg rounded-br-sm px-3 py-2">
                  What did we decide about the launch?
                </p>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[90%] bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 leading-relaxed rounded-lg rounded-bl-sm px-3 py-2">
                  <p>Launch stays on Friday. The homepage rewrite is paused until research lands.</p>
                  <div className="flex gap-1.5 mt-2 pt-2 border-t border-stone-200/60 dark:border-stone-700/60">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300">▶ 04:12</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300">▶ 18:40</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 flex items-center gap-3">
              <input type="text" placeholder="Ask about this meeting…" className="flex-1 text-sm px-3 py-2 border border-stone-200 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <button className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-medium rounded-lg hover:bg-stone-800 dark:hover:bg-stone-300 transition-colors">Ask</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
