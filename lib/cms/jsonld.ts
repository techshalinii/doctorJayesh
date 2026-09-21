import type { BlogRow } from "@/lib/cms/types";
import { doctor, siteUrl } from "@/lib/data";

/**
 * Structured data for a CMS post.
 *
 * Generated, unlike the migrated posts — those replay a graph captured byte-for-byte
 * from WordPress (see components/seo/json-ld.tsx) and must not be regenerated. A CMS
 * post has no capture behind it, so it gets a fresh graph built to match what the
 * page actually renders: a BlogPosting, the breadcrumb trail the article shows, and
 * an FAQPage only when the post really has FAQ items on it.
 */

export function cmsPostJsonLd(post: BlogRow, canonical: string): string {
  const image = post.og_image || post.featured_image;
  const published = post.publish_at ?? post.published_at ?? undefined;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "BlogPosting",
      "@id": `${canonical}#blogposting`,
      headline: post.seo_title || post.title,
      name: post.title,
      description: post.meta_description || post.excerpt,
      inLanguage: "en",
      mainEntityOfPage: { "@id": `${canonical}#webpage` },
      ...(image ? { image: { "@type": "ImageObject", url: absolute(image) } } : {}),
      ...(published ? { datePublished: published } : {}),
      dateModified: post.updated_at || published,
      author: { "@type": "Person", name: post.author || doctor.name },
      publisher: { "@id": `${siteUrl}/#organization` },
      ...(post.category ? { articleSection: post.category } : {}),
      ...(post.tags.length ? { keywords: post.tags.join(", ") } : {}),
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumblist`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog/` },
        { "@type": "ListItem", position: 3, name: post.title },
      ],
    },
    {
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: post.seo_title || post.title,
      description: post.meta_description || post.excerpt,
      inLanguage: "en",
      isPartOf: { "@id": `${siteUrl}/#website` },
      breadcrumb: { "@id": `${canonical}#breadcrumblist` },
    },
    { "@type": "Organization", "@id": `${siteUrl}/#organization`, name: doctor.name, url: `${siteUrl}/` },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: `${siteUrl}/`,
      name: doctor.name,
      inLanguage: "en",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ];

  // Only when the questions are actually on the page. FAQPage markup describing
  // content a visitor cannot see is precisely what earns a manual action.
  if (post.faq.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonical}#faq`,
      mainEntity: post.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

function absolute(src: string): string {
  return /^https?:/i.test(src) ? src : `${siteUrl}${src.startsWith("/") ? "" : "/"}${src}`;
}
