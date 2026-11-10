"use client";

import { useMemo, useState } from "react";
import { Code, ExternalLink } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import { assetUrl, centerInRow, splitList } from "@/lib/utils";
import type { ProjectItem } from "@/lib/types";

const STATUSES: Record<string, string> = { completed: "Completed", "in-progress": "In Progress", planned: "Planned" };
const STATUS_COLOR: Record<string, string> = {
  completed: "bg-emerald-400 text-emerald-950",
  "in-progress": "bg-amber-400 text-amber-950",
  planned: "bg-sky-400 text-sky-950",
};

const statusOf = (p: ProjectItem) => (p.status && STATUSES[p.status] ? p.status : "completed");

export default function ProjectsGrid({ items }: { items: ProjectItem[] }) {
  const [filter, setFilter] = useState("all");
  const list = useMemo(() => (filter === "all" ? items : items.filter((p) => statusOf(p) === filter)), [items, filter]);

  return (
    <>
      <div className="chip-row mb-6 sm:mb-8" role="tablist" aria-label="Filter projects by status">
        {[["all", "All"], ...Object.entries(STATUSES)].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={filter === id} data-active={filter === id} onClick={(e) => { setFilter(id); centerInRow(e.currentTarget); }} className="chip">
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-center text-muted">No projects found for this filter.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {list.map((p, i) => {
            const status = statusOf(p);
            const tags = splitList(p.tech);
            return (
              <article key={`${p.title}-${i}`} className="card card-hover flex h-full flex-col overflow-hidden">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <SmartImage src={assetUrl(p.image)} alt={p.title} className="object-cover" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                  <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider ${STATUS_COLOR[status]}`}>
                    {STATUSES[status]}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <span className="eyebrow self-start">{p.category || "Other"}</span>
                  <h3 className="mt-3 font-display text-lg font-bold">{p.title}</h3>
                  {p.description ? <p className="mt-2 text-sm leading-relaxed text-muted">{p.description}</p> : null}
                  {tags.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tags.map((t) => (
                        <span key={t} className="rounded-md border border-[var(--border)] px-2 py-0.5 text-[0.7rem] text-muted">{t}</span>
                      ))}
                    </div>
                  ) : null}
                  {p.team ? <p className="mt-3 text-xs text-muted">Team: {p.team}</p> : null}
                  {(p.githubUrl || p.demoUrl) ? (
                    <div className="mt-auto flex gap-2 pt-4">
                      {p.githubUrl ? (
                        <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost flex-1 !px-4 !py-2.5 text-sm sm:flex-none"><Code size={15} /> Code</a>
                      ) : null}
                      {p.demoUrl ? (
                        <a href={p.demoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary flex-1 !px-4 !py-2.5 text-sm sm:flex-none"><ExternalLink size={15} /> Demo</a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}