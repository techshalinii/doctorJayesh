import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { PostsExplorer } from "@/components/blog/posts-explorer";
import { getMergedPostSummaries } from "@/lib/cms/public";
import { Arrow } from "@/components/ui/arrow";

export async function Resources() {
  const posts = await getMergedPostSummaries();
  return (
    <section className="border-y border-border bg-surface/50 py-12 lg:py-14" id="resources">
      <Container>
        <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
          <SectionHeading
            index="06"
            eyebrow="From the Journal"
            title="Insights for brain & spine health"
            description="Clear, medically-grounded articles to help you understand your condition and decide with confidence."
          />
          <Link
            href="/blog/"
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-navy-800 dark:text-white/80"
          >
            View all articles
            <Arrow className="text-teal-600 dark:text-teal-400" />
          </Link>
        </div>

        <div className="mt-8">
          <PostsExplorer posts={posts} limit={3} showFeatured={false} showControls={false} />
        </div>
      </Container>
    </section>
  );
}
