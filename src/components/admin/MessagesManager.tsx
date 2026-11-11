"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Mail, MailOpen, RefreshCw, Search } from "lucide-react";
import { queryRows, updateRow } from "@/lib/admin-auth";
import { formatDate } from "@/lib/utils";

interface Msg {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | string;
  submitted_at: string;
}

type Filter = "unread" | "read" | "all";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
  { key: "all", label: "All" },
];

export default function MessagesManager() {
  const [rows, setRows] = useState<Msg[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("unread");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await queryRows<Msg>("contact_messages", "select=*&order=submitted_at.desc&limit=1000");
        if (!alive) return;
        setRows(data);
        setError("");
      } catch (e) {
        if (!alive) return;
        setRows([]);
        setError(e instanceof Error ? e.message : "Could not load messages.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [tick]);

  const counts = useMemo(() => {
    const list = rows ?? [];
    return { all: list.length, unread: list.filter((m) => m.status === "unread").length, read: list.filter((m) => m.status === "read").length };
  }, [rows]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows ?? []).filter((m) => {
      if (filter !== "all" && m.status !== filter) return false;
      if (!needle) return true;
      return [m.name, m.email, m.subject, m.message].some((f) => (f || "").toLowerCase().includes(needle));
    });
  }, [rows, filter, q]);

  async function setStatus(m: Msg, next: "read" | "unread") {
    if (m.status === next) return;
    setBusyId(m.id);
    setError("");
    const prev = m.status;
    setRows((rs) => (rs ?? []).map((r) => (r.id === m.id ? { ...r, status: next } : r)));
    const res = await updateRow("contact_messages", m.id, { status: next });
    setBusyId(null);
    if (!res.ok) {
      setRows((rs) => (rs ?? []).map((r) => (r.id === m.id ? { ...r, status: prev } : r)));
      setError(res.message);
    }
  }

  function toggle(m: Msg) {
    const opening = openId !== m.id;
    setOpenId(opening ? m.id : null);
    // Opening an unread message marks it read.
    if (opening && m.status === "unread") void setStatus(m, "read");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Messages</h1>
        <p className="mt-1 text-sm text-muted">Messages sent through the contact form. Opening one marks it as read.</p>
        <button type="button" onClick={() => { setRows(null); setTick((t) => t + 1); }} className="btn btn-ghost mt-3 !min-h-0 !px-3 !py-2 text-xs"><RefreshCw size={14} /> Refresh</button>
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
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, subject, message…" aria-label="Search messages" className="field !pl-9" />
      </div>

      {error ? <p role="alert" className="msg-error">{error}</p> : null}

      <div className="card divide-y divide-[var(--border)]">
        {rows === null ? <p className="p-5 text-sm text-muted">Loading…</p> : null}
        {rows && visible.length === 0 ? <p className="p-5 text-sm text-muted">{rows.length === 0 ? "No messages yet." : "Nothing matches this filter."}</p> : null}

        {visible.map((m) => {
          const open = openId === m.id;
          const unread = m.status === "unread";
          return (
            <div key={m.id}>
              <button type="button" onClick={() => toggle(m)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                <span className="min-w-0">
                  <span className={`block truncate text-sm ${unread ? "font-extrabold" : "font-semibold"}`}>{m.subject}</span>
                  <span className="block truncate text-xs text-muted">{m.name} · {formatDate(m.submitted_at)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {unread ? <span className="rounded-full bg-sky-400/20 px-2.5 py-1 text-[0.65rem] font-bold uppercase text-sky-300">unread</span> : null}
                  <ChevronDown size={16} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
                </span>
              </button>

              {open ? (
                <div className="space-y-4 border-t border-[var(--border)] bg-black/5 p-4">
                  <p className="text-sm">
                    <span className="label">From</span>
                    {m.name} · <a className="break-all text-accent underline" href={`mailto:${m.email}`}>{m.email}</a>
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.message}</p>
                  <div className="flex flex-wrap gap-2">
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="btn btn-primary !min-h-0 !px-3 !py-2 text-xs"><Mail size={14} /> Reply by email</a>
                    {m.status === "read" ? (
                      <button type="button" disabled={busyId === m.id} onClick={() => setStatus(m, "unread")} className="btn btn-ghost !min-h-0 !px-3 !py-2 text-xs"><MailOpen size={14} /> Mark unread</button>
                    ) : null}
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