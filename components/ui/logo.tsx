import Image from "next/image";
import { doctor } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * The practice mark, rendered from `public/logo.png`.
 *
 * Single source of truth for the logo: the navbar and the footer both render this, so a
 * future artwork change is one file swap plus the two constants below — no component edits.
 *
 * The asset is a 192x192 square carrying its own maroon field (#8F1B1B) and its own
 * rounded corners, baked in. Width is DERIVED from the requested height rather than being
 * passed in independently: callers pick a height to match the layout and the aspect ratio
 * is preserved for them, so the mark can never be stretched or squashed by a caller.
 *
 * Deliberately NO `sizes` prop. Passing `sizes` puts next/image into responsive mode: it
 * builds the srcset from `deviceSizes` (640…3840) instead of `imageSizes` (16…384) and
 * points the `src` fallback at w=3840 — i.e. the 192px artwork upscaled to 3840px to fill
 * a 40px box, which is what made the mark render soft. Without it, a fixed width/height
 * image emits a compact 1x/2x srcset, which is exactly what this is.
 *
 * Deliberately no `rounded-*` here. The artwork already defines its corner radius, and a
 * CSS radius on top would clip the maroon field — cropping the logo rather than framing it.
 */

/**
 * Intrinsic pixel size of public/logo.png. Update together with the asset.
 *
 * These MUST track the file: the rendered box is computed from them, so a mismatch between
 * the constants and the artwork is exactly how a logo gets silently distorted.
 */
const LOGO_W = 192;
const LOGO_H = 192;

export function Logo({
  height = 40,
  className,
  priority = false,
}: {
  /** Rendered height in px; width follows from the artwork's aspect ratio. */
  height?: number;
  className?: string;
  /** Set on the navbar so the mark is not lazy-loaded above the fold. */
  priority?: boolean;
}) {
  const width = Math.round((height * LOGO_W) / LOGO_H);

  return (
    <Image
      src="/logo.png"
      alt={doctor.name}
      width={width}
      height={height}
      priority={priority}
      className={cn("shrink-0 object-contain", className)}
      style={{ width, height }}
    />
  );
}
