"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, Ban, Copy, Download, RefreshCw, RotateCcw, Search } from "lucide-react";
import { authedFetch, queryRows, updateRow } from "@/lib/admin-auth";
import { formatDate } from "@/lib/utils";
import type { CertificateRow } from "@/lib/types";

type Filter = "all" | "active" | "revoked";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "revoked", label: "Revoked" },
];

const TYPES = ["participation", "achievement", "completion", "appreciation", "excellence"];

/** Looks like RCIC-2026-K7M2QX. Letters and digits that are easy to read out loud (no 0/O, 1/I). */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genId(): string {
  const bytes = new Uint32Array(6);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const n of bytes) s += ALPHABET[n % ALPHABET.length];
  return `RCIC-${new Date().getFullYear()}-${s}`;
}

const todayLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

/** Spreadsheet apps treat cells starting with = + - @ as formulas, so neutralise them. */
function csvCell(v: unknown): string {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function downloadCsv(rows: CertificateRow[]) {
  const head = ["ID", "Name", "Type", "Event", "Description", "Issue date", "Status"];
  const lines = [head.map(csvCell).join(",")];
  for (const c of rows) lines.push([c.id, c.recipient_name, c.type, c.event_title, c.description, c.issue_date, c.status].map(csvCell).join(","));
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `certificates-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

type InsertResult = { ok: true } | { ok: false; duplicate: boolean; message: string };

async function insertCertificate(row: Record<string, unknown>): Promise<InsertResult> {
  try {
    const res = await authedFetch("certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(row),
    });
    if (res.ok) {
      const rows = (await res.json().catch(() => [])) as unknown[];
      if (Array.isArray(rows) && rows.length === 0) {
        return { ok: false, duplicate: false, message: "Supabase did not allow this. Check the insert policy for the certificates table (or your role)." };
      }
      return { ok: true };
    }
    const b = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
    return { ok: false, duplicate: res.status === 409 || b.code === "23505", message: b.message || `Could not issue the certificate (${res.status}).` };
  } catch (e) {
    return { ok: false, duplicate: false, message: e instanceof Error ? e.message : "Network error." };
  }
}

export default function CertificatesManager() {
  const [rows, setRows] = useState<CertificateRow[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // issue form
  const [name, setName] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [eventTitle, setEventTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issueDate, setIssueDate] = useState(todayLocal());
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await queryRows<CertificateRow>("certificates", "select=*&order=issue_date.desc&limit=2000");
        if (!alive) return;
        setRows(data);
        setError("");
      } catch (e) {
        if (!alive) return;
        setRows([]);
        setError(e instanceof Error ? e.message : "Could not load certificates.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [tick]);

  const counts = useMemo(() => {
    const list = rows ?? [];
    const revoked = list.filter((c) => c.status === "revoked").length;
    return { all: list.length, active: list.length - revoked, revoked };
  }, [rows]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows ?? []).filter((c) => {
      const isRevoked = c.status === "revoked";
      if (filter === "active" && isRevoked) return false;
      if (filter === "revoked" && !isRevoked) return false;
      if (!needle) return true;
      return [c.id, c.recipient_name, c.event_title, c.type].some((f) => (f || "").toLowerCase().includes(needle));
    });
  }, [rows, filter, q]);

  async function issue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");
    const recipient_name = name.trim();
    const event_title = eventTitle.trim();
    const desc = description.trim();
    if (!recipient_name || !event_title || !issueDate) return setError("Please fill in the name, event and date.");

    setIssuing(true);
    let id = "";
    let result: InsertResult = { ok: false, duplicate: false, message: "" };
    // an ID clash is very unlikely, but if it happens just try a fresh ID
    for (let i = 0; i < 4; i++) {
      id = genId();
      result = await insertCertificate({ id, recipient_name, type, event_title, description: desc || null, issue_date: issueDate, status: "active" });
      if (result.ok || !result.duplicate) break;
    }
    setIssuing(false);
    if (!result.ok) return setError(result.message || "Could not issue the certificate.");

    const row: CertificateRow = { id, recipient_name, type, event_title, description: desc || undefined, issue_date: issueDate, status: "active" };
    setRows((rs) => [row, ...(rs ?? [])]);
    setNotice(`Certificate issued. ID: ${id}`);
    setName("");
    setDescription("");
  }

  async function setStatus(c: CertificateRow, next: "active" | "revoked") {
    if (next === "revoked" && !window.confirm(`Revoke certificate ${c.id} (${c.recipient_name})? Anyone who checks it will see it as revoked.`)) return;
    setBusyId(c.id);
    setError("");
    setNotice("");
    const res = await updateRow("certificates", c.id, { status: next });
    setBusyId(null);
    if (!res.ok) return setError(res.message);
    setRows((rs) => (rs ?? []).map((r) => (r.id === c.id ? { ...r, status: next } : r)));
    setNotice(next === "revoked" ? `${c.id} revoked.` : `${c.id} is active again.`);
  }

  async function copyLink(c: CertificateRow) {
    const url = `${window.location.origin}/resources?cert=${encodeURIComponent(c.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Verification link copied.");
    } catch {
      setNotice(url);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Certificates</h1>
        <p className="mt-1 text-sm text-muted">Issue certificates and revoke them. The public check on the Resources page uses this list.</p>
      </div>

      <form onSubmit={issue} className="card space-y-4 p-4 sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Award size={18} aria-hidden /> Issue a certificate</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cert-name" className="label">Recipient name <span className="text-accent">*</span></label>
            <input id="cert-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className="field" placeholder="Full name" />
          </div>
          <div>
            <label htmlFor="cert-type" className="label">Type</label>
            <select id="cert-type" value={type} onChange={(e) => setType(e.target.value)} className="field capitalize">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="cert-event" className="label">Event / activity <span className="text-accent">*</span></label>
            <input id="cert-event" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} maxLength={150} className="field" placeholder="e.g. Hackathon 2026" />
          </div>
          <div>
            <label htmlFor="cert-date" className="label">Issue date <span className="text-accent">*</span></label>
            <input id="cert-date" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="field" />
          </div>
        </div>
        <div>
          <label htmlFor="cert-desc" className="label">Description (optional)</label>
          <input id="cert-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} className="field" placeholder="e.g. Secured 2nd position" />
        </div>
        <button type="submit" disabled={issuing} className="btn btn-primary disabled:opacity-60">
          <Award size={16} /> {issuing ? "Issuing…" : "Issue certificate"}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => { setRows(null); setTick((t) => t + 1); }} className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs">
          <RefreshCw size={14} /> Refresh
        </button>
        <button type="button" disabled={!visible.length} onClick={() => downloadCsv(visible)} className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs disabled:opacity-50">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="chip-row !justify-start">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" data-active={filter === f.key} onClick={() => setFilter(f.key)} className="chip">
            {f.label} · {rows ? counts[f.key] : "…"}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID, name, event…" aria-label="Search certificates" className="field !pl-9" />
      </div>

      {error ? <p role="alert" className="msg-error">{error}</p> : null}
      {notice ? <p role="status" className="msg-success break-all">{notice}</p> : null}

      <div className="card divide-y divide-[var(--border)]">
        {rows === null ? <p className="p-5 text-sm text-muted">Loading…</p> : null}
        {rows && visible.length === 0 ? <p className="p-5 text-sm text-muted">{rows.length === 0 ? "No certificates yet." : "Nothing matches this filter."}</p> : null}

        {visible.map((c) => {
          const revoked = c.status === "revoked";
          return (
            <div key={c.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{c.recipient_name}</span>
                  <span className="block break-all font-mono text-xs text-accent">{c.id}</span>
                  <span className="block text-xs text-muted">
                    <span className="capitalize">{c.type}</span> · {c.event_title} · {formatDate(c.issue_date)}
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase ${revoked ? "bg-red-400/20 text-red-300" : "bg-emerald-400/20 text-emerald-300"}`}>
                  {revoked ? "revoked" : "active"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void copyLink(c)} className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs">
                  <Copy size={14} /> Copy verify link
                </button>
                {revoked ? (
                  <button type="button" disabled={busyId === c.id} onClick={() => void setStatus(c, "active")} className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs disabled:opacity-50">
                    <RotateCcw size={14} /> Restore
                  </button>
                ) : (
                  <button type="button" disabled={busyId === c.id} onClick={() => void setStatus(c, "revoked")} className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs disabled:opacity-50">
                    <Ban size={14} /> Revoke
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}