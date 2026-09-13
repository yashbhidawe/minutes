"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({
  to,
  prefix = "",
  suffix = "",
}: {
  to: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (to === 0) return;
    const run = () => {
      if (started.current) return;
      started.current = true;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setVal(to);
        return;
      }
      const dur = 1300;
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(2, -10 * p); // easeOutExpo
        setVal(Math.round((p === 1 ? to : to * eased) * 10) / 10);
        if (p < 1) requestAnimationFrame(tick);
        else setVal(to);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            run();
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  const display = Number.isInteger(to) ? Math.round(val) : val.toFixed(0);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

export function Stat({
  to,
  prefix = "",
  suffix = "",
  word = "",
  label,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  word?: string;
  label: string;
}) {
  return (
    <div className="card-lift p-5 bg-white border border-stone-200 rounded-lg">
      <p className="text-2xl font-bold tracking-tight text-stone-950">
        <CountUp to={to} prefix={prefix} suffix={suffix} />
        {word ? ` ${word}` : null}
      </p>
      <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 mt-1.5 leading-relaxed">
        {label}
      </p>
    </div>
  );
}
