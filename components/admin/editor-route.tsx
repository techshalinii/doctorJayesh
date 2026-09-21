"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getBlog } from "@/lib/admin/api";
import type { BlogRow } from "@/lib/cms/types";
import { Banner } from "@/components/admin/ui";
import { BlogEditor } from "@/components/admin/blog-editor";
import type { RelatedCandidate } from "@/components/admin/related-picker";

/**
 * Loads the post the editor is about.
 *
 * The fetch happens in the browser rather than on the server because a draft is only
 * readable with the signed-in user's own token — a server render would be anonymous and
 * Row Level Security would correctly return nothing.
 *
 * `/admin/blogs/new/` reaches the same route with id `new` and simply skips the fetch.
 */
export function EditorRoute({
  id,
  migrated,
  reservedSlugs,
  defaultAuthor,
}: {
  id: string;
  migrated: RelatedCandidate[];
  reservedSlugs: string[];
  defaultAuthor: string;
}) {
  const isNew = id === "new";
  const searchParams = useSearchParams();

  const [post, setPost] = useState<BlogRow | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    getBlog(id)
      .then((found) => {
        if (!found) setError("That post no longer exists.");
        setPost(found);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load the post."))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  if (loading) return <p className="text-sm text-muted">Loading…</p>;
  if (error) {
    return (
      <div className="mx-auto max-w-2xl">
        <Banner tone="error">{error}</Banner>
      </div>
    );
  }

  return (
    <BlogEditor
      // Remounts when switching between posts, so no state leaks across.
      key={post?.id ?? "new"}
      post={post}
      migrated={migrated}
      reservedSlugs={reservedSlugs}
      defaultAuthor={defaultAuthor}
      // `?import=1` from the list's "Import Markdown" button opens the importer straight
      // away instead of making the author find it.
      openImport={searchParams.get("import") === "1"}
    />
  );
}
