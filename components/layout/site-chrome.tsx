"use client";

import { usePathname } from "next/navigation";

export function SiteChrome({
  children,
  chrome,
}: {
  children: React.ReactNode;
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
