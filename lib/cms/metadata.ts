import type { Metadata } from "next";
import type { BlogRow } from "@/lib/cms/types";
import { canonicalUrl, OG_IMAGE } from "@/lib/seo";
import { doctor } from "@/lib/data";

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
