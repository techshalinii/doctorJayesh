-- ════════════════════════════════════════════════════════════════════════════
-- Blog CMS — schema, RLS and storage policies
--
-- Run ONCE: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run; every statement is idempotent.
--
-- The 180 migrated WordPress posts stay in `content/*.md`. They are byte-identical
-- to what Google indexed and must never be regenerated. This schema holds only NEW
-- posts authored through /admin. On a slug clash the markdown file wins — see
-- lib/cms/posts.ts.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── the visibility rule ─────────────────────────────────────────────────────
--
-- THE single source of truth, mirrored in TypeScript by lib/cms/visibility.ts.
-- A post is public when, and only when:
--
--     status in ('published','scheduled') and publish_at <= now()
--
-- A scheduled post becomes visible because the CLOCK MOVED, not because a row
-- changed. There is deliberately no cron flipping scheduled → published.
--
-- Note on the two timestamps:
--   publish_at   — author-set publish date. Drives visibility, the displayed date,
--                  the sitemap `lastmod` and all ordering.
--   published_at — internal "first went live" stamp. Never used for visibility;
--                  it exists for auditing and to stop the public date jumping when
--                  an already-live post is re-published.

create or replace function public.blog_is_visible(
  p_status text,
  p_publish_at timestamptz
) returns boolean
language sql immutable parallel safe as $$
  select p_status in ('published', 'scheduled') and p_publish_at is not null and p_publish_at <= now();
$$;

-- ── categories ──────────────────────────────────────────────────────────────

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name        text not null,
  description text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── blogs ───────────────────────────────────────────────────────────────────

create table if not exists public.blogs (
  id               uuid primary key default gen_random_uuid(),

  title            text not null default '',
  -- URL segment only. Posts are served at /{slug}/ next to the migrated ones, so
  -- the pattern forbids slashes, uppercase and stray punctuation.
  slug             text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  -- Slugs this post used to live at. A slug is frozen in the editor once the post is
  -- live, but if one is changed anyway the old value lands here and app/[slug] serves
  -- a 308 from it — an indexed URL must never start returning 404 because someone
  -- retitled a post.
  previous_slugs   text[] not null default '{}',
  excerpt          text not null default '',

  -- Structured blocks, NEVER raw HTML: [{ "type": "paragraph", "text": "…" }, …].
  -- See lib/cms/blocks.ts for the block union and the server-side renderer.
  content          jsonb not null default '[]'::jsonb,

  featured_image   text,
  image_alt        text not null default '',
  category         text not null default '',
  tags             text[] not null default '{}',

  -- SEO
  seo_title        text not null default '',
  meta_description text not null default '',
  -- The primary query this post targets. Drives every keyword rule in the SEO
  -- score. Never auto-filled or invented — see lib/cms/seo-score.ts.
  focus_keyword    text not null default '',
  canonical_url    text,
  og_image         text,
  twitter_image    text,

  read_time        integer not null default 1 check (read_time > 0),
  author           text not null default '',

  status           text not null default 'draft'
                     check (status in ('draft', 'scheduled', 'published', 'archived')),
  -- Author-set publish date. See the visibility note above.
  publish_at       timestamptz,
  -- Internal first-went-live stamp.
  published_at     timestamptz,
  -- IANA zone the author picked the time in, e.g. 'Asia/Kolkata'. Display only;
  -- publish_at is always stored UTC.
  time_zone        text not null default 'Asia/Kolkata',

  related_blogs    text[] not null default '{}',
  -- [{ "question": "…", "answer": "…" }, …]
  faq              jsonb  not null default '[]'::jsonb,

  version          integer not null default 1,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users(id) on delete set null,
  updated_by       uuid references auth.users(id) on delete set null,
  -- Denormalised so the admin list can show "Created By" without a join.
  -- `auth.users` is not readable by the `authenticated` role, and exposing it through
  -- a view to render one column would widen the attack surface for no benefit.
  created_by_email text not null default '',

  -- A row that claims to be live or scheduled must say WHEN. Without this the
  -- visibility rule would silently hide it forever.
  constraint blogs_live_needs_publish_at
    check (status not in ('published', 'scheduled') or publish_at is not null)
);

create index if not exists blogs_publish_at_idx on public.blogs (publish_at desc);
create index if not exists blogs_previous_slugs_idx on public.blogs using gin (previous_slugs);
create index if not exists blogs_status_idx     on public.blogs (status);
create index if not exists blogs_category_idx   on public.blogs (category);
create index if not exists blogs_tags_idx       on public.blogs using gin (tags);

-- ── version history ─────────────────────────────────────────────────────────

create table if not exists public.blog_versions (
  id         uuid primary key default gen_random_uuid(),
  blog_id    uuid not null references public.blogs(id) on delete cascade,
  version    integer not null,
  -- Whole-row snapshot taken before each save, so a restore needs no migration
  -- logic when columns are added later.
  snapshot   jsonb not null,
  note       text not null default '',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (blog_id, version)
);

create index if not exists blog_versions_blog_idx on public.blog_versions (blog_id, version desc);

-- ── media ───────────────────────────────────────────────────────────────────

create table if not exists public.media (
  id          uuid primary key default gen_random_uuid(),
  -- Path inside the `blog-images` storage bucket.
  path        text not null unique,
  url         text not null,
  file_name   text not null,
  mime_type   text not null default '',
  size_bytes  bigint not null default 0,
  width       integer,
  height      integer,
  alt         text not null default '',
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) on delete set null
);

create index if not exists media_created_at_idx on public.media (created_at desc);

-- ── updated_at trigger ──────────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists blogs_touch_updated_at on public.blogs;
create trigger blogs_touch_updated_at
  before update on public.blogs
  for each row execute function public.touch_updated_at();

drop trigger if exists categories_touch_updated_at on public.categories;
create trigger categories_touch_updated_at
  before update on public.categories
  for each row execute function public.touch_updated_at();

-- ── row level security ──────────────────────────────────────────────────────
--
-- The visibility rule lives HERE as well as in TypeScript, and this copy is the
-- one that matters: drafts, archived posts and future-dated scheduled posts can
-- never leak through the REST API, whatever a client asks for.

alter table public.blogs         enable row level security;
alter table public.blog_versions enable row level security;
alter table public.categories    enable row level security;
alter table public.media         enable row level security;

drop policy if exists blogs_public_read on public.blogs;
create policy blogs_public_read on public.blogs
  for select to anon
  using (public.blog_is_visible(status, publish_at));

drop policy if exists blogs_admin_all on public.blogs;
create policy blogs_admin_all on public.blogs
  for all to authenticated using (true) with check (true);

drop policy if exists blog_versions_admin_all on public.blog_versions;
create policy blog_versions_admin_all on public.blog_versions
  for all to authenticated using (true) with check (true);

-- Categories are referenced by visible posts, so the public may read them.
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select to anon using (true);

drop policy if exists categories_admin_all on public.categories;
create policy categories_admin_all on public.categories
  for all to authenticated using (true) with check (true);

-- Media rows describe files in a public bucket; the URLs are public anyway.
drop policy if exists media_public_read on public.media;
create policy media_public_read on public.media
  for select to anon using (true);

drop policy if exists media_admin_all on public.media;
create policy media_admin_all on public.media
  for all to authenticated using (true) with check (true);

-- ── storage: blog-images ────────────────────────────────────────────────────
-- Public read, authenticated write. Creating the bucket here rather than by hand
-- keeps a fresh project one script away from working.

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do update set public = true;

drop policy if exists blog_images_public_read on storage.objects;
create policy blog_images_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'blog-images');

drop policy if exists blog_images_admin_write on storage.objects;
create policy blog_images_admin_write on storage.objects
  for all to authenticated
  using (bucket_id = 'blog-images') with check (bucket_id = 'blog-images');

-- ── seed categories ─────────────────────────────────────────────────────────
--
-- Placeholders, so a brand-new project has something in the dropdown. SUPERSEDED
-- by 0002_categories.sql, which installs the real topic set and removes these
-- once nothing references them. Left unedited on purpose: a migration that has
-- already been applied somewhere should not be rewritten underneath it.

insert into public.categories (slug, name, description) values
  ('brain-surgery', 'Brain Surgery',   'Tumours, epilepsy, functional and endoscopic neurosurgery.'),
  ('spine-surgery', 'Spine Surgery',   'Disc disease, deformity and minimally invasive spine procedures.'),
  ('patient-guides', 'Patient Guides', 'Preparing for surgery, recovery and day-to-day living.'),
  ('neurology', 'Neurology',           'Symptoms, diagnosis and non-surgical management.')
on conflict (slug) do nothing;
