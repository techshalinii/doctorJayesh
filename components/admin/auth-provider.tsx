"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { SUPABASE_CONFIGURED, supabaseBrowser } from "@/lib/supabase/client";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Session state for the dashboard, plus the redirect that keeps signed-out visitors
 * out of it.
 *
 * This guard is a convenience, not the security boundary. Row Level Security is — the
 * anon key in this bundle can only ever read posts the public could already see, so
 * defeating the redirect gains an attacker an empty table, not the content. That is
 * why an entirely client-side admin is safe to ship here.
 */

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
  // Resolved in the initialiser rather than by an effect: with no credentials there is
  // nothing to wait for, and setting it from inside the effect would be a synchronous
  // state update during mount.
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

  // The login page renders immediately, without waiting for the session lookup: it is
  // the same form either way, and holding it back showed "Loading…" to everyone signing
  // in — including in the server-rendered HTML. If a session does turn up, the effect
  // above redirects to the dashboard.
  if (loading && !isLoginPage) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Loading…
      </div>
    );
  }

  // Render nothing rather than a flash of the dashboard while the redirect runs.
  if (!session && !isLoginPage) return null;

  return (
    <AuthContext.Provider value={{ session, loading, signOut }}>{children}</AuthContext.Provider>
  );
}

/**
 * Shown when the project has no Supabase credentials, instead of a broken login.
 *
 * It reports WHICH value is missing, and covers hosted deployments as well as local
 * development. The first version of this notice talked only about `.env.local` and
 * restarting the dev server, which is no help at all to someone looking at it on a
 * production URL — and it did not say which of the two names had not been found, which
 * is the one fact that actually resolves the problem.
 */
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
