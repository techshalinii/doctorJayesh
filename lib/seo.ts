import type { Metadata } from "next";
import { doctor, siteUrl } from "@/lib/data";

export const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: `${doctor.name} — ${doctor.title}`,
} as const;

export function canonicalUrl(pathname: string): string {
  const path = `/${pathname}`
    .split("?")[0]
    .split("#")[0]
    .replace(/\/+/g, "/");
  return `${siteUrl}${path.endsWith("/") ? path : `${path}/`}`;
}

export function pageMetadata({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  const url = canonicalUrl(path);
  const fullTitle = `${title} · ${doctor.name}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: fullTitle,
      description,
      siteName: doctor.name,
      locale: "en_US",
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [OG_IMAGE.url] },
  };
}
