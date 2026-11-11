"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Download, Mail, Phone, RefreshCw, RotateCcw, Search, X } from "lucide-react";
import { queryRows, updateRow } from "@/lib/admin-auth";
import { formatDate } from "@/lib/utils";

type Status = "pending" | "approved" | "rejected";

interface App {
  id: string;
  name: string;
  enrollment_number: string;
  course: string;
  semester: string;
  email: string;
  phone: string;
  skills?: string | null;
  interests?: string | null;
  reason?: string | null;
  status: Status | string;
  submitted_at: string;
}

const PILL: Record<string, string> = {
  pending: "bg-amber-400/20 text-amber-300",
  approved: "bg-emerald-400/20 text-emerald-300",
  rejected: "bg-red-400/20 text-red-300",
};

const FILTERS: { key: "all" | Status; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

/** Spreadsheet apps treat cells starting with = + - @ as formulas, so neutralise them. */
function csvCell(v: unknown): string {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function downloadCsv(rows: App[]) {
  const head = ["Submitted", "Name", "Enrollment", "Course", "Semester", "Email", "Phone", "Skills", "Interests", "Reason", "Status"];
  const lines = [head.map(csvCell).join(",")];
  for (const a of rows) {
    lines.push([a.submitted_at, a.name, a.enrollment_number, a.course, a.semester, a.email, a.phone, a.skills, a.interests, a.reason, a.status].map(csvCell).join(","));
  }
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ApplicationsManager() {
  const [rows, setRows] = useState<App[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("pending");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await queryRows<App>("applications", "select=*&order=submitted_at.desc&limit=1000");
        if (!alive) return;
        setRows(data);
        setError("");
      } catch (e) {
        if (!alive) return;
        setRows([]);
        setError(e instanceof Error ? e.message : "Could not load applications.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [tick]);

  const counts = useMemo(() => {
    const c = { all: 0, pending: 0, approved: 0, rejected: 0 } as Record<string, number>;
    for (const r of rows ?? []) {
      c.all++;
      if (r.status in c) c[r.status]++;
    }
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!needle) return true;
      return [r.name, r.enrollment_number, r.email, r.course, r.phone].some((f) => (f || "").toLowerCase().includes(needle));
    });
  }, [rows, filter, q]);

  async function setStatus(a: App, next: Status) {
    setBusyId(a.id);
    setError("");
    setNotice("");
    const prev = a.status;
    setRows((rs) => (rs ?? []).map((r) => (r.id === a.id ? { ...r, status: next } : r)));
    const res = await updateRow("applications", a.id, { status: next });
    setBusyId(null);
    if (!res.ok) {
      setRows((rs) => (rs ?? []).map((r) => (r.id === a.id ? { ...r, status: prev } : r)));
      setError(res.message);
    } else {
      setNotice(`${a.name}: marked ${next}.`);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Applications</h1>
          <p className="mt-1 text-sm text-muted">Review membership applications and approve or reject them.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setRows(null); setTick((t) => t + 1); }} className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs"><RefreshCw size={14} /> Refresh</button>
          <button type="button" onClick={() => downloadCsv(visible)} disabled={!visible.length} className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs disabled:opacity-50">
            <Download size={14} /> Export CSV ({visible.length})
          </button>
        </div>
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
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, enrollment, email, course…" aria-label="Search applications" className="field !pl-9" />
      </div>

      {error ? <p role="alert" className="msg-error">{error}</p> : null}
      {notice ? <p role="status" className="msg-success">{notice}</p> : null}

      <div className="card divide-y divide-[var(--border)]">
        {rows === null ? <p className="p-5 text-sm text-muted">Loading…</p> : null}
        {rows && visible.length === 0 ? <p className="p-5 text-sm text-muted">{rows.length === 0 ? "No applications yet." : "Nothing matches this filter."}</p> : null}

        {visible.map((a) => {
          const open = openId === a.id;
          const busy = busyId === a.id;
          return (
            <div key={a.id}>
              <button type="button" onClick={() => setOpenId(open ? null : a.id)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{a.name}</span>
                  <span className="block truncate text-xs text-muted">{a.enrollment_number} · {a.course} · {a.semester} · {formatDate(a.submitted_at)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase ${PILL[a.status] || "bg-slate-400/20 text-slate-300"}`}>{a.status}</span>
                  <ChevronDown size={16} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
                </span>
              </button>

              {open ? (
                <div className="space-y-4 border-t border-[var(--border)] bg-black/5 p-4">
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="label">Email</dt><dd className="break-all"><a className="text-accent underline" href={`mailto:${a.email}`}>{a.email}</a></dd></div>
                    <div><dt className="label">Phone</dt><dd><a className="text-accent underline" href={`tel:${a.phone}`}>{a.phone}</a></dd></div>
                    <div><dt className="label">Skills</dt><dd className="whitespace-pre-wrap">{a.skills || "—"}</dd></div>
                    <div><dt className="label">Interests</dt><dd className="whitespace-pre-wrap">{a.interests || "—"}</dd></div>
                    <div className="sm:col-span-2"><dt className="label">Why they want to join</dt><dd className="whitespace-pre-wrap">{a.reason || "—"}</dd></div>
                  </dl>

                  <div className="flex flex-wrap gap-2">
                    {a.status !== "approved" ? (
                      <button type="button" disabled={busy} onClick={() => setStatus(a, "approved")} className="btn btn-primary !min-h-0 !px-3 !py-2 text-xs"><Check size={14} /> Approve</button>
                    ) : null}
                    {a.status !== "rejected" ? (
                      <button type="button" disabled={busy} onClick={() => setStatus(a, "rejected")} className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs"><X size={14} /> Reject</button>
                    ) : null}
                    {a.status !== "pending" ? (
                      <button type="button" disabled={busy} onClick={() => setStatus(a, "pending")} className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs"><RotateCcw size={14} /> Back to pending</button>
                    ) : null}
                    <a href={`mailto:${a.email}`} className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs"><Mail size={14} /> Email</a>
                    <a href={`tel:${a.phone}`} className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs"><Phone size={14} /> Call</a>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}