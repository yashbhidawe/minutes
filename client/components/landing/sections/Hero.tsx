import { AuthCta } from "../AuthCta";
import { HeroDemo } from "../HeroDemo";
import { Check } from "../Check";

export function Hero() {
  return (
    <section className="relative" aria-labelledby="hero-heading">
      <div className="landing-grid absolute inset-0" aria-hidden />
      <div className="relative max-w-6xl mx-auto px-6 pt-12 pb-16 sm:pt-20 md:pt-28 md:pb-28 grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-center">
        <div className="min-w-0">
          <h1
            id="hero-heading"
            className="animate-fade-up-2 text-[42px] leading-[1.02] sm:text-[60px] md:text-[72px] font-light tracking-[-0.03em] text-balance text-stone-950"
          >
            Meeting notes
            <br />
            <span className="font-semibold text-stone-900">that write themselves.</span>
          </h1>

          <p className="animate-fade-up-3 mt-6 text-[16px] md:text-lg leading-relaxed text-stone-500 max-w-xl">
             Minute AI captures your Google Meet audio, transcribes every
             word, and summarizes the decisions, blockers, and action items
             — then lets you ask anything about the call, with answers cited
             back to the transcript.
          </p>

          <div className="animate-fade-up-4 mt-10">
            <AuthCta variant="hero" />
          </div>

          <ul className="animate-fade-up-5 mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-stone-400">
            <li className="flex items-center gap-1.5">
              <Check className="text-stone-500" /> No bot joins your call
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="text-stone-500" /> Browser only — no admin setup
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="text-stone-500" /> Answers cite the transcript
            </li>
          </ul>
        </div>

        <div className="animate-fade-up-3">
          <HeroDemo />
        </div>
      </div>
    </section>
  );
}
