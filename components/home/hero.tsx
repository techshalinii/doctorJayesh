"use client";

import Image from "next/image";
import { useRef } from "react";
import { ArrowRight, ArrowUpRight, Clock, ShieldCheck, Stethoscope } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { doctor, SURGERIES_TOTAL } from "@/lib/data";
import { gsap, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/gsap";
import { ThreePillars } from "./three-pillars";
import { TrustStats } from "./trust-stats";

/**
 * Hero entrance: the five blocks below rise in on mount, 80ms apart.
 *
 * Replaces the framer `rise` variants with one GSAP timeline over `[data-rise]`, which is
 * cheaper than five independent animations and keeps the order in the markup rather than
 * in a `custom` index that had to be kept in sync by hand.
 *
 * `power4.out` stands in for the old cubic-bezier(0.22, 1, 0.36, 1) — the same fast-out,
 * long-settle shape.
 */
function useHeroEntrance() {
  const scope = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = scope.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-rise]",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power4.out", stagger: 0.08 },
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return scope;
}


const PORTRAIT = "/images/doctor1.png";
const PORTRAIT_ALT = "Dr. Jayesh Sardhara, Neurosurgeon & Spine Surgeon";

/**
 * Shared by both portrait elements below. They are never visible at the same time, but only
 * one of the two is ever fetched — identical `sizes` means both resolve to the same
 * optimised variant at a given viewport, so the preload the `priority` copy emits is the
 * file the other one would have requested anyway.
 */
const PORTRAIT_SIZES = "(min-width: 1280px) 44vw, (min-width: 1024px) 36vw, 92vw";

/**
 * Split hero: copy column on the left, the portrait cut-out bleeding off the bottom-right.
 *
 * This replaced the full-bleed brain/spine banner. The scan was dark blue, so the copy had
 * to sit on a scrim over it; on a light ground the burgundy headline and the transparent
 * navbar both clear AA without one, which is why there is no overlay here beyond the soft
 * background wash.
 *
 * Every string below already existed on the site — the eyebrow, H1 and primary CTA are the
 * live WordPress hero verbatim, and the supporting lines come from `doctor` in lib/data.ts.
 * The stat card uses SURGERIES_TOTAL rather than a `trustStats` entry so it does not repeat
 * the figures the <TrustStats> band renders further down the page.
 */
export function Hero() {
  const scope = useHeroEntrance();

  return (
    <section className="relative isolate overflow-hidden bg-background">
      {/* The banner area, wrapped so it — not the whole <section> — is the containing block
          for the wash and the portrait. <ThreePillars> and <TrustStats> now render inside
          this section, and an `inset-0` pinned to the section would stretch both of them
          across those bands too, dropping the portrait's `bottom-0` to the foot of
          <TrustStats> instead of the foot of the banner. */}
      <div className="relative">
        {/* Background wash. Light ground as in the rest of the page — the tinted blooms are
          brand navy/teal at low alpha, so the section reads warm without a second surface. */}
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-surface via-background to-background" />
          <div className="absolute -left-32 top-8 h-80 w-80 rounded-full bg-teal-200/30 blur-3xl dark:bg-teal-500/10" />
          <div className="absolute right-[8%] -top-24 h-[36rem] w-[36rem] rounded-full bg-navy-100/50 blur-3xl dark:bg-navy-800/25" />
        </div>

        {/* Portrait, lg and up. pointer-events-none so it never swallows clicks on the copy.

          It is anchored inside a <Container>, not to the section's own right edge. Anchoring
          to the section meant the viewport edge, but the copy is capped at the Container's
          1600px — so past that width every extra pixel of viewport became gap between the
          two. Tracking the Container keeps the figure the same distance from the copy at
          1440px, 1920px and 2560px alike. `right-12` matches the Container's own lg gutter.

          `object-right-bottom`, not `object-bottom`: when the figure is height-constrained
          it is narrower than its box, and centring it there split the slack into equal dead
          margins on both sides — half of which read as the gap next to the copy.

          `top-28` rather than `inset-y-0` is what keeps the head out of the navbar. With a
          full-height box, `object-contain` renders the figure at min(boxHeight, boxWidth ×
          1.188) — on wide viewports the width term wins, the image fills the box's full
          height, and its top lands at the section's top edge, i.e. behind the fixed header.
          Starting the box 7rem down caps that. `object-bottom` can only ever push the
          figure further down from that edge, so 7rem is a hard floor for the top of the
          head regardless of viewport, hero height or the image's aspect ratio. The header
          is 5rem tall unscrolled (py-5 around a 40px logo row) and 4rem scrolled, leaving
          at least 2rem of clear space beneath it. */}
        <div className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
          <Container className="relative h-full">
            {/* The 2xl steps are where the slack actually is. Below 1536px the Container is
                the viewport and the composition is already tight — at 1280px the figure and
                the cards clear each other by only ~45px — so those widths are left alone.
                From 1536px the Container caps at 1600 and the surplus turns into gap, which
                is what the larger right inset claws back: the figure moves ~5% toward centre
                at 1536-1799 and ~7% from 1800 up.

                `2xl:w-[40%]` is a guard, not a resize: it only binds at the narrow end of
                2xl, where a copy column taller than the min-h would otherwise make the
                figure width-bound, wider, and overlapping the cards. At 1800px+ the height
                term still wins, so the rendered figure is unchanged at ~606px.

                `2xl:top-32` drops the whole figure 16px so its mass sits lower against the
                copy. Still bottom-anchored and fully contained — nothing is cropped. */}
            <div className="absolute bottom-0 right-12 top-28 w-[36%] xl:w-[44%] 2xl:right-36 2xl:top-32 2xl:w-[40%] min-[1800px]:right-48">
              <div className="absolute bottom-0 right-0 h-[62%] w-[62%] rounded-full bg-teal-100/40 blur-3xl dark:bg-teal-500/10" />
              <Image
                src={PORTRAIT}
                alt={PORTRAIT_ALT}
                fill
                priority
                sizes={PORTRAIT_SIZES}
                className="object-contain object-right-bottom"
              />
            </div>
          </Container>
        </div>

        <Container>
          {/* relative + z-10: the portrait above is absolutely positioned, so without a
            stacking position of its own this in-flow column would paint underneath it. */}
          {/* xl:min-h fixes the section's height rather than letting the copy dictate it. The
            portrait is height-constrained at these widths (see the note above), so its
            rendered width — and therefore how close it sits to the copy — would otherwise
            drift with any edit to the copy above. 53rem keeps the figure ~620px wide, which
            lands its left edge at 55-57% of the viewport from 1280px to 2560px. */}
          <div className="relative z-10 grid items-center gap-10 pb-16 pt-28 sm:pt-32 lg:grid-cols-12 lg:gap-8 lg:pb-24 lg:pt-36 xl:min-h-[53rem]">
            <div ref={scope} className="lg:col-span-7">
              <p
                data-rise
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-700 shadow-soft ring-1 ring-navy-100 dark:bg-white/5 dark:text-teal-300 dark:ring-white/10"
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                {/* Live WordPress hero eyebrow, verbatim. */}
                feel the difference with us
              </p>

              <h1
                data-rise
                className="mt-6 font-display text-[2.6rem] font-medium leading-[1.02] tracking-[-0.02em] text-navy-900 xs:text-[3.1rem] sm:text-6xl lg:text-[4.7rem] dark:text-white"
              >
                {/* Live WordPress H1 was the fragment "Your Health Is", with "Our Priority" in a
                  separate <p>. Same words, completed into one heading — see home-content.json
                  seo.headingAudit. */}
                Your Health Is
                <br />
                <em className="not-italic text-gradient font-display italic">Our Priority</em>
              </h1>

              {/* doctor.tagline, unchanged — the same line the site already uses to describe
                the practice. Capped so it wraps to two lines beside the portrait. */}
              <p
                data-rise
                className="mt-6 max-w-lg text-lg leading-relaxed text-muted 2xl:max-w-xl"
              >
                {doctor.tagline}
              </p>

              <div
                data-rise
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                {/* Magnetic wraps rather than restyles: the Button keeps its own hover lift,
                    and the pull lives on the span around it so the two transforms never
                    fight over the same element. */}
                <Magnetic>
                  <Button href="#book_now" size="lg">
                    Book An Appointment <ArrowRight className="h-4 w-4" />
                  </Button>
                </Magnetic>
                <Magnetic>
                  <Button href="#about" size="lg">
                    Why Choose Us <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Magnetic>
              </div>

              {/* Portrait on small screens, where the absolute one above is hidden. Both carry
                the same alt: only one is ever rendered, the other is display:none. */}
              <div className="relative mt-12 h-[19rem] w-full overflow-hidden rounded-4xl bg-gradient-to-b from-navy-50 to-teal-50 sm:h-[24rem] lg:hidden dark:from-navy-800 dark:to-navy-950">
                <Image
                  src={PORTRAIT}
                  alt={PORTRAIT_ALT}
                  fill
                  sizes={PORTRAIT_SIZES}
                  className="object-contain object-bottom"
                />
              </div>

              <div
                data-rise
                /* Widened only at 2xl, matched to the figure's step. The identity card spans
                   both tracks so it extends with the grid; OPD and the surgeries stat stay a
                   two-up of equal tracks and simply get more room each. */
                className="mt-10 grid max-w-xl gap-3 sm:grid-cols-2 2xl:max-w-2xl"
              >
                <div className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-card ring-1 ring-navy-100 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-soft hover:ring-navy-200 sm:col-span-2 dark:bg-white/5 dark:ring-white/10">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-700 dark:bg-white/10 dark:text-teal-300">
                    <Stethoscope className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-navy-900 dark:text-white">
                      {doctor.name}
                    </span>
                    <span className="block truncate text-xs text-muted">{doctor.credentials}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-card ring-1 ring-navy-100 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-soft hover:ring-navy-200 dark:bg-white/5 dark:ring-white/10">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 dark:bg-white/10 dark:text-teal-300">
                    <Clock className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium uppercase tracking-wider text-muted">OPD</span>
                    <span className="block text-sm font-semibold text-navy-900 dark:text-white">{doctor.opd}</span>
                  </span>
                </div>

                <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-navy-100 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-soft hover:ring-navy-200 dark:bg-white/5 dark:ring-white/10">
                  <span className="block font-display text-2xl font-medium tracking-tight text-navy-900 dark:text-white">
                    {SURGERIES_TOTAL}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium uppercase tracking-wider text-muted">
                    Surgeries Performed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <ThreePillars />
      <TrustStats />
    </section>
  );
}
