# Blog CMS — setup and operation

The site serves blog posts from two places:

- **`content/*.md`** — the 180 articles migrated from WordPress. Byte-identical to what
  Google indexed, served from disk, not editable through the CMS.
- **Supabase** — everything written since, through `/admin`.

They merge in `lib/cms/public.ts`, and **on a slug clash the markdown file wins**. Those
URLs are indexed and carry backlinks; a new post can never take one over.

---

## 1. Supabase setup

> Handing this to someone else to click through? Give them
> [`SUPABASE-SETUP.md`](./SUPABASE-SETUP.md) instead — same steps, written for a
> non-developer, with a checklist at the end.

### Create the project

Region **`ap-south-1` (Mumbai)** — the audience is in India. Save the database password.

### Run the migration

Dashboard → **SQL Editor** → New query → paste each file in
[`supabase/migrations/`](../supabase/migrations/) **in numerical order** → **Run**.

Each is idempotent, so re-running is safe.

- `0001_blog_cms.sql` — schema, security rules, storage bucket
- `0002_categories.sql` — the 19 topics, and a `sort_order` column so they are not
  listed alphabetically
- `0003_ai_generator.sql` — the AI generator's five tables. Purely additive: it does not
  alter `blogs`, `blog_versions`, `categories` or `media`, and it does not go near
  `blog_is_visible()` or the public read policy

Together they create:

| Object | Purpose |
| --- | --- |
| `blogs` | Posts. Columns mirror `BlogRow` in `lib/cms/types.ts`. |
| `blog_versions` | A snapshot before every save, for the editor's History panel. |
| `categories` | The 19 topics; edit them at `/admin/categories`. |
| `media` | One row per upload, describing a file in the `blog-images` bucket. |
| `blog_is_visible()` | The visibility rule, in SQL. |
| RLS policies | Anonymous readers get visible posts only; `authenticated` gets everything. |
| Storage bucket `blog-images` | Public read, authenticated write. Created by the script. |

### Create the admin user

Authentication → **Providers** → Email: enabled, and turn **"Allow new users to sign up"
OFF**. There is no sign-up link in the app, and this closes the API path too.

Then Authentication → Users → **Add user** → email + password, "Auto Confirm" on.

No further step: the RLS policies grant write access to any confirmed user, and sign-ups
are disabled, so the users you create by hand are the complete list of authors.

---

## 2. Environment

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where it comes from | Secret? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL | no |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | same page — `sb_publishable_…`, or the legacy "anon public" JWT. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted as an alias. | no |
| `NEXT_PUBLIC_SITE_URL` | `https://drjayeshsardhara.com` | no |
| `CMS_ENABLED` | `true`, or `false` to roll the whole CMS back | no |
| `REVALIDATE_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | **yes** |
| `ANTHROPIC_API_KEY` *or* `GEMINI_API_KEY` | optional — better wording in the SEO Suggest panel | **yes** |

**There is no service-role key in this project, by design.** Public pages read with the
publishable key, so the rendering process physically cannot return a draft. Admin writes
carry the signed-in user's own JWT. Nothing needs to bypass RLS, so nothing holds a key
that could — and `tests/http.test.ts` fails the build if a secret ever reaches a
browser-served file.

With no credentials at all the site still builds and runs; it just serves the 180
migrated posts, exactly as it did before the CMS existed.

### Deploying

`NEXT_PUBLIC_*` values are compiled into the JavaScript **at build time**, not read at
run time. Adding or changing one on the host does nothing to a deployment that already
exists — the site has to be built again. On Vercel: Project → Settings → Environment
Variables (scope it to **Production**), then Deployments → ⋯ → **Redeploy**.

`/admin` names whichever value it cannot find, so the page itself tells you which one to
fix.

---

## 3. How publishing works

### The one rule

```
status IN ('published','scheduled')  AND  publish_at <= now()
```

Defined once, in [`lib/cms/visibility.ts`](../lib/cms/visibility.ts), and enforced a
second time in Postgres by `blog_is_visible()` and the `blogs_public_read` policy. The
listing, the article route, the sitemap and the related-post lookup all go through it.

**A scheduled post goes live because the clock moved.** No cron flips `scheduled` →
`published`; nothing changes in the database at the moment it appears.

Two timestamps, easily confused:

- **`publish_at`** — the date the author set. Drives visibility, the displayed date and
  all ordering. (The sitemap's `lastmod` is `updated_at`, which is what that tag means.)
- **`published_at`** — an internal "first went live" stamp. Never used for visibility. It
  exists so re-publishing an edited article does not move it to the top of the blog.

### Getting a change onto the site

Pages use ISR with `revalidate = 60`, so anything becomes visible within a minute on its
own. Publishing from `/admin` also calls `POST /api/revalidate`, which drops the affected
pages immediately.

That endpoint accepts either a signed-in admin's access token (what the dashboard sends)
or `Authorization: Bearer $REVALIDATE_SECRET` (for a deploy hook or a manual call):

```bash
curl -X POST https://drjayeshsardhara.com/api/revalidate/ \
  -H "Authorization: Bearer $REVALIDATE_SECRET" \
  -H "content-type: application/json" \
  -d '{"slugs":["my-post"]}'
```

---

## 4. Using the dashboard

`/admin` — sign in with the user you created.

- **Posts** — status tabs, category filter, search. Sorted by publish date, newest first.
  Row actions: Edit, Preview, Duplicate, Publish, Archive, Delete.
- **Editor** — title, slug, excerpt, rich-text body, FAQ, related posts, featured image,
  and the SEO panel. Autosaves every 30 seconds once the post exists.
- **Import Markdown** — paste or drop a `.md` draft and every field fills in. Reads YAML
  frontmatter and a leading `<!-- Key: value -->` block; `Primary query:` becomes the
  focus keyword, a `## FAQ` section becomes FAQ items, `## Related` becomes related links.
  **The SEO title is only ever taken from an explicit `SEO title:` line** — it is left
  blank rather than copied from the H1, and the import summary says so.
- **Publish now** — no confirmation dialog. Reversible by archiving.
- **Schedule** — date, time and zone (default Asia/Kolkata), converted to UTC. Past times
  are refused.
- **Slugs freeze** once a post has been public. If you unlock and change one anyway, the
  old slug is kept and 308s to the new one.
- **Categories** — 19 topics, in a fixed editorial order rather than alphabetical. Note
  that the filter row on `/blog/` is built from the categories posts actually **use**, not
  from the whole table: an unused topic shows no chip, because a chip that returns nothing
  is worse than no chip.
- **Reserved slugs** — the editor warns if you pick a slug the site already serves from
  somewhere else: a migrated post, one of the migrated pages (`brain-tumor`,
  `fellowship`, `surgeries`, `thank-you`), or a hand-built route such as `/appointment/`.
  Those always win, so a post there would be listed and submitted to Google while its URL
  showed a different page.

### The SEO score

A 0–100 score under the SEO title and meta description, recomputed on every keystroke by
[`lib/cms/seo-score.ts`](../lib/cms/seo-score.ts). It is pure and rule-based — every
point traces to a named rule, and the panel shows which rules failed, why each rule
exists, and what is currently wrong.

Bands: **80–100** good, **50–79** needs work, **under 50** poor.

Below 80 a **Suggest** button appears. It lists each failing rule with its reason and
offers three rewrites built from the post's own title, excerpt and focus keyword. With an
API key configured the wording comes from a model; without one it comes from the built-in
generator. Either way **every option is re-scored by the same rules before you see it**,
and each is shown with its character count and a tick per rule it passes.

Keyword rules need a **focus keyword** — the query the post targets. Nothing guesses one;
without it those rules say so instead of failing on merit.

---

## 5. The AI blog generator

An **addition** to everything above, not a replacement for any of it. A generated post is
an ordinary row in `blogs`: it is edited in the same editor, scored by the same SEO rules,
scheduled by the same scheduler and published by the same rule. Nothing in this feature
can publish.

### The flow

```
/admin/generate → Gemini → draft in `blogs` → existing editor → Schedule → existing publishing
```

The generator returns values; the **browser** then calls the same `createBlog()` the
editor's Save button uses. There is one way a post comes into existence and the generator
uses it rather than adding a second.

### Content Brain — `/admin/content-brain`

The 180 migrated markdown articles are **never** sent to a model per generation. They are
analysed once into a stored profile — tone, structure, heading habits, topic clusters,
content gaps, SEO patterns, image style — and each generation is handed that profile
instead. Even the one analysis is sampled (45 articles, evenly spread and deterministic):
past a few dozen, more input stops improving a description of a house style.

Refresh it after a batch of new posts, or whenever the writing has moved on. Nothing is
sent to a model until you press the button.

### Duplicate detection

Runs **locally**, against the full corpus — markdown and Supabase, drafts included — and
costs nothing, so the Generate page checks it as you type. Titles, slugs, excerpts and
focus keywords are compared; an exact slug collision reports at 100%. It never blocks:
it shows what exists and offers *Use a different topic* or *Continue anyway*.

### Provider abstraction

Only `lib/ai/gemini.ts` knows Gemini exists. Everything else talks to the `AIProvider`
interface in `lib/ai/types.ts`.

```
AI_PROVIDER=gemini   the real thing; needs GEMINI_API_KEY
AI_PROVIDER=mock     answers locally — no network, no key, no quota
(unset)              gemini when a key exists, otherwise mock
```

The Generate page states which is live, and labels mock output loudly. Every model reply
is validated with Zod and retried once; a reply that still will not validate fails the job
rather than being saved.

### Partial failure

Only failing to write the **article** fails a run. Image suggestions, SEO repair and the
three review passes each record their step and carry on, because the article is the
expensive part and must not be thrown away with them.

### Review, and what it does not do

Three passes — grammar, style, medical. The medical pass flags claims a clinician should
verify; the prompt forbids inventing citations, so an empty source list is the expected
answer. **Findings block nothing.** They are shown in the editor and stored with the post;
publishing remains a human action and the visibility rule does not read them.

### Images

Prompts and alt text only. Nothing here generates an image file, and no placeholder is
ever attached as though it were a photograph. Copy the prompt, make the image in your own
tool, upload it through the existing media picker.

Generating images in the CMS was built and removed on 2026-09-23: Gemini bills image
models separately from text, and the practice would rather draw them elsewhere than carry
a per-image cost here. `lib/ai/types.ts` keeps `generateImageSuggestions`, which is the
text half and stays.

### Monthly batch

`/admin/generate → Monthly topics` proposes ~14 candidates, shortlists four across a mix
of intents, and lets you approve, edit or reject each before anything is written.

It is **started by hand**, and that is a consequence of this CMS's security model rather
than an omission: every write is made as the signed-in admin under RLS and there is no
service-role key in the project, so a timer has no identity to write as. `ai_settings`
records the schedule and the page shows when a run is due. `auto_publish` defaults to
false and a database constraint forbids setting it while `approval_required` is on.

### What it does not touch

`content/*.md` is never written, converted or edited. Generated posts go to Supabase only.

---

## 6. Tests

```bash
npm run check:supabase   # confirms the project's schema and security rules,
                         # including the AI generator's five tables
npm test          # 82 unit tests — visibility, SEO scoring, import, rendering, timezones,
                  #                  and the AI generator (against the mock provider)
npm run build && npm start
npm run test:http # acceptance tests against the running site
```

`test:http` seeds and removes its own rows when given `TEST_ADMIN_EMAIL` and
`TEST_ADMIN_PASSWORD`; without them the database-backed suite **skips with a printed
reason** rather than passing silently. The credential-leak check needs neither and always
runs.

---

## 7. Rolling back

Set `CMS_ENABLED=false` and redeploy. Every reader short-circuits, no Supabase call is
made anywhere, and the site serves the migrated markdown exactly as before. No data is
lost; setting it back to `true` restores everything.
