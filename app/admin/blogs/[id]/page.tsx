import { Suspense } from "react";
import { getPosts } from "@/lib/content";
import { getReservedSlugs } from "@/lib/cms/public";
import { doctor } from "@/lib/data";
import { EditorRoute } from "@/components/admin/editor-route";
import type { RelatedCandidate } from "@/components/admin/related-picker";

/**
 * Editor route. `/admin/blogs/new/` lands here too, with `id` = "new".
 *
 * A server component purely to read the migrated markdown index — `content/*.md` is on
 * disk at build time and unavailable to the browser, so the related-post picker would
 * otherwise be blind to the 180 articles that make up most of the blog. The post being
 * edited is loaded client-side instead; see EditorRoute.
 */
export default async function BlogEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const migrated: RelatedCandidate[] = getPosts().map((post) => ({
    slug: post.fileSlug,
    title: post.title,
    date: post.date ?? "",
    source: "migrated",
    // Every migrated post in `content/` is published; there is no draft state there.
    live: true,
  }));

  return (
    // useSearchParams() inside EditorRoute needs a Suspense boundary.
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <EditorRoute
        id={id}
        migrated={migrated}
        // Every root slug already spoken for — migrated posts AND pages, plus the
        // hand-built routes. The editor warns before a save that would publish a post
        // at a URL the site answers from somewhere else.
        reservedSlugs={[...getReservedSlugs()]}
        defaultAuthor={doctor.name}
      />
    </Suspense>
  );
}
