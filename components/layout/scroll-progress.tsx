"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useIsomorphicLayoutEffect } from "@/lib/gsap";

/**
 * Page-read progress bar.
 *
 * `scrub: 0.3` replaces the spring the framer version used — it eases the bar toward the
 * scroll position over 0.3s instead of tracking it rigidly, which is the same softened
 * feel without a second animation system.
 *
 * Not gated on reduced-motion: the bar is a position readout, not decoration, and with
 * scrub it only ever moves in response to the user's own scrolling.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.3,
          },
        },
      );
    }, el);

    // A route change swaps the page under a bar that is not remounted; recalculating keeps
    // `end` matched to the new document height.
    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transform: "scaleX(0)" }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-navy-600 to-teal-500"
      aria-hidden="true"
    />
  );
}
