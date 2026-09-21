"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { registerLenis } from "@/lib/scroll-lock";

/**
 * Inertial scrolling, wired into GSAP's ticker.
 *
 * Lenis rather than GSAP's own ScrollSmoother: ScrollSmoother transforms a content
 * wrapper, which breaks `position: fixed`. This site has four fixed elements — the navbar,
 * the floating WhatsApp button, the scroll-progress bar and the gallery lightbox — and all
 * of them would have had to be lifted out of that wrapper. Lenis drives the real window
 * scroll position instead, so every one of them keeps working untouched.
 *
 * The three wiring steps below matter:
 *   1. Lenis emits `scroll` -> ScrollTrigger.update(), so triggers stay in sync with the
 *      eased position rather than the raw one.
 *   2. GSAP's ticker drives Lenis, so both run on one rAF loop instead of two competing
 *      ones. lagSmoothing(0) stops GSAP clamping delta after a slow frame, which otherwise
 *      makes the scroll jump when a tab regains focus.
 *   3. Native CSS smooth scrolling is turned off while Lenis is active — two smooth-scroll
 *      implementations fighting over the same anchor click is visible jank.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Honour the OS setting: no hijacking, native scrolling only.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Touch devices already have momentum scrolling; hijacking it fights the platform.
      syncTouch: false,
    });

    lenis.on("scroll", ScrollTrigger.update);
    // Hand the instance to the scroll lock: overflow:hidden alone will not stop
    // Lenis, which drives window.scrollTo from its own wheel/touch handling.
    registerLenis(lenis);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";

    // Anchor links: hand them to Lenis so in-page jumps are eased too, offset by the
    // fixed header the same way `scroll-padding-top: 6rem` does for native scrolling.
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      const href = anchor?.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -96 });
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      root.style.scrollBehavior = previousBehavior;
      registerLenis(null);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
