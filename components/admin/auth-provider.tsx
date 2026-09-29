"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { SUPABASE_CONFIGURED, supabaseBrowser } from "@/lib/supabase/client";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

interface AuthState {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(SUPABASE_CONFIGURED);
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login" || pathname === "/admin/login/";

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    const supabase = supabaseBrowser();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading || !SUPABASE_CONFIGURED) return;
    if (!session && !isLoginPage) router.replace("/admin/login/");
    if (session && isLoginPage) router.replace("/admin/");
  }, [session, loading, isLoginPage, router]);

  const signOut = async () => {
    if (SUPABASE_CONFIGURED) await supabaseBrowser().auth.signOut();
    router.replace("/admin/login/");
  };

  if (!SUPABASE_CONFIGURED) return <SetupNotice />;

  if (loading && !isLoginPage) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Loading…
      </div>
    );
  }

  if (!session && !isLoginPage) return null;

  return (
    <AuthContext.Provider value={{ session, loading, signOut }}>{children}</AuthContext.Provider>
  );
}

function SetupNotice() {
  const missing = [
    { name: "NEXT_PUBLIC_SUPABASE_URL", present: Boolean(SUPABASE_URL) },
    {
      name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      alt: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      present: Boolean(SUPABASE_PUBLISHABLE_KEY),
    },
  ];

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6 py-20">
      <h1 className="font-display text-2xl font-medium text-navy-900">CMS not configured</h1>

      <ul className="flex flex-col gap-1.5 text-sm">
        {missing.map((item) => (
          <li key={item.name} className="flex items-baseline gap-2">
            <span className={item.present ? "text-emerald-600" : "text-red-600"}>
              {item.present ? "✓" : "✗"}
            </span>
            <span>
              <code className="text-navy-900">{item.name}</code>
              {item.alt && (
                <>
                  {" "}
                  <span className="text-muted">
                    (or <code>{item.alt}</code>)
                  </span>
                </>
              )}
              <span className={item.present ? "text-muted" : "text-red-700"}>
                {item.present ? " — found" : " — not found"}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <p className="text-sm leading-relaxed text-muted">
        Set the missing value in your host&rsquo;s environment variables (on Vercel: Project →
        Settings → Environment Variables, for <em>Production</em>), or in <code>.env.local</code>{" "}
        when running locally. Both come from the Supabase dashboard under Project Settings → API
        Keys.
      </p>

      <p className="text-sm leading-relaxed text-muted">
        <strong>A redeploy is required.</strong> <code>NEXT_PUBLIC_</code> values are compiled into
        the JavaScript at build time, so adding one to an existing deployment changes nothing until
        the site is built again.
      </p>

      <p className="text-sm text-muted">
        The public site is unaffected — it serves the migrated markdown posts with or without these.
      </p>
    </div>
  );
}
