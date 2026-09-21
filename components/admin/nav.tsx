"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, FileText, FolderTree, ImageIcon, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/components/admin/auth-provider";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/blogs/", label: "Posts", icon: FileText },
  { href: "/admin/media/", label: "Media", icon: ImageIcon },
  { href: "/admin/categories/", label: "Categories", icon: FolderTree },
] as const;

export function AdminNav() {
  const pathname = usePathname() ?? "";
  const { session, signOut } = useAuth();

  // Hidden on the login page — there is nothing to navigate to yet.
  if (pathname.startsWith("/admin/login")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/admin/" className="font-display text-base font-medium text-navy-900">
          CMS
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            // `/admin/` would otherwise match every child route.
            const active = href === "/admin/" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-navy-900 text-white" : "text-muted hover:bg-surface hover:text-navy-900",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 text-xs text-muted">
          <a
            href="/blog/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-navy-900"
          >
            View site <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {session?.user.email && <span className="hidden sm:inline">{session.user.email}</span>}
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-surface hover:text-navy-900"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
