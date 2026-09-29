create extension if not exists "pgcrypto";

create or replace function public.blog_is_visible(
  p_status text,
  p_publish_at timestamptz
) returns boolean
language sql immutable parallel safe as $$
  select p_status in ('published', 'scheduled') and p_publish_at is not null and p_publish_at <= now();
$$;

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name        text not null,
  description text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.blogs (
  id               uuid primary key default gen_random_uuid(),

  title            text not null default '',
  slug             text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  previous_slugs   text[] not null default '{}',
  excerpt          text not null default '',

  content          jsonb not null default '[]'::jsonb,

  featured_image   text,
  image_alt        text not null default '',
  category         text not null default '',
  tags             text[] not null default '{}',

  seo_title        text not null default '',
  meta_description text not null default '',
  focus_keyword    text not null default '',
  canonical_url    text,
  og_image         text,
  twitter_image    text,

  read_time        integer not null default 1 check (read_time > 0),
  author           text not null default '',

  status           text not null default 'draft'
                     check (status in ('draft', 'scheduled', 'published', 'archived')),
  publish_at       timestamptz,
  published_at     timestamptz,
  time_zone        text not null default 'Asia/Kolkata',

  related_blogs    text[] not null default '{}',
  faq              jsonb  not null default '[]'::jsonb,

  version          integer not null default 1,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users(id) on delete set null,
  updated_by       uuid references auth.users(id) on delete set null,
  created_by_email text not null default '',

  constraint blogs_live_needs_publish_at
    check (status not in ('published', 'scheduled') or publish_at is not null)
);

create index if not exists blogs_publish_at_idx on public.blogs (publish_at desc);
create index if not exists blogs_previous_slugs_idx on public.blogs using gin (previous_slugs);
create index if not exists blogs_status_idx     on public.blogs (status);
create index if not exists blogs_category_idx   on public.blogs (category);
create index if not exists blogs_tags_idx       on public.blogs using gin (tags);

create table if not exists public.blog_versions (
  id         uuid primary key default gen_random_uuid(),
  blog_id    uuid not null references public.blogs(id) on delete cascade,
  version    integer not null,
  snapshot   jsonb not null,
  note       text not null default '',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (blog_id, version)
);

create index if not exists blog_versions_blog_idx on public.blog_versions (blog_id, version desc);

create table if not exists public.media (
  id          uuid primary key default gen_random_uuid(),
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

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select to anon using (true);

drop policy if exists categories_admin_all on public.categories;
create policy categories_admin_all on public.categories
  for all to authenticated using (true) with check (true);

drop policy if exists media_public_read on public.media;
create policy media_public_read on public.media
  for select to anon using (true);

drop policy if exists media_admin_all on public.media;
create policy media_admin_all on public.media
  for all to authenticated using (true) with check (true);

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

insert into public.categories (slug, name, description) values
  ('brain-surgery', 'Brain Surgery',   'Tumours, epilepsy, functional and endoscopic neurosurgery.'),
  ('spine-surgery', 'Spine Surgery',   'Disc disease, deformity and minimally invasive spine procedures.'),
  ('patient-guides', 'Patient Guides', 'Preparing for surgery, recovery and day-to-day living.'),
  ('neurology', 'Neurology',           'Symptoms, diagnosis and non-surgical management.')
on conflict (slug) do nothing;
