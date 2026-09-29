import { doctor, siteUrl, locations, socialLinks } from "@/lib/data";
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
    sameAs: socialLinks.map((s) => s.href),
    telephone: doctor.phoneRaw,
    email: doctor.email,
    priceRange: "₹₹₹",
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
