"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Code, ExternalLink, Globe, Mail, MapPin, User, X } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import SectionHeading from "@/components/ui/SectionHeading";
import { assetUrl, initials } from "@/lib/utils";
import type { AmbassadorItem, MemberName, TeamMember } from "@/lib/types";

type Group = "all" | "leadership" | "core" | "ambassadors" | "members" | "alumni";

const GROUPS: { id: Group; label: string }[] = [
  { id: "all", label: "All Team" },
  { id: "leadership", label: "Leadership" },
  { id: "core", label: "Core Team" },
  { id: "ambassadors", label: "Ambassadors" },
  { id: "members", label: "Members" },
  { id: "alumni", label: "Alumni" },
];

const DEPARTMENTS: Record<string, string> = {
  all: "All Roles",
  leadership: "Leadership",
  events: "Events",
  media: "Media",
  technical: "Technical",
  finance: "Finance",
  operations: "Operations",
};

/** Same rules as the old team-hierarchy.js */
function department(m: TeamMember): string {
  if (m.department && DEPARTMENTS[m.department]) return m.department;
  const role = (m.role || "").toLowerCase();
  if (m.lead || /ambassador|secretary|president|leadership/.test(role)) return "leadership";
  if (/event/.test(role)) return "events";
  if (/media|poster|photo|video|content|social|design|editor/.test(role)) return "media";
  if (/tech|developer|coding|support/.test(role)) return "technical";
  if (/finance/.test(role)) return "finance";
  return "operations";
}

const isLeadership = (m: TeamMember) => m.lead === true || department(m) === "leadership";

interface SectionText {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

interface Props {
  hierarchyEnabled: boolean;
  hint?: string;
  core: TeamMember[];
  ambassadors: AmbassadorItem[];
  membersCurrent: MemberName[];
  membersPrevious: MemberName[];
  coreText: SectionText;
  ambassadorsText: SectionText;
  membersText: SectionText & { currentTitle?: string; previousTitle?: string };
}

export default function TeamExplorer(p: Props) {
  const [group, setGroup] = useState<Group>("all");
  const [dept, setDept] = useState("all");
  const [profile, setProfile] = useState<TeamMember | null>(null);

  const showCore = group === "all" || group === "leadership" || group === "core";
  const showAmb = group === "all" || group === "ambassadors";
  const showMembers = group === "all" || group === "members" || group === "alumni";
  const showCurrent = group !== "alumni";
  const showPrevious = group !== "members";
  const showDept = showCore && group !== "leadership" && p.hierarchyEnabled;

  const filteredCore = useMemo(() => {
    let list = p.core;
    if (group === "leadership") list = list.filter(isLeadership);
    if (showDept && dept !== "all") list = list.filter((m) => department(m) === dept);
    return list;
  }, [p.core, group, dept, showDept]);

  useEffect(() => {
    if (!profile) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setProfile(null);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [profile]);

  return (
    <>
      {p.hierarchyEnabled ? (
        <div className="container-x pb-4">
          {p.hint ? <p className="mb-3 text-center text-sm text-muted">{p.hint}</p> : null}
          <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Team groups">
            {GROUPS.map((g) => (
              <button key={g.id} type="button" role="tab" aria-selected={group === g.id} data-active={group === g.id}
                onClick={() => { setGroup(g.id); setDept("all"); }} className="chip">
                {g.label}
              </button>
            ))}
          </div>
          {showDept ? (
            <div className="mt-3 flex flex-wrap justify-center gap-2" aria-label="Departments">
              {Object.entries(DEPARTMENTS).map(([id, label]) => (
                <button key={id} type="button" data-active={dept === id} onClick={() => setDept(id)} className="chip">
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {showCore ? (
        <section className="section-y" id="core">
          <div className="container-x">
            <SectionHeading eyebrow={p.coreText.eyebrow} title={p.coreText.title} subtitle={p.coreText.subtitle} />
            {filteredCore.length === 0 ? (
              <p className="text-center text-muted">No team members found for this filter.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                {filteredCore.map((m) => (
                  <MemberCard key={m.name} m={m} onOpen={() => m.profile && setProfile(m)} />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {showAmb && p.ambassadors.length > 0 ? (
        <section className="section-y bg-bg-soft/60" id="ambassadors">
          <div className="container-x">
            <SectionHeading eyebrow={p.ambassadorsText.eyebrow} title={p.ambassadorsText.title} subtitle={p.ambassadorsText.subtitle} />
            <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
              {p.ambassadors.map((a) => (
                <article key={a.name} className="card card-hover flex gap-4 p-5">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
                    <SmartImage src={assetUrl(a.image)} alt={a.name} person className="object-cover" sizes="96px" />
                  </div>
                  <div>
                    <span className="eyebrow">{a.label}</span>
                    <h3 className="mt-2 font-display text-lg font-bold">{a.name}</h3>
                    {a.period ? <p className="text-xs text-muted">{a.period}</p> : null}
                    {a.description ? <p className="mt-2 text-sm leading-relaxed text-muted">{a.description}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showMembers ? (
        <section className="section-y" id="members">
          <div className="container-x">
            <SectionHeading eyebrow={p.membersText.eyebrow} title={p.membersText.title} subtitle={p.membersText.subtitle} />
            <div className="grid gap-6 lg:grid-cols-2">
              {showCurrent ? (
                <NamePanel title={p.membersText.currentTitle || "Members"} list={p.membersCurrent} />
              ) : null}
              {showPrevious ? (
                <NamePanel title={p.membersText.previousTitle || "Previous Members"} list={p.membersPrevious} />
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <AnimatePresence>
        {profile ? <ProfileModal m={profile} onClose={() => setProfile(null)} /> : null}
      </AnimatePresence>
    </>
  );
}

function MemberCard({ m, onOpen }: { m: TeamMember; onOpen: () => void }) {
  const clickable = !!m.profile;
  const accent = m.accent === "violet" ? "var(--accent-2)" : "var(--accent)";
  return (
    <article
      onClick={clickable ? onOpen : undefined}
      onKeyDown={clickable ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen()) : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `View ${m.name} profile` : undefined}
      className={`card card-hover relative p-4 text-center ${clickable ? "cursor-pointer" : ""}`}
      style={m.lead ? { borderColor: accent } : undefined}
    >
      {m.lead ? (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[0.6rem] font-extrabold uppercase text-[var(--on-accent)]">Lead</span>
      ) : null}
      <div className="relative mx-auto aspect-square w-full max-w-[150px] overflow-hidden rounded-full" style={{ boxShadow: `0 0 0 3px color-mix(in srgb, ${accent} 45%, transparent)` }}>
        <SmartImage src={assetUrl(m.img)} alt={m.name} person className="object-cover" sizes="150px" />
      </div>
      <h3 className="mt-4 font-display text-base font-bold leading-tight">{m.name}</h3>
      <span className="mt-1 block text-xs font-semibold" style={{ color: accent }}>{m.role}</span>
      {clickable ? (
        <span className="mt-2 inline-flex items-center gap-1 text-[0.7rem] text-muted"><User size={12} /> View Profile</span>
      ) : null}
    </article>
  );
}

function NamePanel({ title, list }: { title: string; list: MemberName[] }) {
  return (
    <div className="card p-6">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {list.map((n) => (
          <li key={n.name} className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[0.65rem] font-bold text-accent">{initials(n.name)}</span>
            <span>
              <span className="block font-semibold">{n.name}</span>
              {n.role ? <span className="block text-xs text-muted">{n.role}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function linkMeta(key: string, url: string) {
  const k = key.toLowerCase();
  if (k === "email" || url.startsWith("mailto:")) return { label: "Email", icon: Mail, href: url.startsWith("mailto:") ? url : `mailto:${url}` };
  if (k.includes("github")) return { label: "GitHub", icon: Code, href: url };
  if (k.includes("linkedin")) return { label: "LinkedIn", icon: ExternalLink, href: url };
  if (k.includes("instagram")) return { label: "Instagram", icon: Globe, href: url };
  return { label: key.charAt(0).toUpperCase() + key.slice(1), icon: Globe, href: url };
}

function ProfileModal({ m, onClose }: { m: TeamMember; onClose: () => void }) {
  const pr = m.profile!;
  const links = Object.entries(pr.links || {}).filter(([, v]) => v);
  return (
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog" aria-modal="true" aria-label={`${m.name} profile`}
        className="card relative max-h-[90vh] w-full max-w-xl overflow-y-auto p-6 sm:p-8"
        initial={{ y: 30, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label="Close profile" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--accent-soft)]">
          <X size={18} />
        </button>
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full">
            <SmartImage src={assetUrl(m.img)} alt={m.name} person className="object-cover" sizes="96px" />
          </div>
          <div>
            <h3 className="font-display text-2xl font-bold">{m.name}</h3>
            <p className="text-sm font-semibold text-accent">{m.role}</p>
            {pr.campus ? <p className="mt-1 flex items-center gap-1 text-xs text-muted"><MapPin size={12} /> {pr.campus}</p> : null}
          </div>
        </div>
        {pr.tagline ? <p className="mt-5 font-semibold italic text-muted">“{pr.tagline}”</p> : null}
        {pr.introduction ? <p className="mt-4 text-sm leading-relaxed text-muted">{pr.introduction}</p> : null}
        {pr.responsibilities?.length ? (
          <div className="mt-5">
            <h4 className="text-sm font-bold">Responsibilities</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              {pr.responsibilities.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        ) : null}
        {pr.skills?.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {pr.skills.map((s) => <span key={s} className="eyebrow">{s}</span>)}
          </div>
        ) : null}
        {links.length ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {links.map(([k, v]) => {
              const meta = linkMeta(k, v);
              return (
                <a key={k} href={meta.href} target={meta.href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className="btn btn-ghost !px-4 !py-2 text-sm">
                  <meta.icon size={15} /> {meta.label}
                </a>
              );
            })}
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}