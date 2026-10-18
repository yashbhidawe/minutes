import { STEPS } from "@/lib/landing-content";
import { Reveal } from "../Reveal";

export function HowItWorks() {
  return (
    <section id="how" className="max-w-6xl mx-auto px-6 pb-20 scroll-mt-24" aria-labelledby="how-heading">
      <Reveal>
        <div className="max-w-2xl mb-10">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 mb-3">How it works</p>
          <h2 id="how-heading" className="text-3xl md:text-4xl font-light tracking-tight text-stone-950">
            Record. <span className="font-semibold">Process. Review.</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-stone-500">
             You run the meeting. Minute AI captures and processes the
             recording, then gives you a transcript, summary and cited answers you can act on.
          </p>
        </div>
      </Reveal>
      <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 list-none">
        {STEPS.map((s, i) => (
          <li key={s.n}>
            <Reveal delay={i * 80} className="h-full">
              <div className="card-lift feature-card group bg-white border border-stone-200 rounded-lg p-6 hover:border-stone-900 hover:shadow-[0_16px_40px_-20px_rgb(0_0_0/0.3)] h-full">
                <div className="flex items-center justify-between mb-8">
                  <span className="step-num text-xs font-mono font-bold text-stone-300 group-hover:text-stone-900 transition-colors">{s.n}</span>
                </div>
                <h3 className="text-[15px] font-semibold tracking-tight text-stone-950 mb-2">{s.title}</h3>
                <p className="text-[13px] leading-relaxed text-stone-500">{s.body}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
