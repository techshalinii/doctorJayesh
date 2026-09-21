import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { PostsExplorer } from "@/components/blog/posts-explorer";
import { CtaBand } from "@/components/ui/cta-band";
import { getDocByFileSlug, metadataFromDoc } from "@/lib/content";
import { getMergedPostSummaries } from "@/lib/cms/public";
import { StoredJsonLd } from "@/components/seo/json-ld";

const doc = getDocByFileSlug("blog")!;

export const metadata: Metadata = metadataFromDoc(doc);

/**
 * Regenerated at most once a minute.
 *
 * This is what makes a scheduled post appear without anything changing in the
 * database: the page is rebuilt on the first request after the window lapses, and
 * `getMergedPostSummaries()` re-applies the visibility rule against the clock at
 * that moment. Publishing from the admin also calls /api/revalidate, which drops
 * this page immediately rather than waiting out the minute.
 */
export const revalidate = 60;

export default async function BlogPage() {
  const posts = await getMergedPostSummaries();
  return (
    <>
      <StoredJsonLd schema={doc.schema} />
      <PageHero
        eyebrow="Educational Resources"
        breadcrumb="Blog"
        title="Insights for brain & spine health"
        description="Clear, medically-reviewed articles to help you understand your condition and make confident decisions about your care."
      />
      <section className="py-12 lg:py-14">
        <Container>
          <PostsExplorer posts={posts} />
        </Container>
      </section>
      <CtaBand />
    </>
  );
}
