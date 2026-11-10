/**
 * Tiny Supabase REST helper (no extra npm package needed).
 * Uses ONLY the public anon key; Row Level Security in supabase/schema.sql decides what is allowed.
 * NOTE: process.env.NEXT_PUBLIC_* must be written out in full for Next.js to inline them.
 */
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseReady = () => !!(URL_ && KEY);

export type InsertResult = { ok: true } | { ok: false; duplicate: boolean; message: string };

export async function sbInsert(table: string, row: Record<string, unknown>): Promise<InsertResult> {
  if (!URL_ || !KEY) return { ok: false, duplicate: false, message: "Backend is not configured." };
  try {
    const res = await fetch(`${URL_}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
    return { ok: false, duplicate: res.status === 409 || body.code === "23505", message: body.message || `Error ${res.status}` };
  } catch {
    return { ok: false, duplicate: false, message: "Network error." };
  }
}

export async function sbSelectOne<T>(table: string, column: string, value: string): Promise<T | null> {
  if (!URL_ || !KEY) return null;
  const res = await fetch(
    `${URL_}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}&select=*&limit=1`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: "no-store" },
  );
  if (!res.ok) throw new Error(`Lookup failed (${res.status})`);
  const rows = (await res.json()) as T[];
  return rows[0] ?? null;
}