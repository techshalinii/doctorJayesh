import type { Metadata } from "next";
import { StoredJsonLd } from "@/components/seo/json-ld";
import { getDocByFileSlug, metadataFromDoc } from "@/lib/content";
import { TreatmentPage } from "@/components/pages/treatment-page";
import { brainSurgery } from "@/lib/treatments";

const doc = getDocByFileSlug("brain-surgery")!;

export const metadata: Metadata = metadataFromDoc(doc);

export default function BrainSurgeryPage() {
  return (
    <>
      <StoredJsonLd schema={doc.schema} />
      <TreatmentPage data={brainSurgery} />
    </>
  );
}
