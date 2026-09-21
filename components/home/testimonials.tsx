import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { RatingBadge, ReviewCard } from "@/components/testimonials/review-card";
import { googleReviews, doctor } from "@/lib/data";

/**
 * Section 13 of the live WordPress homepage — patient reviews.
 *
 * Was a dark navy-950 band carrying one featured review above a row of three. Now a light
 * editorial grid on the same warm surface the rest of the page uses. The four reviews shown
 * are the same four as before — `googleReviews[0..3]`, the old featured entry plus its three
 * supporting cards — and all nine still live unabridged at /testimonials/, linked from the
 * header.
 *
 * The old supporting cards were `line-clamp-6`. That clamp is gone rather than kept: with
 * `items-start` each card takes its natural height, so the longer reviews are now shown in
 * full instead of visually cut off.
 *
 * No Review or AggregateRating JSON-LD is emitted for these — see components/seo/json-ld.tsx
 * for why self-serving review markup on a Physician entity is a manual-action risk.
 */
export function Testimonials() {
  const cards = googleReviews.slice(0, 4);

  return (
    <section className="border-y border-border bg-surface/50 py-14 lg:py-18" id="stories">
      <Container>
        {/* Label left, CTA right, heading beneath — the CTA sits on the label's line at md+
            so the heading gets the full measure to itself. */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
              <span className="font-display normal-case tracking-normal text-navy-900/40 dark:text-white/40">08</span>
              {/* "Reviews" is the live WordPress section 13 heading. It is a one-word generic
                  label, so it rides the eyebrow rather than displacing the h2 below. */}
              <span className="h-px w-8 bg-teal-600/50" /> Reviews
            </span>
            <h2 className="mt-5 max-w-2xl font-display text-[2rem] font-medium leading-[1.12] tracking-[-0.01em] text-navy-900 sm:text-[2.6rem] dark:text-white">
              Real journeys. Real recoveries.
            </h2>
          </div>

          <Link
            href="/testimonials/"
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-navy-800 md:mt-1.5 dark:text-white/80"
          >
            All Google reviews
            <ArrowRight className="h-4 w-4 text-teal-600 transition-transform group-hover:translate-x-1 dark:text-teal-400" />
          </Link>
        </div>

        {/* Same two figures the old closing line carried (5.0 across 99), as a badge. */}
        <div className="mt-10 flex justify-center">
          <RatingBadge rating={doctor.rating} count={doctor.reviews} />
        </div>

        {/* items-start so a long review grows its own card instead of stretching all four. */}
        <div className="mt-12 grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((r, i) => (
            <ReviewCard key={`${r.name}-${i}`} review={r} index={i} />
          ))}
        </div>
      </Container>
    </section>
  );
}
