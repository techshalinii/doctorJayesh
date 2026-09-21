"use client";

import { useState, type RefObject } from "react";
import { gsap, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/gsap";

/**
 * Enter/exit transitions for conditionally rendered elements — the one thing GSAP has no
 * direct answer to, and what <AnimatePresence> was doing in the navbar menu, the WhatsApp
 * panel and the gallery lightbox.
 *
 * The element has to outlive `open` going false, or there is nothing left to animate out.
 * The returned flag provides that: it turns on during render the moment `open` flips
 * (React's documented "adjusting state during render", which is why this is not an effect
 * and does not trip the set-state-in-effect rule), and turns off from the exit tween's
 * onComplete.
 *
 * The caller owns the ref rather than receiving one back. Returning a ref inside an object
 * means every read of that object at render time counts as touching a ref, which the
 * react-hooks/refs rule rejects; taking one in keeps the call site a plain `ref={someRef}`.
 *
 * Under prefers-reduced-motion the duration drops to zero rather than the path changing,
 * so the same onComplete still unmounts — show and hide simply become instant.
 *
 *   const ref = useRef<HTMLDivElement>(null);
 *   const rendered = usePresence(open, ref);
 *   return rendered ? <div ref={ref}>…</div> : null;
 */
export function usePresence(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
  from: gsap.TweenVars = { opacity: 0, y: -8 },
  to: gsap.TweenVars = { opacity: 1, y: 0 },
  duration = 0.22,
) {
  const [rendered, setRendered] = useState(open);

  if (open && !rendered) setRendered(true);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!rendered || !el) return;

    const d = prefersReducedMotion() ? 0 : duration;

    // `to` is passed rather than derived: the navbar panel opens to height "auto", which no
    // rule of thumb over the `from` keys would have produced.
    const tween = open
      ? gsap.fromTo(el, from, { ...to, duration: d, ease: "power2.out", overwrite: true })
      : gsap.to(el, { ...from, duration: d, ease: "power2.in", overwrite: true, onComplete: () => setRendered(false) });

    return () => {
      tween.kill();
    };
    // `from`/`to` are object literals at every call site; keying the effect on their
    // identity would restart the tween on every render.
  }, [open, rendered, duration]);

  return rendered;
}
