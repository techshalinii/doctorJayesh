import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The card photo used by <Conditions> and <Expertise>.
 *
 * Both sections share it so the two grids read as one set: the same warm grade, the same
 * maroon wash, the same hover push. Four condition photos and six expertise photos come
 * from different shoots, and without a common treatment they look like a stock grab-bag
 * against this cream/maroon palette.
 *
 * Expects to sit inside an element carrying `group` — the hover and focus transitions are
 * driven by the whole card, not by the image.
 */

const RATIO = {
  "4/3": { box: "aspect-[4/3]", w: 1200, h: 900 },
  "3/2": { box: "aspect-[3/2]", w: 1200, h: 800 },
} as const;

export function CardImage({
  src,
  alt,
  ratio,
  sizes,
  className,
}: {
  src: string;
  alt: string;
  ratio: keyof typeof RATIO;
  sizes: string;
  className?: string;
}) {
  const r = RATIO[ratio];

  return (
    /* The ratio lives on this wrapper, so the row's height is reserved before the photo
       arrives and nothing below it shifts. overflow-hidden is what crops the hover scale. */
    <div className={cn("relative overflow-hidden rounded-[4px] bg-surface-2", r.box, className)}>
      <Image
        src={src}
        alt={alt}
        width={r.w}
        height={r.h}
        loading="lazy"
        sizes={sizes}
        className="h-full w-full object-cover [filter:saturate(0.85)_sepia(0.12)] transition-transform duration-[600ms] ease-out group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
      />
      {/* Maroon wash, lifted on hover so the photo comes forward. A span rather than an
          ::after because the colour is a theme token, not a literal. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-navy-900/8 transition-opacity duration-[600ms] ease-out group-hover:opacity-0 group-focus-visible:opacity-0"
      />
    </div>
  );
}
