"use client";

import { useCallback, useEffect, useRef, useState, type FocusEvent } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function useSnapCarousel(
  count: number,
  { autoplay = 0, paused = false }: { autoplay?: number; paused?: boolean } = {},
) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [pages, setPages] = useState(count);
  const [held, setHeld] = useState(false);
  const [stopped, setStopped] = useState(false);

  const measure = useCallback(() => {
    const el = track.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (!el || !first) return;

    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = first.offsetWidth + gap;
    const visible = Math.max(1, Math.round((el.clientWidth + gap) / step));
    const lastPage = Math.max(0, count - visible);
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;

    setPages(lastPage + 1);
    setActive(atEnd ? lastPage : Math.min(lastPage, Math.round(el.scrollLeft / step)));
  }, [count]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;

    let frame = 0;
    const onChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();
    el.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("resize", onChange);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, [measure]);

  const goTo = useCallback(
    (index: number) => {
      const el = track.current;
      const first = el?.children[0] as HTMLElement | undefined;
      const target = el?.children[Math.max(0, Math.min(index, count - 1))] as HTMLElement | undefined;
      if (!el || !first || !target) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollTo({ left: target.offsetLeft - first.offsetLeft, behavior: reduce ? "auto" : "smooth" });
    },
    [count],
  );

  const autoplaying = autoplay > 0 && !stopped;

  useEffect(() => {
    if (!autoplaying || paused || held || pages <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setTimeout(() => {
      if (document.hidden) return;
      goTo(active >= pages - 1 ? 0 : active + 1);
    }, autoplay);
    return () => window.clearTimeout(id);
  }, [autoplaying, autoplay, paused, held, pages, active, goTo]);

  const holdProps = {
    onPointerEnter: (e: { pointerType: string }) => {
      if (e.pointerType === "mouse") setHeld(true);
    },
    onPointerLeave: (e: { pointerType: string }) => {
      if (e.pointerType === "mouse") setHeld(false);
    },
    onTouchStart: () => setHeld(true),
    onTouchEnd: () => setHeld(false),
    onFocus: () => setHeld(true),
    onBlur: (e: FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false);
    },
  };

  return {
    track,
    active,
    pages,
    goTo,
    holdProps,
    autoplay: autoplay > 0 ? { playing: !stopped, toggle: () => setStopped((s) => !s) } : null,
  };
}

const pill =
  "inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-navy-900 transition-colors hover:bg-navy-900 hover:text-white disabled:pointer-events-none disabled:opacity-40 dark:text-white dark:hover:bg-white dark:hover:text-navy-950";

export function CarouselControls({
  active,
  pages,
  onGo,
  noun = "slide",
  autoplay,
}: {
  active: number;
  pages: number;
  onGo: (index: number) => void;
  noun?: string;
  autoplay?: { playing: boolean; toggle: () => void } | null;
}) {
  if (pages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => onGo(active - 1)}
        disabled={active === 0}
        aria-label={`Previous ${noun}`}
        className={pill}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>

      <div className="flex items-center gap-2">
        {Array.from({ length: pages }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onGo(i)}
            aria-label={`Go to ${noun} ${i + 1}`}
            aria-current={i === active ? "true" : undefined}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === active ? "w-6 bg-navy-900 dark:bg-white" : "w-2 bg-navy-900/20 hover:bg-navy-900/40 dark:bg-white/25",
            )}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => onGo(active + 1)}
        disabled={active >= pages - 1}
        aria-label={`Next ${noun}`}
        className={pill}
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>

      {autoplay && (
        <button
          type="button"
          onClick={autoplay.toggle}
          aria-label={autoplay.playing ? "Pause automatic scrolling" : "Play automatic scrolling"}
          className={cn(pill, "h-8 w-8")}
        >
          {autoplay.playing ? <Pause className="h-3.5 w-3.5" aria-hidden /> : <Play className="h-3.5 w-3.5" aria-hidden />}
        </button>
      )}
    </div>
  );
}
