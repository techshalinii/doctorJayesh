import { Suspense } from "react";
import { getPosts } from "@/lib/content";
import { getReservedSlugs } from "@/lib/cms/public";
import { doctor } from "@/lib/data";
import { EditorRoute } from "@/components/admin/editor-route";
import type { RelatedCandidate } from "@/components/admin/related-picker";

export default async function BlogEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const migrated: RelatedCandidate[] = getPosts().map((post) => ({
    slug: post.fileSlug,
    title: post.title,
    date: post.date ?? "",
    source: "migrated",
    live: true,
  }));

  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <EditorRoute
        id={id}
        migrated={migrated}
        reservedSlugs={[...getReservedSlugs()]}
        defaultAuthor={doctor.name}
      />
    </Suspense>
  );
}
