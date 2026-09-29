import { GoogleG, RatingBadge, ReviewCard } from "@/components/testimonials/review-card";
import { googleReviews, doctor } from "@/lib/data";

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

      <div className="mt-10 gap-5 [column-fill:_balance] sm:columns-2 lg:columns-3 xl:columns-4">
        {googleReviews.map((r, i) => (
          <ReviewCard key={`${r.name}-${i}`} review={r} index={i} className="mb-5" />
        ))}
      </div>
    </div>
  );
}
