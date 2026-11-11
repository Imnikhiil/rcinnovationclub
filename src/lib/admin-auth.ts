/**
 * Admin sign-in with Supabase Auth over plain REST (no extra npm package).
 * - Passwords are checked by Supabase, never by this website.
 * - Every data request carries the admin's own token, and Supabase Row Level Security
 *   (supabase/schema.sql + supabase/admin-hardening.sql) decides what that person may read or write.
 *   The role checks in the UI only hide buttons; they are NOT the security.
 */
import { isAdminRole, type AdminRole } from "@/lib/admin-roles";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const STORE = "rc-admin-session";

export interface AdminSession {
  access_token: string;
  refresh_token: string;
  /** seconds since epoch */
  expires_at: number;
  user: { id: string; email: string };
}

export interface AdminProfile {
  id: string;
  email: string;
  username?: string | null;
  role: AdminRole;
  display_name?: string | null;
}

function save(s: AdminSession | null) {
  try {
    if (s) localStorage.setItem(STORE, JSON.stringify(s));
    else localStorage.removeItem(STORE);
  } catch {
    /* storage blocked: the visitor just has to sign in again */
  }
}

function load(): AdminSession | null {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

async function tokenRequest(grant: "password" | "refresh_token", body: Record<string, string>): Promise<AdminSession> {
  if (!URL_ || !KEY) throw new Error("The backend is not configured (missing Supabase environment variables).");
  let res: Response;
  try {
    res = await fetch(`${URL_}/auth/v1/token?grant_type=${grant}`, {
      method: "POST",
      headers: { apikey: KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Network error. Check your internet connection.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.msg || data.message || "Could not sign in.");
  }
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at ?? Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    user: { id: data.user.id, email: data.user.email },
  };
}

export async function signIn(email: string, password: string): Promise<AdminSession> {
  const s = await tokenRequest("password", { email, password });
  save(s);
  return s;
}

let refreshing: Promise<AdminSession | null> | null = null;

/** Returns a valid session (refreshing it when it is about to expire) or null. Safe to call many times at once. */
export async function getSession(): Promise<AdminSession | null> {
  const s = load();
  if (!s) return null;
  if (s.expires_at - Math.floor(Date.now() / 1000) > 60) return s;

  if (!refreshing) {
    refreshing = tokenRequest("refresh_token", { refresh_token: s.refresh_token })
      .then((n) => {
        save(n);
        return n;
      })
      .catch(() => {
        save(null);
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export async function signOut(): Promise<void> {
  const token = load()?.access_token;
  save(null);
  if (token && URL_ && KEY) {
    try {
      await fetch(`${URL_}/auth/v1/logout`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${token}` } });
    } catch {
      /* already signed out locally */
    }
  }
}

/** Fetch from Supabase REST as the signed-in admin. path example: "applications?select=*&limit=5" */
export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const s = await getSession();
  if (!s || !URL_ || !KEY) throw new Error("Session expired. Please sign in again.");
  return fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: KEY, Authorization: `Bearer ${s.access_token}`, ...(init.headers || {}) },
    cache: "no-store",
  });
}

/** The admin_profiles row for this user. null = signed in but NOT an admin. */
export async function fetchProfile(s: AdminSession): Promise<AdminProfile | null> {
  const res = await authedFetch(`admin_profiles?id=eq.${encodeURIComponent(s.user.id)}&select=*&limit=1`);
  if (!res.ok) throw new Error(`Could not load admin profile (${res.status}).`);
  const rows = (await res.json()) as Partial<AdminProfile>[];
  const p = rows[0];
  if (!p || !isAdminRole(p.role)) return null;
  return { id: s.user.id, email: p.email || s.user.email, username: p.username, role: p.role, display_name: p.display_name };
}

/** Number of rows (optionally filtered, e.g. "&status=eq.pending"). null if it could not be read. */
export async function countRows(table: string, filter = ""): Promise<number | null> {
  try {
    const res = await authedFetch(`${table}?select=id${filter}`, { headers: { Prefer: "count=exact", Range: "0-0" } });
    if (!res.ok) return null;
    const m = (res.headers.get("content-range") || "").match(/\/(\d+)$/);
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}

/** Rows for a query string such as "select=id,name&order=submitted_at.desc&limit=5". [] on failure. */
export async function listRows<T>(table: string, query: string): Promise<T[]> {
  try {
    const res = await authedFetch(`${table}?${query}`);
    if (!res.ok) return [];
    return (await res.json()) as T[];
  } catch {
    return [];
  }
}

/** Like listRows, but throws on failure so a page can show a real error instead of an empty list. */
export async function queryRows<T>(table: string, query: string): Promise<T[]> {
  const res = await authedFetch(`${table}?${query}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message || `Could not load ${table} (${res.status}).`);
  }
  return (await res.json()) as T[];
}

export type UpdateResult = { ok: true } | { ok: false; message: string };

/**
 * Update one row by id as the signed-in admin.
 * Supabase answers 200 with an EMPTY list when Row Level Security silently blocks an update,
 * so we ask for the changed row back and treat "nothing changed" as a failure.
 */
export async function updateRow(table: string, id: string, patch: Record<string, unknown>): Promise<UpdateResult> {
  try {
    const res = await authedFetch(`${table}?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { ok: false, message: body.message || `Update failed (${res.status}).` };
    }
    const rows = (await res.json().catch(() => [])) as unknown[];
    if (!Array.isArray(rows) || rows.length === 0) {
      return { ok: false, message: "Supabase did not allow this change. Check the update policy for this table (or your role)." };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Network error." };
  }
}