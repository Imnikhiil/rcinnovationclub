/**
 * Reading and saving the website content (Supabase table cms_content, row "main").
 * Every request runs as the signed-in admin; Supabase RLS (cms_editors_write) allows only super + content roles.
 */
import { authedFetch, getSession } from "@/lib/admin-auth";

export type CmsData = Record<string, unknown>;

export interface CmsRow {
  data: CmsData;
  updated_at: string | null;
  updated_by: string | null;
}

type RawRow = { data?: unknown; updated_at?: string | null; updated_by?: string | null };

const toRow = (r: RawRow, fallbackData: CmsData = {}): CmsRow => ({
  data: r.data && typeof r.data === "object" && !Array.isArray(r.data) ? (r.data as CmsData) : fallbackData,
  updated_at: r.updated_at ?? null,
  updated_by: r.updated_by ?? null,
});

export async function loadCms(): Promise<CmsRow | null> {
  const res = await authedFetch("cms_content?id=eq.main&select=data,updated_at,updated_by&limit=1");
  if (!res.ok) {
    const b = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(b.message || `Could not load the website content (${res.status}).`);
  }
  const rows = (await res.json()) as RawRow[];
  return rows[0] ? toRow(rows[0]) : null;
}

export type SaveResult = { ok: true; row: CmsRow } | { ok: false; conflict: boolean; message: string };

/**
 * Saves the whole override object.
 * The PATCH only matches while updated_at is still what we loaded, so if another editor saved in the meantime
 * nothing is overwritten and we report a conflict instead.
 */
export async function saveCms(prev: CmsRow | null, data: CmsData, editorEmail: string): Promise<SaveResult> {
  const now = new Date().toISOString();
  const body = JSON.stringify(prev ? { data, updated_at: now, updated_by: editorEmail } : { id: "main", data, updated_at: now, updated_by: editorEmail });
  const headers = { "Content-Type": "application/json", Prefer: "return=representation" };
  try {
    const res = prev
      ? await authedFetch(`cms_content?id=eq.main${prev.updated_at ? `&updated_at=eq.${encodeURIComponent(prev.updated_at)}` : ""}`, { method: "PATCH", headers, body })
      : await authedFetch("cms_content", { method: "POST", headers, body });

    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { message?: string };
      return { ok: false, conflict: false, message: b.message || `Save failed (${res.status}).` };
    }
    const rows = (await res.json().catch(() => [])) as RawRow[];
    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        ok: false,
        conflict: true,
        message: "Nothing was saved. Either another editor saved changes a moment ago, or your account is not allowed to edit content. Reload the latest content and try again.",
      };
    }
    return { ok: true, row: toRow(rows[0], data) };
  } catch (e) {
    return { ok: false, conflict: false, message: e instanceof Error ? e.message : "Network error." };
  }
}

/** Asks the website to drop its cached copy so the change shows up now instead of after ~10 minutes. */
export async function revalidateSite(): Promise<boolean> {
  try {
    const s = await getSession();
    if (!s) return false;
    const res = await fetch("/api/revalidate", { method: "POST", headers: { Authorization: `Bearer ${s.access_token}` } });
    return res.ok;
  } catch {
    return false;
  }
}