import { STEPS } from "@/lib/landing-content";
import { Reveal } from "../Reveal";

export function HowItWorks() {
  return (
    <section id="how" className="max-w-6xl mx-auto px-6 pb-24 scroll-mt-24" aria-labelledby="how-heading">
      <div className="max-w-3xl mb-14 text-center">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 mb-3">How it works</p>
          <h2 id="how-heading" className="text-3xl md:text-5xl font-light tracking-tight text-stone-950 mb-6">
            Three steps. No bot.
          </h2>
        </Reveal>
      </div>

      <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 list-none">
        {STEPS.map((s, i) => (
          <li key={s.n}>
            <Reveal delay={i * 80}>
              <div className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg border border-stone-200 flex items-center justify-center bg-stone-50 text-stone-600">
                  <span className="text-sm font-mono font-bold">{s.n}</span>
                </div>
                <h3 className="text-base font-semibold tracking-tight text-stone-900">{s.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{s.body}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
