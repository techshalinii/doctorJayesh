import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { BreadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { Star } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { CtaBand } from "@/components/ui/cta-band";
import { GoogleReviews } from "@/components/testimonials/google-reviews";
import { googleReviews, doctor } from "@/lib/data";

export const metadata: Metadata = pageMetadata({
  path: "/testimonials",
  title: "Patient Testimonials",
  description: `Patient reviews for ${doctor.name} — rated ${doctor.rating.toFixed(1)}★ across ${doctor.reviews} Google reviews.`,
});

export default function TestimonialsPage() {
  const featured = googleReviews[0];

  return (
    <>
      <JsonLd />
      <BreadcrumbJsonLd
        trail={[
          { name: "Home", path: "/" },
          { name: "Testimonials", path: "/testimonials" },
        ]}
      />
      <PageHero
        eyebrow="Patient Stories"
        breadcrumb="Testimonials"
        title="Real journeys, real recoveries"
        description={`Behind our ${doctor.rating.toFixed(1)}★ rating from ${doctor.reviews} Google reviews are thousands of people who got their lives back.`}
      />

      <section className="py-14 lg:py-18">
        <Container>
          <Reveal>
            <span className="flex gap-1 text-gold-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </span>
            <blockquote className="mt-8 max-w-5xl font-display text-2xl font-medium leading-[1.4] tracking-[-0.01em] text-navy-900 sm:text-[2.1rem] sm:leading-[1.35] dark:text-white">
              &ldquo;{featured.text}&rdquo;
            </blockquote>
            <figcaption className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-navy-900/12 pt-6 text-sm dark:border-white/12">
              <span className="font-semibold text-navy-900 dark:text-white">{featured.name}</span>
              <span className="text-navy-300 dark:text-white/30">·</span>
              <span className="text-muted">Verified Google review · {featured.date}</span>
            </figcaption>
          </Reveal>
        </Container>
      </section>

      <section className="border-t border-border bg-surface/50 py-14 lg:py-18">
        <Container>
          <span className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">
            <span className="h-px w-8 bg-teal-600/50" /> What Patients Say
          </span>
          <h2 className="mt-5 mb-10 font-display text-[2rem] font-medium leading-tight text-navy-900 dark:text-white">
            Reviews from Google
          </h2>
          <GoogleReviews />
          <p className="mt-10 text-xs text-muted">
            Reviews shown are real, published verbatim from the practice&apos;s Google Business profile.
          </p>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
