import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { BreadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { CtaBand } from "@/components/ui/cta-band";
import { GoogleReviews } from "@/components/testimonials/google-reviews";
import { doctor } from "@/lib/data";

export const metadata: Metadata = pageMetadata({
  path: "/testimonials",
  title: "Patient Testimonials",
  description: `Patient reviews for ${doctor.name} — rated ${doctor.rating.toFixed(1)}★ across ${doctor.reviews} Google reviews.`,
});

export default function TestimonialsPage() {
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
      />

      <section className="border-t border-border bg-surface/50 py-14 lg:py-18">
        <Container>
          <GoogleReviews />
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
