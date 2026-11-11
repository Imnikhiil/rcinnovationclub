"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Inbox, Mail, Users, Clock, Award } from "lucide-react";
import { useAdmin } from "./AdminShell";
import { countRows, listRows } from "@/lib/admin-auth";
import { sectionsFor } from "@/lib/admin-roles";
import { formatDate } from "@/lib/utils";

interface AppRow { id: string; name: string; course: string; semester: string; status: string; submitted_at: string }
interface MsgRow { id: string; name: string; subject: string; status: string; submitted_at: string }
interface CmsRow { updated_at?: string; updated_by?: string | null }

interface Data {
  apps: number | null;
  pending: number | null;
  unread: number | null;
  subs: number | null;
  certs: number | null;
  recentApps: AppRow[];
  recentMsgs: MsgRow[];
  cms: CmsRow | null;
}

const PILL: Record<string, string> = {
  pending: "bg-amber-400/20 text-amber-300",
  approved: "bg-emerald-400/20 text-emerald-300",
  rejected: "bg-red-400/20 text-red-300",
  unread: "bg-sky-400/20 text-sky-300",
  read: "bg-slate-400/20 text-slate-300",
};

const show = (n: number | null) => (n === null ? "—" : String(n));

export default function Dashboard() {
  const me = useAdmin();
  const canMembers = me.role === "super" || me.role === "membership";
  const canContent = me.role === "super" || me.role === "content";
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [apps, pending, unread, subs, certs, recentApps, recentMsgs, cmsRows] = await Promise.all([
        canMembers ? countRows("applications") : null,
        canMembers ? countRows("applications", "&status=eq.pending") : null,
        canMembers ? countRows("contact_messages", "&status=eq.unread") : null,
        canMembers ? countRows("subscribers") : null,
        canMembers ? countRows("certificates") : null,
        canMembers ? listRows<AppRow>("applications", "select=id,name,course,semester,status,submitted_at&order=submitted_at.desc&limit=5") : [],
        canMembers ? listRows<MsgRow>("contact_messages", "select=id,name,subject,status,submitted_at&order=submitted_at.desc&limit=5") : [],
        canContent ? listRows<CmsRow>("cms_content", "select=updated_at,updated_by&id=eq.main&limit=1") : [],
      ]);
      if (alive) setData({ apps, pending, unread, subs, certs, recentApps, recentMsgs, cms: cmsRows[0] ?? null });
    })();
    return () => {
      alive = false;
    };
  }, [canMembers, canContent]);

  const stats = [
    { label: "Applications", value: data?.apps ?? null, icon: Users, color: "var(--accent)" },
    { label: "Pending review", value: data?.pending ?? null, icon: Clock, color: "#fbbf24" },
    { label: "Unread messages", value: data?.unread ?? null, icon: Mail, color: "#38bdf8" },
    { label: "Subscribers", value: data?.subs ?? null, icon: Inbox, color: "#34d399" },
    { label: "Certificates", value: data?.certs ?? null, icon: Award, color: "var(--accent-2)" },
  ];
  const allFailed = !!data && canMembers && [data.apps, data.pending, data.unread, data.subs].every((v) => v === null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Welcome, {me.display_name || me.email.split("@")[0]}</h1>
        <p className="mt-1 text-sm text-muted">Here is what is happening on the RC Innovation Club website.</p>
      </div>

      {canMembers ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            {stats.map((s) => (
              <div key={s.label} className="card p-4">
                <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: `color-mix(in srgb, ${s.color} 16%, transparent)`, color: s.color }}>
                  <s.icon size={18} />
                </span>
                <p className="mt-3 font-display text-3xl font-extrabold tabular-nums">{data ? show(s.value) : "…"}</p>
                <p className="text-xs font-semibold text-muted">{s.label}</p>
              </div>
            ))}
          </div>
          {allFailed ? (
            <p role="alert" className="msg-error">
              Could not read the data. In Supabase, run <code>supabase/schema.sql</code> and make sure your account is in the <code>admin_profiles</code> table.
            </p>
          ) : null}
        </>
      ) : null}

      <div>
        <h2 className="mb-3 font-display text-lg font-bold">Manage</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sectionsFor(me.role).map((s) => {
            const body = (
              <>
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display font-bold">{s.label}</span>
                  {!s.ready ? <span className="eyebrow">Soon</span> : null}
                </span>
                <span className="mt-1 block text-sm text-muted">{s.hint}</span>
              </>
            );
            return s.ready ? (
              <Link key={s.key} href={s.href} className="card card-hover block p-4">{body}</Link>
            ) : (
              <div key={s.key} className="card p-4 opacity-70">{body}</div>
            );
          })}
        </div>
      </div>

      {canMembers ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <h2 className="font-display text-lg font-bold">Latest applications</h2>
            <ul className="mt-3 divide-y divide-[var(--border)]">
              {data && data.recentApps.length === 0 ? <li className="py-3 text-sm text-muted">No applications yet.</li> : null}
              {(data?.recentApps ?? []).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{a.name}</span>
                    <span className="block truncate text-xs text-muted">{a.course} · {a.semester} · {formatDate(a.submitted_at)}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase ${PILL[a.status] || PILL.read}`}>{a.status}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5">
            <h2 className="font-display text-lg font-bold">Latest messages</h2>
            <ul className="mt-3 divide-y divide-[var(--border)]">
              {data && data.recentMsgs.length === 0 ? <li className="py-3 text-sm text-muted">No messages yet.</li> : null}
              {(data?.recentMsgs ?? []).map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{m.subject}</span>
                    <span className="block truncate text-xs text-muted">{m.name} · {formatDate(m.submitted_at)}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase ${PILL[m.status] || PILL.read}`}>{m.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {canContent ? (
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold">Website content</h2>
          <p className="mt-1 text-sm text-muted">
            {data?.cms?.updated_at
              ? `Last saved ${formatDate(data.cms.updated_at)}${data.cms.updated_by ? ` by ${data.cms.updated_by}` : ""}. Changes appear on the public site within about 10 minutes.`
              : "The site is currently using its built-in default content (nothing has been saved to the database yet)."}
          </p>
        </div>
      ) : null}
    </div>
  );
}