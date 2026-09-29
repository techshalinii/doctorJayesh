import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { invalidateCmsCache } from "@/lib/cms/posts";
import { CMS_ENABLED, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

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
  }

  invalidateCmsCache();

  const paths = ["/", "/blog", "/sitemap.xml", ...slugs.map((slug) => `/${slug}`)];
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ revalidated: true, paths, at: new Date().toISOString() });
}
