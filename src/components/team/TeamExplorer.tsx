"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { Code, ExternalLink, Globe, Mail, MapPin, User, X } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import SectionHeading from "@/components/ui/SectionHeading";
import { assetUrl, centerInRow, initials } from "@/lib/utils";
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
          <div className="chip-row" role="tablist" aria-label="Team groups">
            {GROUPS.map((g) => (
              <button key={g.id} type="button" role="tab" aria-selected={group === g.id} data-active={group === g.id}
                onClick={(e) => { setGroup(g.id); setDept("all"); centerInRow(e.currentTarget); }} className="chip">
                {g.label}
              </button>
            ))}
          </div>
          {showDept ? (
            <div className="chip-row mt-2" aria-label="Departments">
              {Object.entries(DEPARTMENTS).map(([id, label]) => (
                <button key={id} type="button" data-active={dept === id} onClick={(e) => { setDept(id); centerInRow(e.currentTarget); }} className="chip">
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
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
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
      className={`card card-hover relative p-3 pb-4 text-center sm:p-4 ${clickable ? "cursor-pointer" : ""}`}
      style={m.lead ? { borderColor: accent } : undefined}
    >
      {m.lead ? (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[0.6rem] font-extrabold uppercase text-[var(--on-accent)]">Lead</span>
      ) : null}
      <div className="relative mx-auto aspect-square w-full max-w-[150px] overflow-hidden rounded-full" style={{ boxShadow: `0 0 0 3px color-mix(in srgb, ${accent} 45%, transparent)` }}>
        <SmartImage src={assetUrl(m.img)} alt={m.name} person className="object-cover" sizes="150px" />
      </div>
      <h3 className="mt-3 font-display text-[0.9rem] font-bold leading-tight sm:mt-4 sm:text-base">{m.name}</h3>
      <span className="mt-1 block text-[0.72rem] font-semibold leading-snug sm:text-xs" style={{ color: accent }}>{m.role}</span>
      {clickable ? (
        <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[0.7rem] font-semibold text-accent"><User size={12} /> View Profile</span>
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
  const controls = useDragControls();
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Phone: bottom sheet you can drag down to close. Desktop: centered dialog. */}
      <motion.div
        role="dialog" aria-modal="true" aria-label={`${m.name} profile`}
        className="card pb-safe relative max-h-[88dvh] w-full max-w-xl overflow-y-auto !rounded-b-none !rounded-t-3xl p-5 sm:max-h-[90vh] sm:!rounded-3xl sm:p-8"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 320 }}
        drag="y" dragControls={controls} dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(_, info) => { if (info.offset.y > 90 || info.velocity.y > 500) onClose(); }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle sm:hidden" onPointerDown={(e) => controls.start(e)} aria-hidden />
        <button type="button" onClick={onClose} aria-label="Close profile" className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full hover:bg-[var(--accent-soft)] sm:right-4 sm:top-4">
          <X size={20} />
        </button>
        <div className="flex items-center gap-4 pr-10">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--accent)] sm:h-24 sm:w-24">
            <SmartImage src={assetUrl(m.img)} alt={m.name} person className="object-cover" sizes="96px" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-xl font-bold leading-tight sm:text-2xl">{m.name}</h3>
            <p className="text-sm font-semibold text-accent">{m.role}</p>
            {pr.campus ? <p className="mt-1 flex items-center gap-1 text-xs text-muted"><MapPin size={12} /> {pr.campus}</p> : null}
          </div>
        </div>
        {pr.tagline ? <p className="mt-5 font-semibold italic text-muted">“{pr.tagline}”</p> : null}
        {pr.introduction ? <p className="mt-4 text-sm leading-relaxed text-muted">{pr.introduction}</p> : null}
        {pr.responsibilities?.length ? (
          <div className="mt-5">
            <h4 className="text-sm font-bold">Responsibilities</h4>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">
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
          <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {links.map(([k, v]) => {
              const meta = linkMeta(k, v);
              return (
                <a key={k} href={meta.href} target={meta.href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className="btn btn-ghost !px-4 !py-2.5 text-sm">
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