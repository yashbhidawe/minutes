"use client";

import { useState } from "react";
import { FAQS } from "@/lib/landing-content";

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-stone-200 dark:divide-stone-800 border-y border-stone-200 dark:border-stone-800">
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
                    isOpen ? "text-stone-950 dark:text-stone-50" : "text-stone-700 dark:text-stone-300 group-hover:text-stone-950 dark:group-hover:text-stone-50"
                  }`}
                >
                  {f.q}
                </span>
                <span
                  className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isOpen
                      ? "bg-stone-950 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-950 dark:border-stone-100 rotate-45"
                      : "border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400 group-hover:border-stone-500"
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
                <p className="pb-6 text-sm leading-relaxed text-stone-500 dark:text-stone-400 max-w-2xl">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
