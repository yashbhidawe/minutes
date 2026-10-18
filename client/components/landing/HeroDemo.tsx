"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WAVE_HEIGHTS = [
  10, 18, 26, 14, 30, 22, 12, 28, 16, 34, 20, 11, 26, 32, 15, 24, 18, 30, 13, 22,
  28, 16, 34, 19, 12, 26, 20, 30,
];

function Waveform({ bars = 28, className = "" }: { bars?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-[3px] h-9 ${className}`} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="wave-bar w-[3px] rounded-full bg-stone-300"
          style={{
            height: `${WAVE_HEIGHTS[i % WAVE_HEIGHTS.length]}px`,
            animationDelay: `${(i % 12) * 0.12}s`,
            animationDuration: `${1.1 + ((i * 7) % 10) / 10}s`,
          }}
        />
      ))}
    </div>
  );
}

const COPY_TEXT = `Weekly Team Sync (Tuesday · 32 min)

Key Decisions:
• Approved the new onboarding flow for next sprint
• Paused the homepage rewrite until research lands

Next Steps:
• Share the timeline update with stakeholders
• Confirm launch owners for Friday review

Action Items:
• [ ] Send updated timeline to the team (Priya)
• [ ] Confirm research readout date (Priya)`;

const STATUS_ORDER = ["to do", "in progress", "done"] as const;
type DemoStatus = (typeof STATUS_ORDER)[number];

const DEMO_ACTIONS: { desc: string; owner: string; dot: string; status: DemoStatus }[] = [
  { desc: "Send the revised timeline to the team", owner: "Yash", dot: "bg-red-500", status: "in progress" },
  { desc: "Confirm the research readout date", owner: "Priya", dot: "bg-amber-400", status: "to do" },
  { desc: "Publish notes to the shared doc", owner: "Unassigned", dot: "bg-emerald-500", status: "done" },
];

export function HeroDemo() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const [copied, setCopied] = useState(false);
  const [actions, setActions] = useState(DEMO_ACTIONS);

  const doneCount = actions.filter((a) => a.status === "done").length;

  const onMove = useCallback((e: React.PointerEvent) => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    if (!wrap || !card) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const r = wrap.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.classList.add("tilting");
      card.style.transform = `perspective(1100px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
      card.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    });
  }, []);

  const onLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    cancelAnimationFrame(raf.current);
    card.classList.remove("tilting");
    card.style.transform = "";
  }, []);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(COPY_TEXT);
    } catch {
      /* clipboard unavailable — still show feedback */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, []);

  const cycleStatus = useCallback((idx: number) => {
    setActions((prev) =>
      prev.map((a, i) =>
        i === idx
          ? { ...a, status: STATUS_ORDER[(STATUS_ORDER.indexOf(a.status) + 1) % STATUS_ORDER.length] }
          : a
      )
    );
  }, []);

  return (
    <div ref={wrapRef} onPointerMove={onMove} onPointerLeave={onLeave} className="relative">
      <div
        className="absolute -inset-6 bg-gradient-to-b from-stone-200/50 via-transparent to-transparent blur-2xl rounded-full"
        aria-hidden
      />
      <div
        ref={cardRef}
        className="tilt demo-card group relative bg-white border border-stone-200 rounded-xl shadow-[0_24px_60px_-24px_rgb(0_0_0/0.25)] overflow-hidden"
      >
        <div className="demo-glare" aria-hidden />
        {/* window bar */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-stone-100 bg-stone-50/60">
          <div className="flex items-center gap-1.5 shrink-0" aria-hidden>
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-stone-800" />
          </div>
          <p className="hidden min-[400px]:block text-[11px] font-mono text-stone-400 truncate">Your meeting summary</p>
          <span className="shrink-0 text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded border font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-current rec-dot" />
            ready
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold tracking-tight text-stone-950">
                Weekly Team Sync
              </p>
              <p className="text-[11px] text-stone-400 font-medium mt-0.5">Tuesday · 32 min</p>
            </div>
            <Waveform bars={18} />
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-3">
            <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-stone-400 mb-2.5">
              Key decisions
            </p>
            <ul className="space-y-2 text-[13px] leading-relaxed text-stone-800">
              <li className="flex gap-2">
                <span className="text-stone-300 font-bold" aria-hidden>
                  •
                </span>
                Approved the new onboarding flow for next sprint.
              </li>
              <li className="flex gap-2">
                <span className="text-stone-300 font-bold" aria-hidden>
                  •
                </span>
                Paused the homepage rewrite until research lands.
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
            <button
              onClick={() => cycleStatus(0)}
              title="Try it — click to cycle the status"
              className="card-lift text-left p-3.5 bg-stone-50 border border-stone-200 rounded-lg cursor-pointer"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <p
                  className={`text-xs font-medium leading-snug transition-all duration-300 ${
                    actions[0].status === "done"
                      ? "text-stone-400 line-through"
                      : "text-stone-900"
                  }`}
                >
                  {actions[0].desc}
                </p>
              </div>
              <p className="text-[11px] text-stone-400 font-medium">
                {actions[0].owner} ·{" "}
                <span className="uppercase font-mono text-[10px] underline decoration-dotted underline-offset-2">
                  {actions[0].status} ↻
                </span>
              </p>
            </button>
            <div className="p-3.5 bg-stone-950 rounded-lg">
              <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1.5">
                [04:12]
              </p>
              <p className="text-[12px] leading-relaxed text-stone-200 font-medium">
                “…so the summary lands before standup…”
              </p>
            </div>
          </div>

          <div
            className="mt-3 flex items-center gap-2.5 bg-stone-950 text-stone-200 rounded-lg px-3.5 py-2.5"
            title="Ask anything — answers cite the transcript"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-stone-500 shrink-0">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
            </svg>
            <p className="flex-1 min-w-0 text-[12px] text-stone-300 truncate">
              What did we decide about the launch?
            </p>
            <span className="shrink-0 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300">
              <span aria-hidden>▶</span> 04:12
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-stone-100 bg-white">
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`btn-interactive text-[11px] font-medium px-2.5 py-1 rounded border transition-colors inline-flex items-center gap-1.5 ${
                copied
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-stone-100 border-stone-200 text-stone-700 hover:border-stone-400"
              }`}
            >
              {copied ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="animate-pop-in">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied
                </>
              ) : (
                "Copy summary"
              )}
            </button>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded bg-stone-100 border border-stone-200 text-stone-700">
              Share
            </span>
          </div>
          <span className="text-[11px] font-semibold text-stone-900">View →</span>
        </div>
      </div>

      {/* floating chip */}
      <div className="animate-floaty-delayed hidden sm:block absolute -bottom-5 right-6 bg-white border border-stone-200 rounded-lg px-3.5 py-2.5 shadow-lg">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">
          Action items
        </p>
        <p className="text-sm font-bold text-stone-950 mt-0.5 tabular-nums">
          {actions.length} assigned · {doneCount} done
        </p>
      </div>
    </div>
  );
}
