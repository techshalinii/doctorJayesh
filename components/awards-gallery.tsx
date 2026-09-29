"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { usePresence } from "@/components/ui/presence";
import { useScrollLock } from "@/lib/scroll-lock";
import { awardsGallery } from "@/lib/data";
import { cn } from "@/lib/utils";
import { CarouselControls, useSnapCarousel } from "@/components/ui/snap-carousel";

export interface GalleryImage {
  src: string;
  alt: string;
  href?: string;
}

const TILE =
  "group relative block w-full cursor-pointer overflow-hidden border border-navy-900/10 bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-white/10";

const DEFAULT_HEADING = (
  <span className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
    <span className="h-px w-8 bg-teal-600/50" /> Gallery
  </span>
);

export function AwardsGallery({
  className,
  images = awardsGallery,
  heading = DEFAULT_HEADING,
  ariaLabel = "Award photographs",
  itemLabel = "Award photograph",
  layout = "grid",
  showCaptions = true,
  tile = "square",
  autoplay = 0,
}: {
  className?: string;
  images?: readonly GalleryImage[];
  heading?: ReactNode;
  ariaLabel?: string;
  itemLabel?: string;
  layout?: "grid" | "carousel";
  showCaptions?: boolean;
  tile?: "square" | "portrait";
  autoplay?: number;
}) {
  const portrait = tile === "portrait";
  const tileClass = cn(TILE, portrait ? "aspect-[7/9] rounded-2xl" : "aspect-square");
  const tileSizes = portrait ? "(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 60vw" : "(min-width: 1024px) 22vw, 45vw";
  const carousel = layout === "carousel";
  const [openAt, setOpenAt] = useState<number | null>(null);
  const triggers = useRef<Array<HTMLButtonElement | null>>([]);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastOpened = useRef<number | null>(null);
  const wasOpen = useRef(false);

  const count = images.length;
  const isOpen = openAt !== null;
  const { track, active, pages, goTo, holdProps } = useSnapCarousel(images.length, {
    autoplay: carousel ? autoplay : 0,
    paused: isOpen,
  });
  const [shownAt, setShownAt] = useState(0);
  if (openAt !== null && openAt !== shownAt) setShownAt(openAt);
  const current = images[shownAt];
  const dialogRef = useRef<HTMLDivElement>(null);
  const dialogRendered = usePresence(isOpen, dialogRef, { opacity: 0 }, { opacity: 1 }, 0.2);
  useScrollLock(isOpen);

  const close = useCallback(() => setOpenAt(null), []);
  const step = useCallback(
    (delta: number) => setOpenAt((i) => (i === null ? i : (i + delta + count) % count)),
    [count],
  );

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "Tab") {
        const nodes = dialogRef.current?.querySelectorAll<HTMLElement>("button");
        if (!nodes?.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close, step]);

  useEffect(() => {
    if (openAt !== null) {
      lastOpened.current = openAt;
      if (!wasOpen.current) {
        wasOpen.current = true;
        closeRef.current?.focus();
      }
    } else if (wasOpen.current) {
      wasOpen.current = false;
      if (lastOpened.current !== null) triggers.current[lastOpened.current]?.focus();
      lastOpened.current = null;
    }
  }, [openAt]);

  return (
    <section className={className ?? "pb-12 lg:pb-14"} aria-label={ariaLabel}>
      <Container>
        {heading}
        <div {...(carousel ? holdProps : {})}>
        <div
          ref={carousel ? track : undefined}
          className={
            carousel
              ? "-m-1 flex snap-x snap-mandatory gap-4 overflow-x-auto p-1 [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden"
              : "mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
          }
        >
          {images.map((img, i) => (
            <Reveal
              key={img.src}
              delay={(i % 4) * 0.05}
              className={cn(
                carousel &&
                  (portrait
                    ? "shrink-0 snap-start basis-[60%] sm:basis-[calc((100%-3rem)/3)] lg:basis-[calc((100%-4.5rem)/4)]"
                    : "shrink-0 snap-start basis-[calc((100%-1rem)/2)] sm:basis-[calc((100%-3rem)/3)] lg:basis-[calc((100%-4.5rem)/4)]"),
              )}
            >
              {img.href ? (
                <a href={img.href} target="_blank" rel="noopener noreferrer" className={tileClass}>
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes={tileSizes}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </a>
              ) : (
                <button
                  type="button"
                  ref={(el) => {
                    triggers.current[i] = el;
                  }}
                  onClick={() => setOpenAt(i)}
                  aria-label={`View larger: ${img.alt}`}
                  className={tileClass}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes={tileSizes}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </button>
              )}
            </Reveal>
          ))}
        </div>
        {carousel && (
          <CarouselControls active={active} pages={pages} onGo={goTo} noun="photograph" />
        )}
        </div>
      </Container>

      {dialogRendered && (
        <div
          ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${itemLabel} ${(openAt ?? 0) + 1} of ${count}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/20 backdrop-blur-md sm:p-10 lg:p-12"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-black ring-1 ring-black/10 shadow-sm transition-colors hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 sm:right-6 sm:top-6"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>

            {count > 1 && (
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photograph"
                className="absolute left-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-black ring-1 ring-black/10 shadow-sm transition-colors hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 sm:left-6"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden />
              </button>
            )}

            <figure className="w-[min(80vw,calc(80vh_-_4rem),800px)]">
              <div className="relative aspect-square w-full">
                <Image
                  src={current.src}
                  alt={current.alt}
                  fill
                  sizes="(min-width: 1000px) 800px, 80vw"
                  className="object-contain"
                />
              </div>
              {showCaptions && (
                <figcaption className="mt-3 text-center text-sm font-medium text-black/80">{current.alt}</figcaption>
              )}
            </figure>

            {count > 1 && (
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photograph"
                className="absolute right-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-black ring-1 ring-black/10 shadow-sm transition-colors hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 sm:right-6"
              >
                <ChevronRight className="h-6 w-6" aria-hidden />
              </button>
            )}
        </div>
      )}
    </section>
  );
}
