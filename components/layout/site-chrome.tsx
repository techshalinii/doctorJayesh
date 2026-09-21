"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the public site's chrome — navbar, footer, scroll progress, WhatsApp button —
 * on the `/admin` routes.
 *
 * The textbook answer is to split the app into `(site)` and `(admin)` route groups with
 * a root layout each. That would mean moving all 20 existing route folders and every
 * metadata file with them; the public site is the thing that must not break, so the
 * change that touches no public route wins instead.
 *
 * The chrome arrives as PROPS rather than being imported here, because <Footer> is a
 * server component and importing it into this client component would pull it — and its
 * data module — into the browser bundle of every page on the site.
 *
 * The cost of that choice, stated plainly: React serialises those props into the RSC
 * payload of the admin pages even though nothing renders them, so each admin page
 * carries a few KB of navbar and footer markup it never shows. That is paid by five
 * authenticated, low-traffic pages, whereas the alternatives are paid by every visitor
 * or by a 20-folder restructure. If /admin ever grows into something performance-
 * sensitive, the route-group split is the fix.
 *
 * Reverting is deleting this file and inlining the children again.
 */
export function SiteChrome({
  children,
  chrome,
}: {
  children: React.ReactNode;
  /** Navbar, footer and friends — rendered only outside /admin. */
  chrome: { top: React.ReactNode; bottom: React.ReactNode };
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  if (isAdmin) return <>{children}</>;

  return (
    <>
      {chrome.top}
      <main id="main" className="flex-1">
        {children}
      </main>
      {chrome.bottom}
    </>
  );
}
