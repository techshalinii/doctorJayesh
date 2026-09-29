import type { Metadata } from "next";
import { AdminAuthProvider } from "@/components/admin/auth-provider";
import { AdminNav } from "@/components/admin/nav";

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
