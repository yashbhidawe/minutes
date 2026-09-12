import { DEFINITION_ANSWER } from "@/lib/landing-content";
import { Reveal } from "../Reveal";

export function Definition() {
  return (
    <section className="max-w-3xl mx-auto px-6 pt-14" aria-labelledby="what-heading">
      <Reveal>
        <h2 id="what-heading" className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 mb-3 text-center">
          What is Minute AI?
        </h2>
        <p className="text-center text-[17px] md:text-lg leading-relaxed text-stone-700 font-light">
          {DEFINITION_ANSWER}
        </p>
      </Reveal>
    </section>
  );
}
