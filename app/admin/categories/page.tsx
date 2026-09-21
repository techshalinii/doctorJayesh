"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteCategory, listBlogs, listCategories, upsertCategory } from "@/lib/admin/api";
import { toSlug } from "@/lib/cms/markdown-import";
import type { BlogRow, CategoryRow } from "@/lib/cms/types";
import { AdminButton, Banner, Field, Input, Modal, Panel, Textarea } from "@/components/admin/ui";

/**
 * Categories.
 *
 * Posts store the category NAME, not a foreign key — the migrated content has no
 * categories at all (everything was "uncategorized" in WordPress), so a join table
 * would add a constraint the older half of the blog cannot satisfy. The cost is that
 * renaming a category does not follow its posts, which is why the delete confirmation
 * says how many posts would be orphaned.
 */
export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [posts, setPosts] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<CategoryRow> | null>(null);

  const apply = useCallback(([cats, blogs]: [CategoryRow[], BlogRow[]]) => {
    setCategories(cats);
    setPosts(blogs);
    setError(null);
  }, []);

  const load = useCallback(
    () =>
      Promise.all([listCategories(), listBlogs()])
        .then(apply)
        .catch((e: unknown) =>
          setError(e instanceof Error ? e.message : "Could not load categories."),
        ),
    [apply],
  );

  useEffect(() => {
    // `alive` stops a slow response from setting state on an unmounted page, and the
    // promise form keeps every update off the effect's synchronous path.
    let alive = true;
    Promise.all([listCategories(), listBlogs()])
      .then((data) => {
        if (alive) apply(data);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : "Could not load categories.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [apply]);

  const countFor = (name: string) => posts.filter((p) => p.category === name).length;

  const remove = async (category: CategoryRow) => {
    const used = countFor(category.name);
    const message = used
      ? `${used} post${used === 1 ? "" : "s"} still use “${category.name}”. Deleting the category leaves them uncategorised — their content is untouched. Continue?`
      : `Delete “${category.name}”?`;
    if (!window.confirm(message)) return;

    try {
      await deleteCategory(category.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium text-navy-900">Categories</h1>
          <p className="mt-0.5 text-sm text-muted">
            Used to group posts and to fill the &ldquo;Related in this series&rdquo; picker.
          </p>
        </div>
        <AdminButton
          variant="primary"
          onClick={() =>
            setEditing({
              slug: "",
              name: "",
              description: "",
              // Lands at the end of the list until someone gives it a place.
              sort_order: 1000,
            })
          }
        >
          <Plus className="h-4 w-4" /> New category
        </AdminButton>
      </header>

      {error && (
        <div className="mt-4">
          <Banner tone="error">{error}</Banner>
        </div>
      )}

      <div className="mt-6">
        <Panel>
          {loading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted">No categories yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {categories.map((category) => (
                <li key={category.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted">
                    {category.sort_order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy-900">{category.name}</p>
                    <p className="truncate text-xs text-muted">
                      {category.slug}
                      {category.description && ` · ${category.description}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">
                    {countFor(category.name)} post{countFor(category.name) === 1 ? "" : "s"}
                  </span>
                  <AdminButton variant="ghost" className="!px-2 !py-1.5" onClick={() => setEditing(category)}>
                    <Pencil className="h-4 w-4" />
                  </AdminButton>
                  <AdminButton
                    variant="ghost"
                    className="!px-2 !py-1.5 hover:!bg-red-50 hover:!text-red-700"
                    onClick={() => remove(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </AdminButton>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {editing && (
        <CategoryDialog
          value={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
          onError={setError}
        />
      )}
    </div>
  );
}

function CategoryDialog({
  value,
  onClose,
  onSaved,
  onError,
}: {
  value: Partial<CategoryRow>;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState(value.name ?? "");
  const [slug, setSlug] = useState(value.slug ?? "");
  const [description, setDescription] = useState(value.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(value.sort_order ?? 1000));
  const [busy, setBusy] = useState(false);
  const isNew = !value.id;

  const save = async () => {
    setBusy(true);
    try {
      await upsertCategory({
        ...(value.id ? { id: value.id } : {}),
        name: name.trim(),
        slug: toSlug(slug || name),
        description: description.trim(),
        sort_order: Number.parseInt(sortOrder, 10) || 1000,
      });
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={isNew ? "New category" : "Edit category"} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Name" htmlFor="cat-name">
          <Input
            id="cat-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              // Only auto-derive for a new category: changing an existing slug would
              // not update the posts that reference it by name anyway.
              if (isNew) setSlug(toSlug(e.target.value));
            }}
          />
        </Field>
        <Field label="Slug" htmlFor="cat-slug">
          <Input id="cat-slug" value={slug} onChange={(e) => setSlug(toSlug(e.target.value))} />
        </Field>
        <Field label="Description" htmlFor="cat-desc">
          <Textarea
            id="cat-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field
          label="Display order"
          htmlFor="cat-order"
          hint="Lower numbers come first. The existing topics are spaced 10 apart, so use a number in between to slot one into the middle."
        >
          <Input
            id="cat-order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </Field>

        <div className="flex justify-end gap-2">
          <AdminButton onClick={onClose}>Cancel</AdminButton>
          <AdminButton variant="primary" disabled={busy || !name.trim()} onClick={save}>
            {busy ? "Saving…" : "Save"}
          </AdminButton>
        </div>
      </div>
    </Modal>
  );
}
