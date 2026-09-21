import type { Metadata } from "next";
import { AdminAuthProvider } from "@/components/admin/auth-provider";
import { AdminNav } from "@/components/admin/nav";

/**
 * The CMS dashboard shell.
 *
 * `noindex, nofollow` at the layout level covers every route beneath it, so a new admin
 * page can never be added without the tag. /robots.txt also disallows the prefix; the
 * two are independent defences and neither is load-bearing on its own — the real one is
 * that an anonymous visitor has no session and Row Level Security returns nothing.
 *
 * The public site's navbar, footer and WhatsApp button are suppressed here by
 * <SiteChrome> in the root layout.
 */
export const metadata: Metadata = {
  title: { absolute: "CMS · Dr. Jayesh Sardhara" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <div className="flex min-h-screen flex-col bg-surface">
        <AdminNav />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </AdminAuthProvider>
  );
}
