import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GoogleReview } from "@/lib/data";

/**
 * Shared presentation for the Google reviews.
 *
 * The homepage section and /testimonials/ rendered near-identical cards and two byte-for-byte
 * copies of the Google mark; they now draw from here, so the two read as one system. Nothing
 * about the data changed — both still map over `googleReviews` from lib/data.ts.
 *
 * No Review or AggregateRating JSON-LD is emitted for any of this — see
 * components/seo/json-ld.tsx for why self-serving review markup on a Physician entity is a
 * manual-action risk.
 */

/** Google's four-colour mark. Literal brand hexes, deliberately outside the theme scale. */
export function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export function Stars({ n, className }: { n: number; className?: string }) {
  return (
    <span className={cn("flex gap-0.5 text-gold-500", className)} aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("h-4 w-4", i < n ? "fill-current" : "fill-none opacity-30")} />
      ))}
    </span>
  );
}

/**
 * Google mark + rating + stars + review count, as one centred pill.
 *
 * Both numbers are passed in from `doctor` (rating 5.0, reviews 99) and only formatted —
 * `toFixed(1)` is the same call the previous markup made.
 */
export function RatingBadge({ rating, count, className }: { rating: number; count: number; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-full border border-border bg-background px-6 py-3 shadow-card dark:bg-white/[0.04]",
        className,
      )}
    >
      <GoogleG className="h-5 w-5 shrink-0" />
      <span className="font-display text-xl font-medium leading-none text-navy-900 dark:text-white">
        {rating.toFixed(1)}
      </span>
      <Stars n={5} />
      <span className="text-sm text-muted">Based on {count} reviews</span>
    </div>
  );
}

/** Avatar tints. The reviews carry no photo, so the initial sits on a rotating brand tone. */
const AVATAR = ["#a63a35", "#8a2f2c", "#cfa451", "#6a2422", "#b5463f", "#9c332e"];

export function ReviewCard({
  review,
  index,
  className,
}: {
  review: GoogleReview;
  index: number;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        // break-inside-avoid matters only in the column layout on /testimonials/; it is
        // inert in the homepage grid, so one card serves both.
        "flex break-inside-avoid flex-col rounded-2xl border border-border bg-background p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-soft dark:bg-white/[0.03] dark:hover:border-white/20",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Stars n={review.rating} />
        <GoogleG className="h-5 w-5 shrink-0" />
      </div>

      {/* Verbatim, unabridged and unclamped — the review text is never truncated. */}
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-navy-800/90 dark:text-white/80">
        {review.text}
      </blockquote>

      <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        <span
          aria-hidden
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: AVATAR[index % AVATAR.length] }}
        >
          {review.name.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-navy-900 dark:text-white">{review.name}</span>
          <span className="block text-xs text-muted">{review.date}</span>
        </span>
      </figcaption>
    </figure>
  );
}
