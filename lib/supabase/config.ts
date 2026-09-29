export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const CMS_ENABLED =
  process.env.CMS_ENABLED !== "false" && Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://drjayeshsardhara.com").replace(
  /\/$/,
  "",
);
