import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CMS_ENABLED, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

export interface AdminSession {
  userId: string;
  email: string;
  db: SupabaseClient;
}

function bearer(request: Request): string {
  return (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
}

export async function requireAdmin(request: Request): Promise<AdminSession | null> {
  const token = bearer(request);
  if (!CMS_ENABLED || !token) return null;

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) return null;

    return { userId: data.user.id, email: data.user.email ?? "", db };
  } catch {
    return null;
  }
}

export const UNAUTHORIZED = { error: "Unauthorized" } as const;
