import { doctor, siteUrl, locations } from "@/lib/data";
import { canonicalUrl } from "@/lib/seo";

export function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: doctor.name,
    honorificSuffix: "MCh (Neurosurgery)",
    medicalSpecialty: ["Neurosurgery", "Spine Surgery"],
    description: doctor.intro,
    url: siteUrl,
    telephone: doctor.phoneRaw,
    email: doctor.email,
    priceRange: "₹₹₹",
    // No aggregateRating / Review node, deliberately. Self-serving review markup about
    // the practice, published by the practice, is against Google's structured-data policy
    // for local businesses and is a manual-action risk on a medical site. It was also
    // never on the live site: 0 of the 203 WordPress captures emitted aggregateRating,
    // so omitting it restores parity rather than dropping anything. Decision 2026-09-04.
    address: locations.map((l) => ({
      "@type": "PostalAddress",
      name: l.name,
      streetAddress: l.address,
      addressLocality: "Mumbai",
      addressRegion: "Maharashtra",
      addressCountry: "IN",
    })),
    availableService: [
      "Brain Tumor Surgery",
      "Spine Surgery",
      "Endoscopic Skull Base Surgery",
      "Minimally Invasive Spine Surgery",
      "Deep Brain Stimulation",
    ].map((s) => ({ "@type": "MedicalProcedure", name: s })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * BreadcrumbList for the hand-built routes.
 *
 * ONLY for routes with no WordPress capture. The 197 migrated pages already carry a
 * BreadcrumbList inside their stored graph, and emitting a second one would put two
 * conflicting trails on the same document.
 *
 * `trail` must mirror what PageHero actually renders — that component shows
 * `Home / <breadcrumb>`, so the trail passed in is the same two levels. Schema that
 * claims a hierarchy the page does not display is exactly what Google penalises.
 */
export function BreadcrumbJsonLd({ trail }: { trail: { name: string; path: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: canonicalUrl(c.path),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Emits the JSON-LD captured from the live WordPress site, byte-for-byte.
 *
 * Migrated pages render THIS instead of <JsonLd /> above. The two are never merged or
 * deduped: the stored graph is what the page is already indexed with, and the generated
 * one is a different (richer) shape for the new template-only routes.
 *
 * `/` and `/about/` are the two exceptions — they render both, as two separate scripts.
 * The migration brief requires a Physician entity on those pages and the WordPress
 * capture has none (its graph is BreadcrumbList + Organization + WebPage + WebSite, plus
 * FAQPage on `/`). Two top-level blocks with distinct @types is well-formed and is how
 * the additional entity is added without editing the stored capture.
 */
export function StoredJsonLd({ schema }: { schema: string[] }) {
  return (
    <>
      {schema.map((json, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: json }}
        />
      ))}
    </>
  );
}
