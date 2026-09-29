import type { Metadata } from "next";
import { JsonLd, StoredJsonLd } from "@/components/seo/json-ld";
import { getDocByFileSlug, metadataFromDoc } from "@/lib/content";
import { Hero } from "@/components/home/hero";
import { About } from "@/components/home/about";
import { Expertise } from "@/components/home/expertise";
import { WhyChoose } from "@/components/home/why-choose";
import { Conditions } from "@/components/home/conditions";
import { Testimonials } from "@/components/home/testimonials";
import { Awards } from "@/components/home/awards";
import { Resources } from "@/components/home/resources";
import { Videos } from "@/components/home/videos";
import { Faqs } from "@/components/home/faqs";
import { BookAppointment } from "@/components/home/book-appointment";
import { FortisInstitute } from "@/components/home/fortis-institute";
import { AppointmentCTA } from "@/components/home/appointment-cta";
import { AwardsGallery } from "@/components/awards-gallery";

const doc = getDocByFileSlug("index")!;

export const metadata: Metadata = metadataFromDoc(doc);
export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <StoredJsonLd schema={doc.schema} />
      <JsonLd />
      <Hero />
      <FortisInstitute />
      <BookAppointment />
      <AwardsGallery className="border-y border-border bg-surface/50 py-12 lg:py-14" />
      <Conditions />
      <Expertise />
      <WhyChoose />
      <Awards />
      <Videos />
      <Resources />
      <Testimonials />
      <AppointmentCTA />
      <Faqs />
    </>
  );
}
