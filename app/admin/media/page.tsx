"use client";

import { MediaLibrary } from "@/components/admin/media-picker";

/**
 * Media library.
 *
 * The whole page is <MediaLibrary> with no `onSelect` — the same component the
 * featured-image picker opens in a modal. One implementation of upload, listing and
 * delete rather than two that drift apart.
 */
export default function MediaPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <header>
        <h1 className="font-display text-2xl font-medium text-navy-900">Media</h1>
        <p className="mt-0.5 text-sm text-muted">
          Images for CMS posts, stored in the <code className="text-xs">blog-images</code> bucket.
          The migrated articles&rsquo; images live under{" "}
          <code className="text-xs">/wp-content/uploads/</code> and are not managed here.
        </p>
      </header>

      <div className="mt-6">
        <MediaLibrary />
      </div>
    </div>
  );
}
