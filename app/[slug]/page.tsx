import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { CtaBand } from "@/components/ui/cta-band";
import { PageHero } from "@/components/ui/page-hero";
import { StoredJsonLd } from "@/components/seo/json-ld";
import { doctor, videos } from "@/lib/data";
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
import {
  getCmsPostForRoute,
  getCmsRedirectTarget,
  getCmsSlugs,
  getRelatedFor,
} from "@/lib/cms/public";
import { cmsMetadata } from "@/lib/cms/metadata";
import { cmsPostJsonLd } from "@/lib/cms/jsonld";
import { canonicalUrl } from "@/lib/seo";

/**
 * Root-level content: the 197 migrated WordPress documents, plus every post written
 * in the CMS since.
 *
 * WordPress served every blog post at `/{slug}/`, so posts stay at the root rather than
 * moving under `/blog/` — see _migration/url-map-notes.md Q1. Static segments take
 * precedence over this dynamic one, so `/about`, `/blog` etc. still resolve to their own
 * hand-built routes.
 *
 * A slug the migrated markdown owns is served from markdown, always — `getCmsPostForRoute()`
 * refuses to return a CMS row for one. Those URLs are indexed and carry backlinks; a new
 * post must not be able to take one over.
 */

/**
 * `true`, where the migrated-only version of this route had `false`.
 *
 * A post scheduled for next Tuesday is not in `generateStaticParams()` at build time,
 * so with `false` it would 404 on the day it goes live. With `true` its slug is rendered
 * on first request instead. Unknown slugs still 404 for real: the body below calls
 * `notFound()` when neither source has the slug, which emits a 404 status — not a soft
 * 200 with an empty page.
 */
export const dynamicParams = true;

/**
 * Regenerated at most once a minute. This is the mechanism by which a scheduled post
 * appears without any row changing — see lib/cms/visibility.ts.
 */
export const revalidate = 60;

export async function generateStaticParams() {
  const migrated = getDynamicRootDocs().map((d) => ({ slug: d.fileSlug }));
  // Prerender the posts that are already live. Anything scheduled for later is picked
  // up on demand once `dynamicParams` lets the request through.
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

  // ---- CMS posts ----
  // Reached only when no migrated document claims the slug, so markdown always wins.
  if (!doc) {
    const post = await getCmsPostForRoute(slug);
    if (!post) {
      // Before giving up: this may be a slug a post has since moved away from.
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

  // <PageHero> / the article header already render the <h1> — see stripLeadingH1.
  const html = renderMarkdown(stripLeadingH1(doc.body));

  // ---- migrated WordPress pages (no article chrome) ----
  if (doc.postType === "page") {
    return (
      <>
        <StoredJsonLd schema={doc.schema} />
        <PageHero breadcrumb={doc.title} title={doc.title} description={doc.excerpt} />
        <section className="py-12 lg:py-14">
          <Container className="max-w-3xl">
            <div className="article" dangerouslySetInnerHTML={{ __html: html }} />
            {/* Videos migrated from this page's Elementor widgets. */}
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

  // ---- migrated blog posts ----
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
      <article className="pt-32 sm:pt-40">
        <Container className="max-w-3xl">
          <Link
            href="/blog/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-teal-700"
          >
            <ArrowLeft className="h-4 w-4" /> All articles
          </Link>
          <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {summary.readingTime}
            </span>
          </div>
          <h1 className="mt-4 font-display text-[2.1rem] font-medium leading-[1.1] tracking-[-0.01em] text-navy-900 sm:text-4xl lg:text-[3rem] dark:text-white">
            {doc.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-6 text-sm text-muted">
            {date && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" /> {date}
                </span>
                <span className="text-navy-300 dark:text-white/30">·</span>
              </>
            )}
            <span>
              By {doctor.name}, {doctor.credentials}
            </span>
          </div>
        </Container>

        {doc.featuredImage?.src && (
          <Container className="mt-10 max-w-4xl">
            <div className="relative aspect-[21/9] overflow-hidden border border-navy-900/10 bg-surface-2 dark:border-white/10">
              <Image
                src={doc.featuredImage.src}
                alt={doc.featuredImage.alt || doc.title}
                fill
                priority
                sizes="(min-width: 1024px) 56rem, 100vw"
                className="object-cover"
              />
            </div>
          </Container>
        )}

        <Container className="mt-14 max-w-3xl">
          {doc.excerpt && (
            <p className="mb-8 border-l-2 border-teal-500 pl-5 font-display text-xl font-medium leading-relaxed text-navy-800 dark:text-white/90">
              {doc.excerpt}
            </p>
          )}

          <div className="article" dangerouslySetInnerHTML={{ __html: html }} />

          <div className="mt-14 flex flex-col items-start gap-4 border-t border-navy-900/12 pt-8 dark:border-white/12 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-xl font-medium text-navy-900 dark:text-white">
                Have a question about this topic?
              </h3>
              <p className="mt-1 text-sm text-muted">Book a consultation for personalised, expert advice.</p>
            </div>
            <Button href="/appointment/" className="shrink-0">
              Book an Appointment <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Container>
      </article>

      {related.length > 0 && (
        <section className="border-t border-border py-14">
          <Container>
            <h2 className="font-display text-2xl font-medium text-navy-900 dark:text-white">Related articles</h2>
            <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link key={r.slug} href={`/${r.slug}/`} className="group flex flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
                    <Image
                      src={r.image}
                      alt={r.title}
                      fill
                      sizes="(min-width: 1024px) 30vw, 90vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-medium leading-snug text-navy-900 transition-colors group-hover:text-teal-700 dark:text-white dark:group-hover:text-teal-300">
                    {r.title}
                  </h3>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-navy-800 dark:text-white/80">
                    Read <ArrowUpRight className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      <CtaBand />
    </>
  );
}
