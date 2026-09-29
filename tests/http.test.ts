import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "";

const canSeed = Boolean(SUPABASE_URL && SUPABASE_KEY && ADMIN_EMAIL && ADMIN_PASSWORD);
const SKIP_SEED = canSeed
  ? false
  : "needs NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD";

const REVALIDATE_WAIT_MS = 75_000;

interface Fetched {
  status: number;
  body: string;
  redirected: string | null;
}

async function get(pathname: string, init?: RequestInit): Promise<Fetched> {
  const response = await fetch(`${BASE}${pathname}`, { redirect: "follow", ...init });
  return {
    status: response.status,
    body: await response.text(),
    redirected: response.redirected ? new URL(response.url).pathname : null,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const STAMP = Date.now();
const slugFor = (name: string) => `zz-acceptance-${name}-${STAMP}`;

let db: SupabaseClient | null = null;
const seeded: string[] = [];

async function seed(fields: Record<string, unknown>): Promise<string> {
  const slug = fields.slug as string;
  const { error } = await db!.from("blogs").insert({
    title: `Acceptance ${slug}`,
    excerpt: "Seeded by the acceptance suite.",
    content: [{ type: "paragraph", text: "Seeded body." }],
    read_time: 1,
    ...fields,
  });
  if (error) throw new Error(`seed failed for ${slug}: ${error.message}`);
  seeded.push(slug);
  return slug;
}

describe("no secret is served to the browser (acceptance 6)", () => {
  function clientFiles(): string[] {
    const roots = [path.join(process.cwd(), ".next", "static")];
    const found: string[] = [];
    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(js|mjs|css|json|map)$/.test(entry.name)) found.push(full);
      }
    };
    roots.forEach(walk);
    return found;
  }

  it("has a build to inspect", () => {
    assert.ok(
      clientFiles().length > 0,
      "No .next/static output found — run `npm run build` before this suite.",
    );
  });

  it("ships no service-role key and no REVALIDATE_SECRET", () => {
    const patterns: [string, RegExp][] = [
      ["sb_secret_ key", /sb_secret_[A-Za-z0-9_-]{10,}/],
      ["service_role JWT", /"role"\s*:\s*"service_role"/],
      ["service_role JWT (encoded)", /eyJ[A-Za-z0-9_-]*cm9sZSI6InNlcnZpY2Vfcm9sZS/],
      ["SUPABASE_SERVICE_ROLE_KEY reference", /SUPABASE_SERVICE_ROLE_KEY/],
      ["REVALIDATE_SECRET reference", /REVALIDATE_SECRET/],
      ["Anthropic key", /sk-ant-[A-Za-z0-9-]{10,}/],
      ["Gemini key", /AIza[A-Za-z0-9_-]{30,}/],
      ["GEMINI_API_KEY read in client code", /process\.env\.GEMINI_API_KEY/],
    ];

    const offences: string[] = [];
    for (const file of clientFiles()) {
      const contents = fs.readFileSync(file, "utf8");
      for (const [label, pattern] of patterns) {
        if (pattern.test(contents)) offences.push(`${label} in ${path.relative(process.cwd(), file)}`);
      }
    }
    assert.deepEqual(offences, [], `Secrets found in client-served files:\n${offences.join("\n")}`);
  });

  it("serves no secret in the HTML of a public page either", async (t) => {
    let page: Fetched;
    try {
      page = await get("/blog/");
    } catch {
      t.skip(`no server reachable at ${BASE}`);
      return;
    }
    assert.equal(/sb_secret_|service_role|REVALIDATE_SECRET|sk-ant-/.test(page.body), false);
  });
});

describe("AI routes require an authenticated admin", () => {
  const ROUTES = [
    "/api/admin/ai/generate-blog/",
    "/api/admin/ai/generate-topics/",
    "/api/admin/ai/research-topics/",
    "/api/admin/ai/review-blog/",
    "/api/admin/ai/monthly-run/",
    "/api/admin/ai/content-brain/",
  ];

  for (const route of ROUTES) {
    it(`refuses an anonymous POST to ${route}`, async (t) => {
      let response: Fetched;
      try {
        response = await get(route, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ topic: "A topic that must never be generated" }),
        });
      } catch {
        t.skip(`no server reachable at ${BASE}`);
        return;
      }
      assert.equal(response.status, 401, `${route} answered ${response.status} without a session`);
      assert.equal(/contentMarkdown|"blog"\s*:/.test(response.body), false);
    });
  }

  it("refuses a forged bearer token", async (t) => {
    let response: Fetched;
    try {
      response = await get("/api/admin/ai/generate-blog/", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer not-a-real-token" },
        body: JSON.stringify({ topic: "A topic that must never be generated" }),
      });
    } catch {
      t.skip(`no server reachable at ${BASE}`);
      return;
    }
    assert.equal(response.status, 401);
  });

  it("does not leak the provider or model to an anonymous caller", async (t) => {
    let response: Fetched;
    try {
      response = await get("/api/admin/ai/content-brain/");
    } catch {
      t.skip(`no server reachable at ${BASE}`);
      return;
    }
    assert.equal(response.status, 401);
    assert.equal(/gemini|AIza/i.test(response.body), false);
  });
});

describe("resilience and routing", () => {
  it("renders the blog listing (acceptance 5: no 500 when the CMS is unavailable)", async (t) => {
    let page: Fetched;
    try {
      page = await get("/blog/");
    } catch {
      t.skip(`no server reachable at ${BASE}`);
      return;
    }
    assert.equal(page.status, 200);
    assert.ok(page.body.includes("Insights for brain"), "listing did not render its heading");
    assert.ok(page.body.includes("/bulging-disc-vs-herniated-disc/"), "migrated posts are missing");
  });

  it("serves a migrated article", async (t) => {
    let page: Fetched;
    try {
      page = await get("/bulging-disc-vs-herniated-disc/");
    } catch {
      t.skip(`no server reachable at ${BASE}`);
      return;
    }
    assert.equal(page.status, 200);
    assert.ok(page.body.includes("Bulging Disc"));
  });

  it("still serves the migrated root PAGES, not just the posts", async (t) => {
    const pages = ["brain-tumor", "fellowship", "surgeries", "thank-you"];
    let first: Fetched;
    try {
      first = await get(`/${pages[0]}/`);
    } catch {
      t.skip(`no server reachable at ${BASE}`);
      return;
    }
    assert.equal(first.status, 200, `/${pages[0]}/ did not resolve`);
    for (const slug of pages.slice(1)) {
      assert.equal((await get(`/${slug}/`)).status, 200, `/${slug}/ did not resolve`);
    }
  });

  it("returns a real 404 for an unknown slug, not a soft 200 (acceptance 7)", async (t) => {
    let page: Fetched;
    try {
      page = await get(`/definitely-not-a-post-${STAMP}/`);
    } catch {
      t.skip(`no server reachable at ${BASE}`);
      return;
    }
    assert.equal(page.status, 404);
  });

  it("serves a sitemap containing the migrated posts", async (t) => {
    let page: Fetched;
    try {
      page = await get("/sitemap.xml");
    } catch {
      t.skip(`no server reachable at ${BASE}`);
      return;
    }
    assert.equal(page.status, 200);
    assert.ok(page.body.includes("<urlset"));
    assert.ok(page.body.includes("/bulging-disc-vs-herniated-disc/"));
  });

  it("keeps the admin out of the index", async (t) => {
    let robots: Fetched;
    try {
      robots = await get("/robots.txt");
    } catch {
      t.skip(`no server reachable at ${BASE}`);
      return;
    }
    assert.ok(robots.body.includes("Disallow: /admin"));
  });

  it("refuses an unauthenticated revalidation", async (t) => {
    let response: Response;
    try {
      response = await fetch(`${BASE}/api/revalidate/`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
    } catch {
      t.skip(`no server reachable at ${BASE}`);
      return;
    }
    assert.equal(response.status, 401);
  });
});

describe("published, scheduled and hidden posts", { skip: SKIP_SEED }, () => {
  const draft = slugFor("draft");
  const archived = slugFor("archived");
  const future = slugFor("future");
  const past = slugFor("past");
  const live = slugFor("live");

  before(async () => {
    db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
    const { error } = await db.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    if (error) throw new Error(`could not sign in as ${ADMIN_EMAIL}: ${error.message}`);

    const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const hourAhead = new Date(Date.now() + 3_600_000).toISOString();

    await seed({ slug: draft, status: "draft" });
    await seed({ slug: archived, status: "archived", publish_at: hourAgo });
    await seed({ slug: future, status: "scheduled", publish_at: hourAhead });
    await seed({ slug: past, status: "scheduled", publish_at: hourAgo });
    await seed({ slug: live, status: "published", publish_at: hourAgo });

    await sleep(REVALIDATE_WAIT_MS);
  });

  after(async () => {
    if (!db) return;
    for (const slug of seeded) await db.from("blogs").delete().eq("slug", slug);
  });

  it("hides drafts, archived and future-scheduled posts everywhere (acceptance 1)", async () => {
    const [listing, sitemap] = await Promise.all([get("/blog/"), get("/sitemap.xml")]);

    for (const slug of [draft, archived, future]) {
      assert.equal(listing.body.includes(slug), false, `${slug} appeared in the listing`);
      assert.equal(sitemap.body.includes(slug), false, `${slug} appeared in the sitemap`);

      const page = await get(`/${slug}/`);
      assert.equal(page.status, 404, `${slug} was reachable at its URL`);
    }
  });

  it("serves a scheduled post whose time has passed, with no status change (acceptance 2)", async () => {
    const page = await get(`/${past}/`);
    assert.equal(page.status, 200);

    const { data } = await db!.from("blogs").select("status").eq("slug", past).single();
    assert.equal((data as { status: string }).status, "scheduled");

    const listing = await get("/blog/");
    assert.ok(listing.body.includes(past), "the due post is missing from the listing");

    const sitemap = await get("/sitemap.xml");
    assert.ok(sitemap.body.includes(past), "the due post is missing from the sitemap");
  });

  it("serves a published post", async () => {
    assert.equal((await get(`/${live}/`)).status, 200);
  });

  it("makes a newly published post live within the cache window (acceptance 3)", async () => {
    const slug = slugFor("publish-now");
    await seed({ slug, status: "draft" });
    assert.equal((await get(`/${slug}/`)).status, 404);

    await db!
      .from("blogs")
      .update({ status: "published", publish_at: new Date().toISOString() })
      .eq("slug", slug);

    await sleep(REVALIDATE_WAIT_MS);
    assert.equal((await get(`/${slug}/`)).status, 200);
  });

  it("orders the listing newest-first across both sources (acceptance 4)", async () => {
    const listing = await get("/blog/");

    const slugs = [...listing.body.matchAll(/href="\/([a-z0-9-]+)\/"/g)]
      .map((m) => m[1])
      .filter((s) => !["blog", "about", "appointment", "contact-us", "conditions"].includes(s));

    const seen = new Set<string>();
    const ordered = slugs.filter((s) => (seen.has(s) ? false : seen.add(s)));

    const seededIndex = ordered.indexOf(live);
    const oldIndex = ordered.indexOf("bulging-disc-vs-herniated-disc");
    assert.ok(seededIndex >= 0, "the seeded live post is missing from the listing");
    assert.ok(oldIndex >= 0, "the migrated article is missing from the listing");
    assert.ok(
      seededIndex < oldIndex,
      `expected the recent post (index ${seededIndex}) above the 2023 one (index ${oldIndex})`,
    );
  });
});
