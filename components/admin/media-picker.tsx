"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { deleteMedia, listMedia, uploadMedia } from "@/lib/admin/api";
import type { MediaRow } from "@/lib/cms/types";
import { AdminButton, Banner, Modal } from "@/components/admin/ui";

/**
 * Pick an existing upload or add a new one.
 *
 * Used for the featured image and reused whole as the Media page's body — one
 * implementation of upload, listing and delete rather than two that drift.
 *
 * Thumbnails use a plain <img>, not next/image: these are Supabase URLs inside an admin
 * screen, and routing them through the optimiser would spend transform budget on
 * pictures only two people will ever look at.
 */
export function MediaLibrary({
  onSelect,
  selectedUrl,
}: {
  onSelect?: (item: MediaRow) => void;
  selectedUrl?: string | null;
}) {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // `alive` stops a slow response from setting state on an unmounted picker, and the
    // promise form keeps every update off the effect's synchronous path.
    let alive = true;
    listMedia()
      .then((rows) => {
        if (alive) {
          setItems(rows);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : "Could not load media.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const created = await uploadMedia(file);
        setItems((prev) => [created, ...prev]);
        onSelect?.(created);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (item: MediaRow) => {
    if (!window.confirm(`Delete ${item.file_name}? Any post using it will lose the image.`)) return;
    try {
      await deleteMedia(item);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <Banner tone="error">{error}</Banner>}

      <label className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-navy-900 hover:bg-surface">
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading…" : "Upload images"}
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          disabled={uploading}
          onChange={(e) => {
            void upload(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {loading && <p className="text-sm text-muted">Loading…</p>}

      {!loading && items.length === 0 && (
        <p className="text-sm text-muted">
          Nothing uploaded yet. Images added here live in the <code>blog-images</code> bucket and
          are served straight from Supabase.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const selected = selectedUrl === item.url;
          return (
            <figure
              key={item.id}
              className={`group relative overflow-hidden rounded-md border ${
                selected ? "border-teal-500 ring-2 ring-teal-200" : "border-border"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect?.(item)}
                className="block w-full"
                title={onSelect ? "Use this image" : item.file_name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.alt || item.file_name}
                  loading="lazy"
                  className="aspect-[4/3] w-full bg-surface object-cover"
                />
              </button>
              <figcaption className="flex items-center gap-1 px-2 py-1.5">
                <span className="min-w-0 flex-1 truncate text-xs text-muted" title={item.file_name}>
                  {item.file_name}
                </span>
                <button
                  type="button"
                  onClick={() => remove(item)}
                  title="Delete"
                  aria-label={`Delete ${item.file_name}`}
                  className="rounded p-1 text-muted opacity-0 transition-opacity hover:bg-red-50 hover:text-red-700 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}

/** Featured-image field: preview, alt text, and a picker in a modal. */
export function FeaturedImagePicker({
  url,
  alt,
  onChange,
}: {
  url: string | null;
  alt: string;
  onChange: (next: { url: string | null; alt: string }) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {url ? (
        <div className="relative overflow-hidden rounded-md border border-border">
          {/* Sized by the container; `unoptimized` for the same reason as above. */}
          <NextImage
            src={url}
            alt={alt || "Featured image"}
            width={640}
            height={360}
            unoptimized
            className="aspect-[16/9] w-full bg-surface object-cover"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-surface text-sm text-muted hover:border-teal-400 hover:text-navy-900"
        >
          <ImagePlus className="h-6 w-6" />
          Choose a featured image
        </button>
      )}

      <div className="flex gap-2">
        <AdminButton className="flex-1" onClick={() => setOpen(true)}>
          {url ? "Change image" : "Choose image"}
        </AdminButton>
        {url && (
          <AdminButton variant="ghost" onClick={() => onChange({ url: null, alt })}>
            Remove
          </AdminButton>
        )}
      </div>

      {open && (
        <Modal title="Media library" onClose={() => setOpen(false)} wide>
          <MediaLibrary
            selectedUrl={url}
            onSelect={(item) => {
              // The upload's own alt text is used as a starting point when the field is
              // still empty — an image with no alt is an accessibility defect, and the
              // SEO checklist will not catch it.
              onChange({ url: item.url, alt: alt || item.alt });
              setOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
