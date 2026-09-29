import type { Metadata } from "next";
import { StoredJsonLd } from "@/components/seo/json-ld";
import { getDocByFileSlug, metadataFromDoc } from "@/lib/content";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { CtaBand } from "@/components/ui/cta-band";
import { FellowsGallery } from "@/components/fellowship/fellows-gallery";

const doc = getDocByFileSlug("fellowship")!;

export const metadata: Metadata = metadataFromDoc(doc);

export default function FellowshipPage() {
  return (
    <>
      <StoredJsonLd schema={doc.schema} />

      <PageHero
        eyebrow="Fellowship"
        breadcrumb="Fellowship"
        title={<>Train with One of India&rsquo;s Leading Spine Surgeons</>}
      />

      <section className="py-14 lg:py-18">
        <Container className="grid gap-6 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <p className="text-lg leading-relaxed text-foreground/85">
              Advance your expertise in Minimally Invasive &amp; Endoscopic Spine Surgery through structured fellowship
              programs designed for young neurosurgeons and orthopaedic spine surgeons. Gain hands-on surgical exposure,
              comprehensive clinical training, academic mentorship, and real-world experience under the guidance of Dr.
              Jayesh Sardhara.
            </p>
          </Reveal>
          <Reveal delay={0.08} className="lg:col-span-5">
            <p className="border-l-2 border-teal-500/60 pl-6 text-lg leading-relaxed text-muted">
              Whether you&rsquo;re looking for a focused observership or an immersive surgical fellowship, our programs
              are designed to accelerate your career in modern spine surgery.
            </p>
          </Reveal>
        </Container>
      </section>

      <FellowsGallery />
      <CtaBand />
    </>
  );
}
