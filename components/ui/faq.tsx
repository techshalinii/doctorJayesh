"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

/**
 * Accordion FAQ list.
 *
 * Every answer is ALWAYS in the DOM — collapsing is done with a CSS grid-rows transition,
 * never by unmounting. That is deliberate and load-bearing: the homepage carries FAQPage
 * JSON-LD listing all seven Q&As, and structured data may only describe content that is
 * actually present on the page. The previous implementation mounted one answer at a time,
 * so six of the seven answers did not exist in the markup at all. See _migration/PAGE-REBUILD.md.
 *
 * Collapsed-by-default: pass `defaultOpen` to expand one on mount.
 */
export function Faq({
  items,
  defaultOpen = null,
}: {
  items: { q: string; a: string }[];
  defaultOpen?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <div className="border-t border-navy-900/12 dark:border-white/12">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.q} className="border-b border-navy-900/12 dark:border-white/12">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-display text-base font-medium leading-snug text-navy-900 dark:text-white">
                {it.q}
              </span>
              <Plus
                className={`h-4 w-4 shrink-0 text-teal-600 transition-transform duration-300 dark:text-teal-400 ${isOpen ? "rotate-45" : ""}`}
              />
            </button>
            {/* grid-rows 0fr → 1fr collapses without unmounting the answer */}
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl pb-5 text-sm leading-relaxed text-muted">{it.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
