import { Reveal } from "../Reveal";

export function ExtensionSection() {
  return (
    <section id="extension" className="max-w-6xl mx-auto px-6 pb-24 scroll-mt-24" aria-labelledby="extension-heading">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <Reveal>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-3 rounded bg-red-500" aria-hidden />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                Chrome extension
              </span>
            </div>
            <h2 id="extension-heading" className="text-3xl md:text-5xl font-light tracking-tight text-stone-950 dark:text-stone-50 mb-4">
              Installs in a minute.
            </h2>
            <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed mb-8">
              Add Minutes once, sign in, and it captures your Google Meet
              tab audio while you record. A floating widget shows you&apos;re live —
              then the notes appear in your dashboard when the call ends.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="/install" className="btn-interactive px-5 py-2.5 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-[13px] font-semibold rounded-md hover:bg-stone-800 dark:hover:bg-stone-300 transition-colors">
                Get the extension
              </a>
              <a href="/privacy" className="px-5 py-2.5 border border-stone-300 dark:border-stone-700 dark:text-stone-300 text-[13px] font-medium rounded-md hover:border-stone-400 dark:hover:border-stone-500 transition-colors text-center">
                Privacy policy
              </a>
            </div>
          </Reveal>
        </div>

          <div className="relative hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-b from-stone-200/40 via-transparent to-transparent blur-3xl rounded-2xl dark:from-stone-900/20" aria-hidden />
          <div className="relative bg-white dark:bg-[#1a1817] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-[#272727] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-700" aria-hidden />
              <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-700" aria-hidden />
              <span className="w-2 h-2 rounded-full bg-stone-800 dark:bg-stone-900" aria-hidden />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-stone-900 dark:text-white uppercase tracking-wider">Minutes</span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded border font-semibold bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50">REC</span>
              </div>
              <div className="h-2 bg-stone-100 dark:bg-[#373737] rounded-full overflow-hidden mb-4">
                <div className="h-full bg-red-500 w-[65%] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" aria-hidden />
              </div>
              <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-900 dark:bg-stone-800 flex items-center justify-center text-[10px] text-white shrink-0">1</span>
                  <span className="leading-relaxed">Recording tab audio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-900 dark:bg-stone-800 flex items-center justify-center text-[10px] text-white shrink-0">2</span>
                  <span className="leading-relaxed">Capturing your microphone</span>
                </li>
                <li className="flex items-start gap-2 opacity-50">
                  <span className="w-5 h-5 rounded-full bg-stone-900 dark:bg-stone-800 flex items-center justify-center text-[10px] text-white shrink-0">3</span>
                  <span className="leading-relaxed">Transcribing after the call</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
