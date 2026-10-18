import { Reveal } from "../Reveal";
import { Check } from "../Check";

const FEATURES = [
  {
    title: "Transcripts you can trust",
    body: "Every word captured with timestamps. Click any moment to jump straight to that part of the audio.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
    ),
  },
  {
    title: "Summaries worth copying",
    body: "Decisions, blockers, highlights, next steps — structured so you can paste them straight into Slack or Notion.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
    ),
  },
  {
    title: "Action items that stick",
    body: "Owners, due dates, and priorities. Nothing evaporates after the call ends.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
    ),
  },
];

export function Features() {
  return (
    <section id="features" className="max-w-6xl mx-auto px-6 pb-24 scroll-mt-24" aria-labelledby="features-heading">
      <div className="max-w-2xl mb-16 text-center">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 mb-3">Features</p>
          <h2 id="features-heading" className="text-3xl md:text-4xl font-light tracking-tight text-stone-950">
            Everything after <span className="font-semibold">“bye, thanks all”</span>
          </h2>
        </Reveal>
      </div>
      <div className="grid sm:grid-cols-3 gap-5">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 80}>
            <article className="bg-white border border-stone-200 rounded-xl p-6 hover:border-stone-300 hover:shadow-sm transition-colors">
              <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold tracking-tight text-stone-950 mb-2">{f.title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{f.body}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
