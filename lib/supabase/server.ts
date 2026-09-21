import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Read-only Supabase client for server rendering.
 *
 * Uses the PUBLISHABLE key deliberately. The `blogs_public_read` RLS policy already
 * returns exactly the visible posts, so rendering through the same key a visitor
 * would use makes the page physically incapable of leaking a draft — there is no
 * elevated credential in the process to leak it with.
 *
 * Auth is fully disabled: nothing to persist, refresh or detect in a render.
 */
let client: SupabaseClient | null = null;

export function supabaseServer(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { "x-application-name": "drjayesh-site" } },
    });
  }
  return client;
}
