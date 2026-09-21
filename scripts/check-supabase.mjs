/**
 * Verifies a Supabase project against what the CMS expects.
 *
 * Connects with the PUBLISHABLE key only — the same credential the website and the
 * browser hold — so everything it reports is what an anonymous visitor can actually
 * see. That is the point: a check run with an elevated key would pass on a project
 * whose security rules are wrong.
 *
 *   node --env-file=.env.local scripts/check-supabase.mjs
 */

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  process.exit(1);
}

const db = createClient(URL, KEY, { auth: { persistSession: false } });

let failures = 0;
const pass = (msg) => console.log(`  ok    ${msg}`);
const fail = (msg) => {
  failures++;
  console.log(`  FAIL  ${msg}`);
};

console.log(`\nChecking ${URL}\n`);

/* ── tables ─────────────────────────────────────────────────────────────────── */

console.log("Tables");
for (const table of ["blogs", "blog_versions", "categories", "media"]) {
  const { error } = await db.from(table).select("*", { count: "exact", head: true });
  // A missing table reports PGRST205 / 42P01. An RLS refusal is NOT an error — it
  // returns an empty result — so reaching this point at all means the table exists.
  if (error && /does not exist|schema cache/i.test(error.message)) {
    fail(`${table} — not found. Did the migration run?`);
  } else if (error) {
    fail(`${table} — ${error.message}`);
  } else {
    pass(`${table}`);
  }
}

/* ── seeded data ────────────────────────────────────────────────────────────── */

console.log("\nSeed data");
{
  const { data, error } = await db
    .from("categories")
    .select("slug,name,sort_order")
    .order("sort_order")
    .order("name");
  if (error && /sort_order/.test(error.message)) {
    fail("categories — no `sort_order` column. Run 0002_categories.sql.");
  } else if (error) {
    fail(`categories — ${error.message}`);
  } else if (!data.length) {
    fail("categories — empty; the seed INSERT did not run");
  } else {
    pass(`categories (${data.length}) — ${data.map((c) => c.name).join(", ")}`);
    const placeholders = data.filter((c) =>
      ["brain-surgery", "spine-surgery", "patient-guides", "neurology"].includes(c.slug),
    );
    if (placeholders.length) {
      console.log(
        `  note  ${placeholders.length} placeholder categor${placeholders.length === 1 ? "y" : "ies"} from 0001 still present: ` +
          `${placeholders.map((c) => c.name).join(", ")}. Run 0002_categories.sql to retire them.`,
      );
    }
  }
}

/* ── storage ────────────────────────────────────────────────────────────────── */

console.log("\nStorage");
{
  const { error } = await db.storage.from("blog-images").list("", { limit: 1 });
  if (error) fail(`blog-images bucket — ${error.message}`);
  else pass("blog-images bucket is readable");
}

/* ── security ───────────────────────────────────────────────────────────────── */

console.log("\nSecurity (as an anonymous visitor)");
{
  // Writing must be refused. If this SUCCEEDS the row is real and public — the worst
  // possible outcome — so it is cleaned up immediately and reported loudly.
  const slug = `zz-rls-probe-${Date.now()}`;
  const { error } = await db.from("blogs").insert({ slug, title: "RLS probe" });
  if (error) {
    pass(`writes are refused (${error.code ?? "blocked"})`);
  } else {
    fail("ANONYMOUS WRITE SUCCEEDED — row level security is not protecting `blogs`");
    await db.from("blogs").delete().eq("slug", slug);
  }
}
{
  // Reading must return only visible rows. Anything else means a draft could leak.
  const { data, error } = await db.from("blogs").select("slug,status,publish_at");
  if (error) {
    fail(`reads — ${error.message}`);
  } else {
    const now = Date.now();
    const leaked = data.filter(
      (row) =>
        !["published", "scheduled"].includes(row.status) ||
        !row.publish_at ||
        Date.parse(row.publish_at) > now,
    );
    if (leaked.length) {
      fail(`${leaked.length} row(s) visible that should not be: ${leaked.map((r) => `${r.slug} [${r.status}]`).join(", ")}`);
    } else {
      pass(`reads return only visible posts (${data.length} visible right now)`);
    }
  }
}
{
  const { error } = await db.from("blog_versions").insert({ blog_id: crypto.randomUUID(), version: 1, snapshot: {} });
  if (error) pass("blog_versions writes are refused");
  else fail("ANONYMOUS WRITE to blog_versions SUCCEEDED");
}

/* ── auth ───────────────────────────────────────────────────────────────────── */

console.log("\nAuth");
{
  const probe = `zz-probe-${Date.now()}@example.com`;
  const { error } = await db.auth.signUp({ email: probe, password: crypto.randomUUID() });
  if (error && /disabled|not allowed/i.test(error.message)) {
    pass("public sign-ups are disabled");
  } else if (error) {
    console.log(`  note  sign-up returned: ${error.message}`);
  } else {
    fail(`PUBLIC SIGN-UPS ARE OPEN — anyone can create an account (created ${probe}; delete it in the dashboard)`);
  }
}

console.log(
  failures === 0
    ? "\nAll checks passed.\n"
    : `\n${failures} check(s) failed.\n`,
);
process.exit(failures === 0 ? 0 : 1);
