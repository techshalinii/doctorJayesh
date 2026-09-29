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


const BANNER = "/images/hero-banner-spine.jpg";
const PORTRAIT = "/images/doctor1.png";
const PORTRAIT_ALT = "Dr. Jayesh Sardhara, Neurosurgeon & Spine Surgeon";
const PORTRAIT_SIZES = "(min-width: 1280px) 44vw, (min-width: 1024px) 36vw, 92vw";

export function Hero() {
  const scope = useHeroEntrance();

  return (
    <section className="relative isolate overflow-hidden bg-background">
      <div className="relative">
        <div aria-hidden className="absolute inset-0 -z-10">
          <Image
            src={BANNER}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-right opacity-70 dark:opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-background/10 lg:from-background/70 lg:via-background/20 lg:to-transparent dark:from-background dark:via-background/85 dark:to-background/50" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
        </div>

        <div className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
          <Container className="relative h-full">
            <div className="absolute bottom-0 right-24 top-28 w-[36%] xl:w-[44%] 2xl:right-36 2xl:top-32 2xl:w-[40%] min-[1800px]:right-48">
              <div className="absolute bottom-0 right-0 h-[62%] w-[62%] rounded-full bg-teal-100/40 blur-3xl dark:bg-teal-500/10" />
              <Image
                src={PORTRAIT}
                alt={PORTRAIT_ALT}
                fill
                priority
                sizes={PORTRAIT_SIZES}
                className="object-contain object-right-top"
              />
            </div>
          </Container>
        </div>

        <Container>
         
          <div className="relative z-10 grid items-center gap-10 pb-16 pt-28 sm:pt-32 md:min-h-svh md:pb-12 md:pt-28 lg:grid-cols-12 lg:gap-8 lg:pb-16 lg:pt-32">
            <div ref={scope} className="lg:col-span-7">
             

              <h1
                data-rise
                className="mt-6 font-display text-[2.6rem] font-medium leading-[1.02] tracking-[-0.02em] text-navy-900 xs:text-[3.1rem] sm:text-6xl lg:text-[4.7rem] dark:text-white"
              >
               
                Your Health Is
                <br />
                <em className="not-italic text-gradient font-display italic">Our Priority</em>
              </h1>
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
              
                <Magnetic>
                  <Button href="#book_now" size="lg">
                    Book An Appointment <ArrowRight className="h-4 w-4" />
                  </Button>
                </Magnetic>
                <Magnetic>
                  <Button href="#whychooseus" size="lg">
                    Why Choose Us <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Magnetic>
              </div>

              
              <div className="relative mt-12 h-[19rem] w-full overflow-hidden rounded-4xl bg-gradient-to-b from-navy-50 to-teal-50 sm:h-[24rem] md:mt-8 md:h-68 lg:hidden dark:from-navy-800 dark:to-navy-950">
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
                className="mt-10 grid max-w-xl gap-3 sm:grid-cols-2 md:mt-8 2xl:max-w-2xl"
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
