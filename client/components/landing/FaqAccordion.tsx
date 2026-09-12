"use client";

import { useState } from "react";
import { FAQS } from "@/lib/landing-content";

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-stone-200 border-y border-stone-200">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q}>
            <h3>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                id={`faq-button-${i}`}
                className="w-full flex items-center justify-between gap-4 py-5 text-left group rounded-sm"
              >
                <span
                  className={`text-[15px] font-medium tracking-tight transition-colors ${
                    isOpen ? "text-stone-950" : "text-stone-700 group-hover:text-stone-950"
                  }`}
                >
                  {f.q}
                </span>
                <span
                  className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isOpen
                      ? "bg-stone-950 text-white border-stone-950 rotate-45"
                      : "border-stone-300 text-stone-500 group-hover:border-stone-500"
                  }`}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
            </h3>
            {/* always in DOM: crawlable + smoothly animated */}
            <div
              id={`faq-panel-${i}`}
              role="region"
              aria-labelledby={`faq-button-${i}`}
              className="faq-panel"
              data-open={isOpen}
            >
              <div>
                <p className="pb-6 text-sm leading-relaxed text-stone-500 max-w-2xl">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
