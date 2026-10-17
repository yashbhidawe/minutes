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
          <a
            href="#features"
            className="animate-fade-up-1 mb-5 inline-flex flex-wrap items-center gap-2 text-[11px] font-medium text-stone-600 bg-white border border-stone-200 rounded-full pl-1.5 pr-3 py-1 hover:border-stone-400 transition-colors"
          >
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-stone-900 text-white px-1.5 py-0.5 rounded-full">
              New
            </span>
            <span>Ask AI — cited answers from your meetings</span>
          </a>

          <h1
            id="hero-heading"
            className="animate-fade-up-1 text-[38px] leading-[1.02] sm:text-[44px] md:text-[64px] font-light tracking-[-0.03em] text-balance text-stone-950"
          >
            Meeting notes,
            <br />
            <span className="font-semibold">automatically.</span>
          </h1>

          <p className="animate-fade-up-2 mt-6 text-[15px] md:text-base leading-relaxed text-stone-500 max-w-xl">
             Minute AI turns meetings you are authorized to record into clear
             summaries, decisions and action items — and lets you ask anything,
             with answers cited to the transcript.{" "}
             <span className="text-stone-900 font-medium">Ready after processing.</span>
          </p>

          <div className="animate-fade-up-3">
            <AuthCta variant="hero" />
          </div>

          <ul className="animate-fade-up-4 mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-stone-400">
            <li className="flex items-center gap-1.5">
              <Check /> No bots in your call
            </li>
            <li className="flex items-center gap-1.5">
              <Check /> No admin setup for your team
            </li>
            <li className="flex items-center gap-1.5">
              <Check /> You control what is recorded
            </li>
            <li className="flex items-center gap-1.5">
              <Check /> Ask anything, answers cite the transcript
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
