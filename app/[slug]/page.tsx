import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { CtaBand } from "@/components/ui/cta-band";
import { PageHero } from "@/components/ui/page-hero";
import { StoredJsonLd } from "@/components/seo/json-ld";
import { videos } from "@/lib/data";
import { VideoEmbed } from "@/components/ui/video-embed";
import {
  getDocByFileSlug,
  getDynamicRootDocs,
  getPosts,
  metadataFromDoc,
  renderMarkdown,
  stripLeadingH1,
  toPostSummary,
} from "@/lib/content";
import { CmsArticle } from "@/components/blog/cms-article";
import { ArticleLayout } from "@/components/blog/article-layout";
import {
  getCmsPostForRoute,
  getCmsRedirectTarget,
  getCmsSlugs,
  getRelatedFor,
} from "@/lib/cms/public";
import { cmsMetadata } from "@/lib/cms/metadata";
import { cmsPostJsonLd } from "@/lib/cms/jsonld";
import { canonicalUrl } from "@/lib/seo";

export const dynamicParams = true;

export const revalidate = 60;

export async function generateStaticParams() {
  const migrated = getDynamicRootDocs().map((d) => ({ slug: d.fileSlug }));
  const cms = (await getCmsSlugs()).map((slug) => ({ slug }));
  const seen = new Set(migrated.map((m) => m.slug));
  return [...migrated, ...cms.filter((c) => !seen.has(c.slug))];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const doc = getDocByFileSlug(slug);
  if (doc) return metadataFromDoc(doc);

  const post = await getCmsPostForRoute(slug);
  return post ? cmsMetadata(post) : {};
}

export default async function MigratedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getDocByFileSlug(slug);

  if (!doc) {
    const post = await getCmsPostForRoute(slug);
    if (!post) {
      const movedTo = await getCmsRedirectTarget(slug);
      if (movedTo) permanentRedirect(`/${movedTo}/`);
      notFound();
    }

    const canonical = post.canonical_url || canonicalUrl(`/${post.slug}/`);
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: cmsPostJsonLd(post, canonical) }}
        />
        <CmsArticle post={post} related={await getRelatedFor(post)} />
      </>
    );
  }

  if (doc.postType === "post_tag") notFound();

  const html = renderMarkdown(stripLeadingH1(doc.body));

  if (doc.postType === "page") {
    return (
      <>
        <StoredJsonLd schema={doc.schema} />
        <PageHero breadcrumb={doc.title} title={doc.title} description={doc.excerpt} />
        <section className="py-12 lg:py-14">
          <Container className="max-w-3xl">
            <div className="article" dangerouslySetInnerHTML={{ __html: html }} />
            {videos[doc.fileSlug]?.length ? (
              <div className="mt-14 grid gap-8 sm:grid-cols-2">
                {videos[doc.fileSlug].map((v) => (
                  <VideoEmbed key={v.id} video={v} />
                ))}
              </div>
            ) : null}
          </Container>
        </section>
        <CtaBand />
      </>
    );
  }

  const summary = toPostSummary(doc);
  const others = getPosts().filter((p) => p.fileSlug !== doc.fileSlug);
  const related = (
    doc.tags.length
      ? others.filter((p) => p.tags.some((t) => doc.tags.includes(t)))
      : []
  )
    .concat(others)
    .filter((p, i, arr) => arr.findIndex((x) => x.fileSlug === p.fileSlug) === i)
    .slice(0, 3)
    .map(toPostSummary);

  const date = doc.date
    ? new Date(doc.date.replace(" ", "T")).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <>
      <StoredJsonLd schema={doc.schema} />
      <ArticleLayout
        title={doc.title}
        category={summary.category}
        readTime={summary.readingTime}
        date={date}
        image={doc.featuredImage?.src || undefined}
        imageAlt={doc.featuredImage?.alt || undefined}
        excerpt={doc.excerpt || undefined}
        html={html}
        related={related}
      />
    </>
  );
}

