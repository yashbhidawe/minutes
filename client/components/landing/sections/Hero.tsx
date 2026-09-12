import { AuthCta } from "../AuthCta";
import { HeroDemo } from "../HeroDemo";
import { Check } from "../Check";
import { Ticker } from "./Ticker";

export function Hero() {
  return (
    <section className="relative" aria-labelledby="hero-heading">
      <div className="landing-grid absolute inset-0" aria-hidden />
      <div className="relative max-w-6xl mx-auto px-6 pt-12 pb-14 sm:pt-16 md:pt-24 md:pb-20 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-10 items-center">
        <div className="min-w-0">
          <h1
            id="hero-heading"
            className="animate-fade-up-1 text-[38px] leading-[1.02] sm:text-[44px] md:text-[64px] font-light tracking-[-0.03em] text-balance text-stone-950"
          >
            Meeting notes,
            <br />
            <span className="font-semibold">automatically.</span>
          </h1>

          <p className="animate-fade-up-2 mt-6 text-[15px] md:text-base leading-relaxed text-stone-500 max-w-xl">
            Minute AI turns your Google Meet into clear summaries, decisions
            and owned action items —{" "}
            <span className="text-stone-900 font-medium">minutes after you hang up.</span>
          </p>

          <div className="animate-fade-up-3">
            <AuthCta variant="hero" />
          </div>

          <ul className="animate-fade-up-4 mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-stone-400">
            <li className="flex items-center gap-1.5">
              <Check /> No bots in your call
            </li>
            <li className="flex items-center gap-1.5">
              <Check /> Zero setup for your team
            </li>
            <li className="flex items-center gap-1.5">
              <Check /> No manual notes again
            </li>
          </ul>
        </div>

        <div className="animate-fade-up-3">
          <HeroDemo />
        </div>
      </div>

      <Ticker />
    </section>
  );
}
