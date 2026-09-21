import type { Metadata } from "next";
import type { BlogRow } from "@/lib/cms/types";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";
import { doctor } from "@/lib/data";

/**
 * Next metadata for a CMS post.
 *
 * Unlike `metadataFromDoc()` in lib/content.ts — which replays a stored WordPress
 * capture verbatim and invents nothing — a CMS post has no capture, so every tag here
 * is generated from the author's own fields.
 *
 * `seo_title` and `meta_description` are used when set and fallen back to `title` and
 * `excerpt` only when empty, so a post is never shipped with no description at all.
 * That fallback is a safety net, not a substitute: the SEO score in the editor exists
 * to make sure the real fields get written.
 *
 * `title.absolute` bypasses the root layout's `%s · Dr. Jayesh Sardhara` template, so
 * the author's SEO title is emitted exactly as typed — the whole point of having the
 * field is that its length was chosen against Google's truncation point.
 */
export function cmsMetadata(post: BlogRow): Metadata {
  const canonical = post.canonical_url || canonicalUrl(`/${post.slug}/`);
  const title = post.seo_title || post.title;
  const description = post.meta_description || post.excerpt;

  const ogImage = post.og_image || post.featured_image;
  const twitterImage = post.twitter_image || ogImage;

  return {
    title: { absolute: title },
    description: description || null,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description,
      siteName: doctor.name,
      locale: "en_US",
      ...(post.publish_at ? { publishedTime: post.publish_at } : {}),
      ...(post.updated_at ? { modifiedTime: post.updated_at } : {}),
      images: [ogImage ? { url: ogImage, alt: post.image_alt || post.title } : OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [twitterImage || OG_IMAGE.url],
    },
  };
}
