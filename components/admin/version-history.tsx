"use client";

import { useEffect, useState } from "react";
import { History, RotateCcw } from "lucide-react";
import { listVersions, restoreVersion, type BlogVersionSummary } from "@/lib/admin/api";
import { formatInZone } from "@/lib/admin/timezone";
import { AdminButton, Banner, Modal } from "@/components/admin/ui";

export function VersionHistory({
  blogId,
  onClose,
  onRestored,
}: {
  blogId: string;
  onClose: () => void;
  onRestored: () => void;
}) {
  const [versions, setVersions] = useState<BlogVersionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    listVersions(blogId)
      .then(setVersions)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load history."))
      .finally(() => setLoading(false));
  }, [blogId]);

  const restore = async (version: BlogVersionSummary) => {
    if (!window.confirm(`Restore the content from version ${version.version}?`)) return;
    setBusy(version.version);
    setError(null);
    try {
      await restoreVersion(blogId, version.id);
      onRestored();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Restore failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal title="Version history" onClose={onClose}>
      <div className="flex flex-col gap-3">
        {error && <Banner tone="error">{error}</Banner>}
        {loading && <p className="text-sm text-muted">Loading…</p>}

        {!loading && versions.length === 0 && (
          <p className="text-sm text-muted">
            No earlier versions yet. A snapshot is taken every time this post is saved.
          </p>
        )}

        {versions.map((version) => (
          <div
            key={version.id}
            className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5"
          >
            <History className="h-4 w-4 shrink-0 text-muted" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-navy-900">
                Version {version.version}
                {version.note && <span className="text-muted"> · {version.note}</span>}
              </p>
              <p className="truncate text-xs text-muted">
                {formatInZone(version.created_at)} · {version.title || "(untitled)"}
              </p>
            </div>
            <AdminButton
              className="shrink-0"
              disabled={busy !== null}
              onClick={() => restore(version)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {busy === version.version ? "Restoring…" : "Restore"}
            </AdminButton>
          </div>
        ))}

        <p className="text-xs leading-relaxed text-muted">
          Restoring brings back the copy, images, SEO fields and FAQ from that version. It does
          not change whether the post is published or when it is scheduled.
        </p>
      </div>
    </Modal>
  );
}
