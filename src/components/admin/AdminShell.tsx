"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { ExternalLink, LayoutDashboard, LogOut } from "lucide-react";
import { fetchProfile, getSession, signOut, type AdminProfile } from "@/lib/admin-auth";
import { ROLE_LABEL, sectionsFor } from "@/lib/admin-roles";

const Ctx = createContext<AdminProfile | null>(null);

/** The signed-in admin (only usable inside <AdminShell>). */
export function useAdmin(): AdminProfile {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdmin must be used inside <AdminShell>");
  return v;
}

type State = "loading" | "ready" | "denied" | "error";

/** Guards an admin page: signed out -> /admin/login; signed in but not an admin -> blocked. */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<State>("loading");
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setState("loading");
      const s = await getSession();
      if (!s) {
        router.replace("/admin/login");
        return;
      }
      try {
        const p = await fetchProfile(s);
        if (!alive) return;
        if (!p) return setState("denied");
        setProfile(p);
        setState("ready");
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [router, tries]);

  async function logout() {
    await signOut();
    router.replace("/admin/login");
  }

  if (state === "loading") {
    return <div className="grid min-h-screen place-items-center text-sm text-muted">Loading…</div>;
  }

  if (state === "denied" || state === "error") {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="card max-w-md p-7 text-center">
          <h1 className="font-display text-xl font-bold">{state === "denied" ? "No admin access" : "Could not load"}</h1>
          <p className="mt-2 text-sm text-muted">
            {state === "denied"
              ? "You are signed in, but this account is not an admin. Ask the Super Admin to add you."
              : "Something went wrong while loading your admin profile. Check your internet and try again."}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            {state === "error" ? <button type="button" onClick={() => setTries((t) => t + 1)} className="btn btn-primary">Try again</button> : null}
            <button type="button" onClick={logout} className="btn btn-ghost">Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  const me = profile!;
  const sections = sectionsFor(me.role);

  return (
    <Ctx.Provider value={me}>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="container-x flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-extrabold leading-tight">RC Admin</p>
            <p className="truncate text-[0.7rem] font-semibold uppercase tracking-widest text-accent">{ROLE_LABEL[me.role]}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/" target="_blank" className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs"><ExternalLink size={14} /> <span className="hidden sm:inline">View site</span></Link>
            <button type="button" onClick={logout} className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs"><LogOut size={14} /> <span className="hidden sm:inline">Sign out</span></button>
          </div>
        </div>
        <nav className="container-x pb-3" aria-label="Admin sections">
          <div className="chip-row !justify-start">
            <Link href="/admin" data-active={pathname === "/admin"} className="chip inline-flex items-center gap-1.5"><LayoutDashboard size={14} /> Dashboard</Link>
            {sections.map((s) =>
              s.ready ? (
                <Link key={s.key} href={s.href} data-active={pathname.startsWith(s.href)} className="chip">{s.label}</Link>
              ) : (
                <span key={s.key} aria-disabled className="chip cursor-not-allowed opacity-50" title="Coming soon">{s.label} · soon</span>
              ),
            )}
          </div>
        </nav>
      </header>
      <main className="container-x py-6 sm:py-10">{children}</main>
    </Ctx.Provider>
  );
}