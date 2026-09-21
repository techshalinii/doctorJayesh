import type { NextConfig } from "next";
import path from "node:path";

/**
 * Supabase Storage host for CMS featured images.
 *
 * Derived from the configured project URL rather than hardcoded, so a different
 * project (staging, a fresh clone) needs no edit here. With no URL configured the
 * list stays empty — `next/image` then only accepts the local paths the migrated
 * posts use, which is the correct behaviour when the CMS is off.
 */
function supabaseImagePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];
  try {
    const { hostname } = new URL(raw);
    return [{ protocol: "https", hostname, pathname: "/storage/v1/object/public/**" }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // Pin the workspace root so Next doesn't pick up an unrelated parent lockfile.
  turbopack: {
    root: path.resolve(),
  },

  images: {
    remotePatterns: supabaseImagePatterns(),
    // Next negotiates these by Accept header and falls back to the original on anything
    // that supports neither. The default is WebP alone; AVIF is listed first because it
    // is the smaller of the two at equal quality for the photography in the card grids.
    formats: ["image/avif", "image/webp"],
  },

  // WordPress served every URL with a trailing slash and the sitemap/canonicals still
  // reflect that. Matching it avoids a redirect hop on every indexed URL.
  trailingSlash: true,

  async redirects() {
    return [
      /**
       * `/contact-us/` is the ORIGINAL WordPress URL and keeps serving the page itself
       * (app/contact-us/page.tsx) — it is indexed and carries backlinks, so it was restored
       * to its own path rather than redirected away. `/contact/` is the newer path this
       * project briefly used; it redirects into the original so nothing that already links
       * to it breaks.
       */
      { source: "/contact", destination: "/contact-us/", permanent: true },

      // All 169 posts sit in the single "uncategorized" category, so this archive was a
      // duplicate of /blog/. Redirected rather than reproduced; the 301 preserves its equity.
      { source: "/category/uncategorized", destination: "/blog/", permanent: true },

      /**
       * Elementor header/footer template stubs. These were never real pages: the LIVE site
       * already answers both with `301 -> /`. Matching that keeps behaviour identical to
       * production instead of returning 404 where WordPress redirected.
       */
      { source: "/elementor-hf/header", destination: "/", permanent: true },
      { source: "/elementor-hf/footer", destination: "/", permanent: true },
    ];
  },

  /**
   * Migrated WordPress media lives in Cloudflare R2, not in the repo — see
   * _migration/R2-SETUP.md and _migration/IMAGE-HOSTING-OPTIONS.md.
   *
   * The rewrite keeps the ORIGINAL `/wp-content/uploads/...` paths working, so every
   * inbound link, every `content/*.md` reference and anything Google Images has indexed
   * continues to resolve. It is invisible to visitors and crawlers.
   *
   * With R2_PUBLIC_BASE unset (local dev), no rewrite is registered and the files are
   * served straight from `public/`, which is where they already are.
   */
  async rewrites() {
    const base = process.env.R2_PUBLIC_BASE?.replace(/\/$/, "");
    if (!base) return [];
    return [
      {
        source: "/wp-content/uploads/:path*",
        destination: `${base}/wp-content/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

/**
 * On _migration/03-server-files/htaccess — deliberately NOT ported.
 *
 * That file contains three kinds of RewriteRule, none of which belongs here:
 *
 * 1. A cloaking rule that rewrites `^$` to `amp.php` for Googlebot user agents or any
 *    visitor arriving with a `google.` referer. This is the SEO-parasite hack documented
 *    in _migration/INVENTORY.md §8 — it served different content to Google than to real
 *    users. It is malware, not configuration, and must never be reproduced.
 * 2. Hardening rules blocking `wp-admin/includes/`, `wp-includes/*.php` and
 *    `theme-compat/`. These protect PHP files that do not exist in a Next.js app.
 * 3. The standard WordPress front-controller rule routing everything to `index.php`.
 *    Superseded by Next's own routing.
 *
 * So the redirect table above is exactly the two `action=redirect` rows from url-map.csv
 * and nothing else. There are no legitimate legacy rewrites to preserve.
 */
