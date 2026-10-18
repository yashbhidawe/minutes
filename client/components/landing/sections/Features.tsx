import { Reveal } from "../Reveal";

const FEATURES = [
  {
    title: "No bots, no awkward joins",
    body: "Nothing ever enters your call. No 'bot has joined' moment, no permissions to chase from IT.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    ),
  },
  {
    title: "Transcripts you can trust",
    body: "Every word captured with timestamps. Skim the highlights or drop into any moment instantly.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
    ),
  },
  {
    title: "Summaries worth copying",
    body: "Every meeting becomes decisions, highlights, blockers and next steps — copy or export them from your dashboard.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
    ),
  },
  {
    title: "Action items that stick",
    body: "Owners, priorities and clear statuses. Nothing slips through after the call ends.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
    ),
  },
  {
    title: "Ask your meetings anything",
    body: "Type a question and get an answer grounded in the transcript, with citations you can click to jump straight to the moment.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" /></svg>
    ),
  },
  {
    title: "Search every meeting at once",
    body: "Ask across your whole meeting history. Answers name the meetings they came from, linked straight to the source.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
    ),
  },
  {
    title: "A dashboard you'll return to",
    body: "All your meetings in one calm place. Search across every transcript and jump into a conversation in one click.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
    ),
  },
  {
    title: "Private account controls",
    body: "Your meeting history belongs to your account. Delete a meeting to remove its active transcript, notes, action items and stored audio. See our Privacy Policy for processing details.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
    ),
  },
];

export function Features() {
  return (
    <section id="features" className="border-y border-stone-200 bg-white scroll-mt-16" aria-labelledby="features-heading">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div className="max-w-xl">
              <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-stone-400 mb-3">Features</p>
              <h2 id="features-heading" className="text-3xl md:text-4xl font-light tracking-tight text-stone-950">
                Everything after <span className="font-semibold">“bye, thanks all”</span>
              </h2>
            </div>
            <p className="text-sm text-stone-500 max-w-sm leading-relaxed">
              Calm, minimal and fast — dense where it matters, quiet everywhere else.
            </p>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 4) * 80}>
              <div className="card-lift feature-card group p-6 bg-[#fafaf9] border border-stone-200 rounded-lg hover:bg-white hover:border-stone-300 hover:shadow-xs h-full">
                <div className="feature-icon w-9 h-9 rounded-md bg-stone-900 text-white flex items-center justify-center mb-5">
                  {f.icon}
                </div>
                <h3 className="text-[15px] font-semibold tracking-tight text-stone-950 mb-2">{f.title}</h3>
                <p className="text-[13px] leading-relaxed text-stone-500">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
