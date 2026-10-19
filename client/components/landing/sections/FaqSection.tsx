import { FaqAccordion } from "../FaqAccordion";
import { Reveal } from "../Reveal";

export function FaqSection() {
  return (
    <section id="faq" className="bg-white dark:bg-stone-950 scroll-mt-16" aria-labelledby="faq-heading">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 dark:text-stone-500 mb-3 text-center">FAQ</p>
          <h2 id="faq-heading" className="text-3xl md:text-4xl font-light tracking-tight text-stone-950 dark:text-stone-50 text-center">
            Asked on <span className="font-semibold">every call</span>
          </h2>
        </Reveal>
        <div className="mt-10">
          <FaqAccordion />
        </div>
      </div>
    </section>
  );
}
