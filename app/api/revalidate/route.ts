import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { invalidateCmsCache } from "@/lib/cms/posts";
import { CMS_ENABLED, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * On-demand revalidation.
 *
 * Without it a published post waits out the 60-second ISR window. With it, Publish
 * Now is live by the time the author switches tabs.
 *
 * Two ways to authorise, and a caller needs only one:
 *
 *   1. **A signed-in admin's own access token.** This is what the dashboard uses.
 *      The token is verified against Supabase, so the browser never has to hold a
 *      deployment secret — there is no shared secret in the client bundle to leak.
 *   2. **`Authorization: Bearer $REVALIDATE_SECRET`.** For callers with no Supabase
 *      session: a deploy hook, an external scheduler, a manual curl.
 *
 * An unauthenticated caller gets 401 and nothing is revalidated. Revalidation is not
 * destructive, but it is a free way to make the origin rebuild pages on demand, so it
 * is not left open.
 */

export const dynamic = "force-dynamic";

/** Length-independent comparison, so a wrong secret leaks nothing by timing. */
function secretMatches(provided: string, expected: string): boolean {
  if (!expected || provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

async function isSignedInAdmin(token: string): Promise<boolean> {
  if (!CMS_ENABLED || !token) return false;
  try {
    const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await client.auth.getUser(token);
    return !error && Boolean(data.user);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const secret = process.env.REVALIDATE_SECRET ?? "";

  const authorised = secretMatches(token, secret) || (await isSignedInAdmin(token));
  if (!authorised) {
    return NextResponse.json({ revalidated: false, error: "Unauthorized" }, { status: 401 });
  }

  let slugs: string[] = [];
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && Array.isArray((body as { slugs?: unknown }).slugs)) {
      slugs = ((body as { slugs: unknown[] }).slugs)
        .filter((s): s is string => typeof s === "string")
        .slice(0, 50);
    }
  } catch {
    // No body is fine — the listing and sitemap are refreshed either way.
  }

  // Drop the in-process memo first. Without this the rebuilt page would render from
  // the same up-to-60-second-old snapshot and appear not to have changed.
  invalidateCmsCache();

  // `/` is in the list because the homepage's "From the Journal" section renders the
  // three newest articles from both sources — a new post changes it too.
  const paths = ["/", "/blog", "/sitemap.xml", ...slugs.map((slug) => `/${slug}`)];
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ revalidated: true, paths, at: new Date().toISOString() });
}
