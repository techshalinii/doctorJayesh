"use client";

import { useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * Nudges its child a few pixels toward the cursor, easing back on leave.
 *
 * The one effect here that CSS cannot express — it needs the live pointer position, not a
 * state change. Everything else added alongside it (card lifts, icon scales, colour
 * shifts) stayed as CSS transitions, which are cheaper and already covered by the global
 * prefers-reduced-motion rule in globals.css.
 *
 * `gsap.quickTo` reuses one tween per axis instead of allocating a new one per
 * pointermove, so the handler stays cheap at 60fps.
 *
 * The pull is clamped to MAX_PX regardless of element size: unclamped, `strength` scales
 * with the element's width, and a wide button would swing far enough to read as a toy.
 *
 * Wraps rather than transforms the child on purpose. Buttons here carry their own
 * `hover:-translate-y-0.5`, and an inline GSAP transform on the same node would win and
 * cancel it. Two nested elements, one transform each, no conflict.
 */
const MAX_PX = 7;

export function Magnetic({
  children,
  className,
  strength = 0.22,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    // Touch and pen report no meaningful hover; the effect would fire once on tap and stick.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const clamp = gsap.utils.clamp(-MAX_PX, MAX_PX);
    const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo(clamp((e.clientX - (r.left + r.width / 2)) * strength));
      yTo(clamp((e.clientY - (r.top + r.height / 2)) * strength));
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(el);
    };
  }, [strength]);

  return (
    <span ref={ref} className={cn("inline-block", className)}>
      {children}
    </span>
  );
}
