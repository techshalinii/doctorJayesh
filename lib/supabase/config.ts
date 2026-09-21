/**
 * Supabase configuration, read once.
 *
 * Only the project URL and the PUBLISHABLE (anon) key are ever used — by the server
 * reader and by the admin browser client alike. There is no service-role key in this
 * codebase: the public read policy already returns exactly the visible posts, and
 * admin writes carry the logged-in user's own JWT. Nothing needs to bypass RLS, so
 * nothing holds a key that could.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * The public key, under either of the two names it is known by.
 *
 * Supabase renamed this concept: what the dashboard now calls the **publishable** key
 * (`sb_publishable_…`) was the **anon** key, and the overwhelming majority of existing
 * projects, tutorials and deploy configs still use `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
 * They are the same value, so both names are accepted rather than making a correctly
 * configured host fail because it picked the other spelling.
 *
 * Both are written as literal `process.env.X` member expressions on purpose: that is
 * the only form Next.js statically replaces at build time. A computed lookup such as
 * `process.env[name]` is NOT inlined and would read as `undefined` in the browser.
 */
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

/**
 * Whether the CMS is wired up at all.
 *
 * `CMS_ENABLED=false` is the instant rollback: every reader short-circuits, no
 * Supabase call is made, and the site serves only the 180 migrated markdown posts
 * exactly as it did before this feature existed. Missing credentials have the same
 * effect, so a fresh clone with no `.env.local` still builds and runs.
 *
 * **Server-side only.** `CMS_ENABLED` has no `NEXT_PUBLIC_` prefix, so it is not inlined
 * into the browser bundle: in a client component `process.env.CMS_ENABLED` is
 * `undefined`, which makes this constant evaluate to `true` regardless of the real
 * setting. Read it from Route Handlers and server modules only — never to gate client
 * UI. (This module is imported by lib/supabase/client.ts for the URL and key, which is
 * why the warning is here rather than somewhere the value is used.)
 */
export const CMS_ENABLED =
  process.env.CMS_ENABLED !== "false" && Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

/** Absolute site origin for canonicals and OG urls. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://drjayeshsardhara.com").replace(
  /\/$/,
  "",
);
