import { AuthCta } from "../AuthCta";
import { Reveal } from "../Reveal";

export function FinalCta() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20" aria-labelledby="cta-heading">
      <Reveal>
        <div className="relative overflow-hidden bg-stone-950 rounded-xl px-6 py-14 sm:px-8 md:p-16 text-center">
          <div className="landing-grid absolute inset-0 opacity-40 invert" aria-hidden />
          <div className="relative">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-stone-500 mb-4">Free to start · No credit card</p>
            <h2 id="cta-heading" className="text-3xl md:text-5xl font-light tracking-tight text-white leading-tight">
              Stop taking notes.
              <br />
              <span className="font-semibold">Start shipping.</span>
            </h2>
            <p className="mt-5 text-[15px] text-stone-400 max-w-xl mx-auto leading-relaxed">
               Create an account, add the extension, and review decisions,
               owners and next steps after your next processed meeting. Then
               ask anything — answers cite the source.
            </p>
            <AuthCta variant="final" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
