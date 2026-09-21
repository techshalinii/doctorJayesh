import { useEffect, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Single registration point for GSAP across the app.
 *
 * Registering is idempotent, but doing it in one module keeps every component's import
 * list identical and means a future plugin is added in one place.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * useLayoutEffect warns during SSR. Every GSAP set-up here must run before paint — the
 * "from" state is applied by JavaScript, so a plain useEffect would let one frame of the
 * final state through first.
 */
export const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Matches the old framer viewport `margin: "-80px"`: fire 80px after the top edge enters. */
export const REVEAL_START = "top bottom-=80px";
