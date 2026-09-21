import { GoogleG, RatingBadge, ReviewCard } from "@/components/testimonials/review-card";
import { googleReviews, doctor } from "@/lib/data";

/**
 * The full review wall on /testimonials/.
 *
 * All nine reviews, verbatim and unabridged, in the order lib/data.ts holds them. The card,
 * the Google mark, the stars and the rating badge now come from ./review-card so this page
 * and the homepage section render the same object.
 *
 * The wall is CSS columns rather than a grid: reviews vary from ~200 to ~700 characters, and
 * columns let each card keep its natural height and pack tightly instead of every card in a
 * row stretching to match the longest.
 */
export function GoogleReviews() {
  const mapsUrl = "https://www.google.com/maps/search/Dr+Jayesh+Sardhara+neurosurgeon+reviews";

  return (
    <div>
      <div className="flex flex-col items-center gap-5">
        <RatingBadge rating={doctor.rating} count={doctor.reviews} />

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-800 transition-colors hover:border-teal-500 hover:text-teal-700 dark:border-white/15 dark:text-white/85"
        >
          <GoogleG className="h-4 w-4" /> Review us on Google
        </a>
      </div>

      {/* Column count rises to four on desktop; `break-inside-avoid` on the card keeps a
          review from being split across two columns. */}
      <div className="mt-10 gap-5 [column-fill:_balance] sm:columns-2 lg:columns-3 xl:columns-4">
        {googleReviews.map((r, i) => (
          <ReviewCard key={`${r.name}-${i}`} review={r} index={i} className="mb-5" />
        ))}
      </div>
    </div>
  );
}
