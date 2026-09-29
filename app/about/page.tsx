import type { Metadata } from "next";
import { JsonLd, StoredJsonLd } from "@/components/seo/json-ld";
import { getDocByFileSlug, metadataFromDoc } from "@/lib/content";
import { PageHero } from "@/components/ui/page-hero";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/ui/cta-band";
import { AboutBiography } from "@/components/about/biography";
import { AboutLeadership } from "@/components/about/leadership";
import { AboutExpertise } from "@/components/about/expertise";
import { AboutAwards } from "@/components/about/awards";
import { AboutVideoAndCertificate } from "@/components/about/video-and-certificate";
import { doctor, SURGERIES_TOTAL } from "@/lib/data";

const doc = getDocByFileSlug("about")!;

export const metadata: Metadata = metadataFromDoc(doc);

export default function AboutPage() {
  return (
    <>
      <StoredJsonLd schema={doc.schema} />
      <JsonLd />
      <PageHero
        eyebrow="About Dr. Jayesh Sardhara"
        breadcrumb="About"
        title={<>Dr Jayesh Sardhara&rsquo;s Neuro Clinic</>}
        description={`${doctor.credentials} · ${doctor.role}. Over ${doctor.experienceYears} years of experience and ${SURGERIES_TOTAL} brain and spine procedures.`}
      >
        <div className="flex flex-wrap gap-4">
          <Button href="/appointment/">Book a Consultation</Button>
          <Button href="/news-awards/" variant="secondary">View Awards</Button>
        </div>
      </PageHero>

      <AboutBiography />
      <AboutVideoAndCertificate />
      <AboutLeadership />
      <AboutExpertise />
      <AboutAwards />
      

      <CtaBand />
    </>
  );
}
