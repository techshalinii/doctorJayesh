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
          <PostsExplorer posts={posts} pageSize={12} />
        </Container>
      </section>
      <CtaBand />
    </>
  );
}
