"use client";

import { useEffect } from "react";

/**
 * Page scroll lock, shared by the mobile nav panel and the gallery lightbox.
 *
 * `body { overflow: hidden }` alone is not enough on this site. Lenis drives the real
 * window scroll position from wheel and touch events, so it keeps calling scrollTo
 * regardless of the body's overflow; it has to be told to stop as well. The instance is
 * registered by <SmoothScroll> and is simply absent when smooth scrolling is off (reduced
 * motion), in which case the overflow rule does the whole job on its own.
 *
 * Reference-counted: two things can be open at once (the lightbox opened from a page whose
 * nav panel is also open), and the first one to close must not release the lock for both.
 */

type Lockable = { stop: () => void; start: () => void };

let lenis: Lockable | null = null;
let depth = 0;
let previousOverflow = "";
let previousPaddingRight = "";

/** Called by <SmoothScroll> on mount, and with null on teardown. */
export function registerLenis(instance: Lockable | null) {
  lenis = instance;
}

function lock() {
  depth += 1;
  if (depth > 1) return;

  const body = document.body;
  previousOverflow = body.style.overflow;
  previousPaddingRight = body.style.paddingRight;

  // Removing the scrollbar reflows the page a few pixels wider. Reserving its width keeps
  // the content still. Zero on overlay-scrollbar platforms, which is most phones — where
  // the nav panel actually lives.
  const gap = window.innerWidth - document.documentElement.clientWidth;
  if (gap > 0) {
    body.style.paddingRight = `${gap}px`;
    // The header is `fixed`, so body padding does not move it; it pads itself from this.
    document.documentElement.style.setProperty("--scrollbar-gap", `${gap}px`);
  }

  body.style.overflow = "hidden";
  lenis?.stop();
}

function unlock() {
  depth = Math.max(0, depth - 1);
  if (depth > 0) return;

  const body = document.body;
  body.style.overflow = previousOverflow;
  body.style.paddingRight = previousPaddingRight;
  document.documentElement.style.removeProperty("--scrollbar-gap");
  lenis?.start();
}

/** Locks page scroll while `active` is true, releasing it on false or unmount. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
