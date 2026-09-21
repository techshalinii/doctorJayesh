import type { Metadata } from "next";
import { StoredJsonLd } from "@/components/seo/json-ld";
import { getDocByFileSlug, metadataFromDoc } from "@/lib/content";
import { TreatmentPage } from "@/components/pages/treatment-page";
import { spineSurgery } from "@/lib/treatments";

const doc = getDocByFileSlug("spine-surgery")!;

export const metadata: Metadata = metadataFromDoc(doc);

export default function SpineSurgeryPage() {
  return (
    <>
      <StoredJsonLd schema={doc.schema} />
      <TreatmentPage data={spineSurgery} />
    </>
  );
}
