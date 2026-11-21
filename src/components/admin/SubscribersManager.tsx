"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Search, Trash2 } from "lucide-react";
import { authedFetch, queryRows } from "@/lib/admin-auth";
import { formatDate } from "@/lib/utils";

interface Sub {
  id: string;
  email: string;
  subscribed_at?: string | null;
}

/** Spreadsheet apps treat cells starting with = + - @ as formulas, so neutralise them. */
function csvCell(v: unknown): string {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function downloadCsv(rows: Sub[]) {
  const lines = [["Subscribed", "Email"].map(csvCell).join(",")];
  for (const s of rows) lines.push([s.subscribed_at, s.email].map(csvCell).join(","));
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Delete one subscriber as the signed-in admin. Supabase answers 200 with an empty list when RLS blocks it. */
async function deleteSubscriber(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await authedFetch(`subscribers?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Prefer: "return=representation" },
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { ok: false, message: body.message || `Delete failed (${res.status}).` };
    }
    const rows = (await res.json().catch(() => [])) as unknown[];
    if (!Array.isArray(rows) || rows.length === 0) {
      return { ok: false, message: "Supabase did not allow this delete. Check the delete policy for the subscribers table (or your role)." };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Network error." };
  }
}

export default function SubscribersManager() {
  const [rows, setRows] = useState<Sub[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await queryRows<Sub>("subscribers", "select=id,email,subscribed_at&order=subscribed_at.desc.nullslast&limit=5000");
        if (!alive) return;
        setRows(data);
        setError("");
      } catch (e) {
        if (!alive) return;
        setRows([]);
        setError(e instanceof Error ? e.message : "Could not load subscribers.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [tick]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows ?? []).filter((s) => !needle || (s.email || "").toLowerCase().includes(needle));
  }, [rows, q]);

  async function remove(s: Sub) {
    if (!window.confirm(`Remove ${s.email} from the newsletter list? This cannot be undone.`)) return;
    setBusyId(s.id);
    setError("");
    setNotice("");
    const res = await deleteSubscriber(s.id);
    setBusyId(null);
    if (!res.ok) return setError(res.message);
    setRows((rs) => (rs ?? []).filter((r) => r.id !== s.id));
    setNotice(`${s.email} removed.`);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Subscribers</h1>
        <p className="mt-1 text-sm text-muted">People who subscribed through the newsletter box on the website.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => { setRows(null); setTick((t) => t + 1); }} className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs">
            <RefreshCw size={14} /> Refresh
          </button>
          <button type="button" disabled={!visible.length} onClick={() => downloadCsv(visible)} className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs disabled:opacity-50">
            <Download size={14} /> Export CSV{q.trim() ? " (filtered)" : ""}
          </button>
        </div>
      </div>

      <div className="chip-row !justify-start">
        <span className="chip" data-active="true">Total · {rows ? rows.length : "…"}</span>
        {rows && q.trim() ? <span className="chip">Matching · {visible.length}</span> : null}
      </div>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email…" aria-label="Search subscribers" className="field !pl-9" />
      </div>

      {error ? <p role="alert" className="msg-error">{error}</p> : null}
      {notice ? <p role="status" className="msg-success">{notice}</p> : null}

      <div className="card divide-y divide-[var(--border)]">
        {rows === null ? <p className="p-5 text-sm text-muted">Loading…</p> : null}
        {rows && visible.length === 0 ? <p className="p-5 text-sm text-muted">{rows.length === 0 ? "No subscribers yet." : "Nothing matches this search."}</p> : null}

        {visible.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 p-4">
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{s.email}</span>
              <span className="block truncate text-xs text-muted">{s.subscribed_at ? formatDate(s.subscribed_at) : "Date not recorded"}</span>
            </span>
            <button
              type="button"
              disabled={busyId === s.id}
              onClick={() => void remove(s)}
              aria-label={`Remove ${s.email}`}
              className="btn btn-ghost !min-h-0 shrink-0 !px-3 !py-2 text-xs disabled:opacity-50"
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}