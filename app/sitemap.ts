import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/data";
import { getAllDocs } from "@/lib/content";
import { getCmsSitemapEntries } from "@/lib/cms/public";

const TEMPLATE_ONLY_ROUTES = ["/conditions/", "/testimonials/", "/appointment/"] as const;
const TEMPLATE_ONLY_PUBLISHED = new Date("2026-09-04");

const CONTACT_ROUTE = "/contact-us/";
const CONTACT_MODIFIED = new Date("2025-09-06T13:10:55+05:30");

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const migrated = getAllDocs()
    .filter((doc) => !doc.noindex)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((doc) => ({
      url: `${siteUrl}${doc.slug}`,
      lastModified: new Date((doc.modified ?? doc.date ?? "").replace(" ", "T") || Date.now()),
    }));

  const templateOnly = TEMPLATE_ONLY_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: TEMPLATE_ONLY_PUBLISHED,
  }));

  const cms = (await getCmsSitemapEntries()).map((entry) => ({
    url: `${siteUrl}${entry.url}`,
    lastModified: entry.lastModified,
  }));

  return [
    ...migrated,
    ...cms,
    ...templateOnly,
    { url: `${siteUrl}${CONTACT_ROUTE}`, lastModified: CONTACT_MODIFIED },
  ];
}
