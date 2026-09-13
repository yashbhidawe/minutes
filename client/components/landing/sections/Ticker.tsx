import { TICKER } from "@/lib/landing-content";

export function Ticker() {
  return (
    <div className="ticker-mask relative border-y border-stone-200 bg-white/70 overflow-hidden">
      <div className="animate-ticker flex w-max items-center gap-3 py-3.5 px-3" aria-hidden>
        {[...TICKER, ...TICKER].map((t, i) => (
          <span key={i} className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-stone-500 font-medium">{t}</span>
            <span className="w-1 h-1 rounded-full bg-stone-300" />
          </span>
        ))}
      </div>
      <span className="sr-only">
        Automatic capture, instant summaries, action items, searchable transcripts.
      </span>
    </div>
  );
}
