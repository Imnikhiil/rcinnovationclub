"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, LogIn } from "lucide-react";
import { fetchProfile, getSession, signIn, signOut } from "@/lib/admin-auth";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Already signed in? Go straight to the dashboard.
  useEffect(() => {
    let alive = true;
    void getSession().then((s) => {
      if (alive && s) router.replace("/admin");
    });
    return () => {
      alive = false;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) return setError("Enter your email and password.");

    setBusy(true);
    try {
      const session = await signIn(email.trim(), password);
      const profile = await fetchProfile(session);
      if (!profile) {
        await signOut();
        setError("This account is not an admin account. Ask the Super Admin to add you.");
        setBusy(false);
        return;
      }
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in. Please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-accent">
          <ArrowLeft size={16} /> Back to website
        </Link>
        <div className="card p-6 sm:p-8">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent-soft)] text-accent"><Lock size={22} /></span>
          <h1 className="mt-4 font-display text-2xl font-extrabold">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted">RC Innovation Club control panel</p>

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-email" className="label">Email</label>
              <input id="admin-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field" />
            </div>
            <div>
              <label htmlFor="admin-password" className="label">Password</label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="field !pr-12"
                />
                <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-accent">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error ? <p role="alert" className="msg-error">{error}</p> : null}
            <button type="submit" disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
              <LogIn size={17} /> {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}