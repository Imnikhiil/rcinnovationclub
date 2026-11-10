"use client";

import { useMemo, useState } from "react";
import { Download, ExternalLink, FileText, Link2, Presentation, Play, Search } from "lucide-react";
import { splitList } from "@/lib/utils";
import type { ResourceItem } from "@/lib/types";

const TYPE_ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  pdf: FileText,
  doc: FileText,
  link: Link2,
  video: Play,
  slides: Presentation,
};

export default function ResourcesHub({ items }: { items: ResourceItem[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const categories = useMemo(() => ["All", ...Array.from(new Set(items.map((r) => r.category).filter(Boolean) as string[]))], [items]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((r) => {
      if (cat !== "All" && r.category !== cat) return false;
      if (!needle) return true;
      return [r.title, r.description, r.category, r.tags].some((v) => (v || "").toLowerCase().includes(needle));
    });
  }, [items, q, cat]);

  return (
    <>
      <div className="mx-auto mb-6 max-w-xl">
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search resources…" aria-label="Search resources" className="field !pl-11" />
        </div>
      </div>
      <div className="mb-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Resource categories">
        {categories.map((c) => (
          <button key={c} type="button" role="tab" aria-selected={cat === c} data-active={cat === c} onClick={() => setCat(c)} className="chip">{c}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-center text-muted">No resources found.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r, i) => {
            const Icon = TYPE_ICON[r.type || "link"] || Link2;
            const tags = splitList(r.tags);
            const isDownload = r.type === "pdf" || r.type === "doc";
            return (
              <article key={`${r.title}-${i}`} className="card card-hover flex h-full flex-col p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent-soft)] text-accent"><Icon size={20} /></span>
                  {r.category ? <span className="eyebrow">{r.category}</span> : null}
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{r.title}</h3>
                {r.description ? <p className="mt-2 text-sm leading-relaxed text-muted">{r.description}</p> : null}
                {tags.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tags.map((t) => <span key={t} className="rounded-md border border-[var(--border)] px-2 py-0.5 text-[0.7rem] text-muted">{t}</span>)}
                  </div>
                ) : null}
                {r.url ? (
                  <div className="mt-auto pt-5">
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !py-2 text-sm">
                      {isDownload ? <Download size={15} /> : <ExternalLink size={15} />} {isDownload ? "Download" : "Open"}
                    </a>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}