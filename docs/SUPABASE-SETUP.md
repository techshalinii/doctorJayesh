# Supabase setup — click-by-click

Written for whoever creates the Supabase project. Takes about 10 minutes. No coding.

At the end you hand back **four values**, listed in §6.

---

## 1. Create the project

1. Go to <https://supabase.com/dashboard> and sign in.
2. **New project**.
   - **Name**: `drjayeshsardhara`
   - **Database Password**: click Generate, then **save it in your password manager**.
     You will not be shown it again. (The app does not use it — it is for direct database
     access if you ever need it.)
   - **Region**: **South Asia (Mumbai) — `ap-south-1`**. The audience is in India; any
     other region adds latency to every page.
3. **Create new project**, then wait ~2 minutes for it to finish provisioning.

---

## 2. Create the tables

1. Left sidebar → **SQL Editor** → **New query**.
2. Open the file `supabase/migrations/0001_blog_cms.sql` from this repository, select
   **all** of it, and paste it into the editor.
3. Click **Run** (or Ctrl/Cmd + Enter).
4. You should see **Success. No rows returned**.
5. Repeat steps 1–3 with `supabase/migrations/0002_categories.sql`, which installs the
   19 real topics and retires the placeholders from 0001.

Run them **in order**, and run every numbered file in `supabase/migrations/` — that
folder is the full history of the database.

If you see an error, copy the whole message and send it back — do not re-run and do not
edit the SQL. (Re-running is otherwise safe: the script is written to be repeatable.)

**What it just created** — you can check under **Table Editor**:

| | |
| --- | --- |
| `blogs` | the posts |
| `blog_versions` | a snapshot before every save, for undo |
| `categories` | the topic list (19 after 0002) |
| `media` | one row per uploaded image |

…plus a **Storage** bucket called `blog-images`, and the security rules that keep drafts
private.

---

## 3. Turn OFF public sign-ups

**This step matters.** Without it, anyone who finds the login page can create themselves
an account that can publish to the website.

1. Left sidebar → **Authentication** → **Sign In / Providers** (older dashboards:
   **Providers**).
2. **Email** should be **enabled**. Leave it on.
3. Find **"Allow new users to sign up"** and turn it **OFF**.
4. Save.

---

## 4. Create the login for the doctor / content team

1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. Enter the email and a strong password.
3. Tick **Auto Confirm User** (otherwise they must click a confirmation email first).
4. **Create user**.

Repeat for each person who should be able to write posts. Anyone listed here can publish;
there is no separate permission step.

---

## 5. Copy the two values the website needs

1. Left sidebar → **Project Settings** (the gear) → **API Keys**.
   On some dashboards this is **Project Settings → API**, or **Data API**.

2. Copy these two:

   | On screen | Looks like |
   | --- | --- |
   | **Project URL** | `https://abcdefghijklm.supabase.co` |
   | **Publishable key** — older dashboards call it **anon** / **public** | `sb_publishable_xxxxxxxx…` or a long string starting `eyJhbGciOi…` |

⚠️ **Do NOT copy the `service_role` / `secret` key.** It is on the same page and it is
deliberately not used anywhere in this project. If you send it by accident, click
**Reset** on that key in the dashboard so the exposed one stops working.

The two values above are safe to share: they are already visible in the website's own
JavaScript, and the database's security rules are what actually protect the content. An
anonymous visitor holding them can read exactly the published posts they could read by
visiting the site.

---

## 6. What to hand back

Send these four, or paste them straight into a file called `.env.local` in the project
root (it is git-ignored, so it never reaches GitHub):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxx

# The login you made in step 4 — needed only to run the automated tests
TEST_ADMIN_EMAIL=someone@example.com
TEST_ADMIN_PASSWORD=…
```

`.env.example` in the project root lists the rest (all optional, all generated locally).

**Deploying to Vercel (or any host):** put the same two values in the host's environment
variables, scoped to **Production**, and then **redeploy**. `NEXT_PUBLIC_` values are
compiled into the JavaScript when the site is built, so adding one to a deployment that
already exists changes nothing until it is rebuilt. If `/admin` still says "CMS not
configured" afterwards, it will name the exact variable it could not find.

---

## 7. Optional — better AI wording in the SEO helper

The editor scores every SEO title and meta description and suggests rewrites. **This
works with no API key**: without one the suggestions come from a built-in generator.

With a key, the wording is written by a model instead (the rules that check it are the
same either way). If you want that, add **one** of:

- `ANTHROPIC_API_KEY` — from <https://console.anthropic.com> → API Keys
- `GEMINI_API_KEY` — from <https://aistudio.google.com/apikey>

These are real secrets. They are used only on the server and never sent to the browser.

---

## 8. Verify it

From the project root, once `.env.local` exists:

```bash
npm run check:supabase
```

It connects with the **publishable** key — the same one the website and the browser hold —
so what it reports is exactly what an anonymous visitor can reach. It confirms the four
tables, the seeded categories, the storage bucket, that anonymous writes are refused,
that reads return only published posts, and that public sign-ups are off.

Expected output ends with `All checks passed.`

---

## 9. Checklist

- [ ] Project created in **Mumbai (`ap-south-1`)**, database password saved
- [ ] every file in `supabase/migrations/` run in order — each "Success. No rows returned"
- [ ] `blogs`, `blog_versions`, `categories`, `media` visible in Table Editor
- [ ] `blog-images` bucket visible under Storage
- [ ] **"Allow new users to sign up" is OFF**
- [ ] At least one user created, Auto Confirm ticked
- [ ] Project URL + **publishable** key copied (NOT the service_role key)
- [ ] `npm run check:supabase` prints **All checks passed**
