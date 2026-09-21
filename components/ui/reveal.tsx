"use client";

import { useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion, useIsomorphicLayoutEffect, REVEAL_START } from "@/lib/gsap";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "li" | "article" | "span";
};

/**
 * Fade + rise into view once, respecting reduced-motion.
 *
 * Same props as the framer-motion version it replaced, so the 18 call sites are unchanged.
 *
 * The "from" state is applied by GSAP in a layout effect rather than by an inline style,
 * which is what keeps this safe without JavaScript: the server sends the element in its
 * final, visible state, and only a browser that will actually run the animation ever hides
 * it. Doing that before paint means no flash of the visible state first.
 */
export function Reveal({ children, className, delay = 0, y = 24, as: Tag = "div" }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: REVEAL_START, once: true },
        },
      );
    }, el);

    // context.revert() kills the tween, its ScrollTrigger, and restores inline styles.
    return () => ctx.revert();
  }, [delay, y]);

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}

/** Container that staggers its StaggerItem children. */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const items = el.querySelectorAll("[data-stagger-item]");
      if (!items.length) return;
      gsap.fromTo(
        items,
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: "power3.out",
          stagger: 0.09,
          scrollTrigger: { trigger: el, start: "top bottom-=60px", once: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Marked with a data attribute so the parent Stagger can collect its children. */
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-stagger-item className={className}>
      {children}
    </div>
  );
}
