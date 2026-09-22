"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { usePresence } from "@/components/ui/presence";
import { useScrollLock } from "@/lib/scroll-lock";
import { awardsGallery } from "@/lib/data";

/**
 * The Elementor image carousel of award photographs from the live WordPress homepage
 * (section 5). Rendered as a static responsive grid: same images, no carousel dependency.
 *
 * Renders on `/` — where the live site had it, immediately after the appointment form —
 * and on /news-awards/. It was moved off the homepage in the 2026-09-04 density pass as
 * a third awards touchpoint; restored 2026-09-04 because home-content.json marks it
 * visible and the brief is to reproduce the live page. The images are unchanged.
 *
 * Each tile opens the full 1080x1080 original in a lightbox. That is the only reason this
 * is a client component — the grid itself is static. The overlay is a sibling of the grid
 * rather than a child of a tile on purpose: <Reveal> animates `transform`, and a
 * transformed ancestor makes `position: fixed` resolve against that ancestor instead of
 * the viewport, which would trap the overlay inside a 200px tile.
 */
export function AwardsGallery({ className }: { className?: string }) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const triggers = useRef<Array<HTMLButtonElement | null>>([]);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastOpened = useRef<number | null>(null);
  const wasOpen = useRef(false);

  const count = awardsGallery.length;
  const isOpen = openAt !== null;
  /**
   * `openAt` goes null the moment the dialog closes, but the element stays mounted for
   * the fade-out — so the photo to display is tracked separately and simply stops being
   * updated. Derived during render, not in an effect.
   */
  const [shownAt, setShownAt] = useState(0);
  if (openAt !== null && openAt !== shownAt) setShownAt(openAt);
  const current = awardsGallery[shownAt];
  const dialogRef = useRef<HTMLDivElement>(null);
  const dialogRendered = usePresence(isOpen, dialogRef, { opacity: 0 }, { opacity: 1 }, 0.2);
  // Shared lock: also stops Lenis, which the previous inline overflow rule did not.
  useScrollLock(isOpen);

  const close = useCallback(() => setOpenAt(null), []);
  const step = useCallback(
    (delta: number) => setOpenAt((i) => (i === null ? i : (i + delta + count) % count)),
    [count],
  );

  /** Esc to dismiss, arrows to page, and Tab kept inside the dialog while it is up. */
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

  /**
   * Focus into the dialog on open, and back onto the tile that opened it on close.
   *
   * Gated on the open/closed transition, not on `openAt` itself: paging with the arrows
   * changes the index while the dialog stays up, and pulling focus back to the close
   * button each time would yank it off Next mid-click.
   */
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
    <section className={className ?? "pb-12 lg:pb-14"} aria-label="Award photographs">
      <Container>
        <span className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
          <span className="h-px w-8 bg-teal-600/50" /> Gallery
        </span>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {awardsGallery.map((img, i) => (
            <Reveal key={img.src} delay={(i % 4) * 0.05}>
              <button
                type="button"
                ref={(el) => {
                  triggers.current[i] = el;
                }}
                onClick={() => setOpenAt(i)}
                aria-label={`View larger: ${img.alt}`}
                className="group relative block aspect-square w-full cursor-pointer overflow-hidden border border-navy-900/10 bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-white/10"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 1024px) 22vw, 45vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </button>
            </Reveal>
          ))}
        </div>
      </Container>

      {dialogRendered && (
        <div
          ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Award photograph ${(openAt ?? 0) + 1} of ${count}`}
            /* Only a click that lands on the backdrop itself dismisses — a click on the
               photograph or a control reports that element as the target, not this one. */
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

            {/* One `min()` on the width sizes the whole thing, because the box is square:
                aspect-square derives the height from it, so capping the width at 80vw and
                at (80vh - caption) caps the height by the same stroke. Expressing it as a
                max-width plus a max-height instead would let the two clamp independently
                and the frame would stop being square.

                The 4rem term reserves the caption — mt-3 plus up to two wrapped lines of
                text-sm — so that the figure as a whole, not just the photograph, stays
                inside 80vh. 800px is the ceiling on large monitors; the source files are
                1080px, so there is nothing to gain past that. */}
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
              <figcaption className="mt-3 text-center text-sm font-medium text-black/80">{current.alt}</figcaption>
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
