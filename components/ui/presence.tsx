"use client";

import { useState, type RefObject } from "react";
import { gsap, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/gsap";

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

    const tween = open
      ? gsap.fromTo(el, from, { ...to, duration: d, ease: "power2.out", overwrite: true })
      : gsap.to(el, { ...from, duration: d, ease: "power2.in", overwrite: true, onComplete: () => setRendered(false) });

    return () => {
      tween.kill();
    };
  }, [open, rendered, duration]);

  return rendered;
}
