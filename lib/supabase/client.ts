"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Browser client for the admin dashboard.
 *
 * Carries the publishable key plus, once signed in, the user's own session JWT.
 * Every write the editor makes is therefore authorised as that user and checked by
 * the `blogs_admin_all` policy — the browser never holds a credential that could
 * write without being logged in.
 */
let client: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return client;
}

/** True when the dashboard has credentials to talk to. Drives the setup notice. */
export const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
