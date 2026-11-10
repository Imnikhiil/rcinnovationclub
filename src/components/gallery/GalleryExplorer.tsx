"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Search, X } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import { assetUrl, formatDate } from "@/lib/utils";
import type { GalleryItem } from "@/lib/types";

const mediaSrc = (g: GalleryItem) => assetUrl(g.mediaUrl || g.src || g.image);
const isVideo = (g: GalleryItem) => g.type === "video";

export default function GalleryExplorer({ items }: { items: GalleryItem[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState<number | null>(null);

  const categories = useMemo(() => ["All", ...Array.from(new Set(items.map((g) => g.category).filter(Boolean) as string[]))], [items]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...items]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .filter((g) => {
        if (cat !== "All" && g.category !== cat) return false;
        if (!needle) return true;
        return [g.title, g.description, g.category].some((v) => (v || "").toLowerCase().includes(needle));
      });
  }, [items, q, cat]);

  const step = useCallback((d: 1 | -1) => setOpen((i) => (i === null ? i : (i + d + list.length) % list.length)), [list.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, step]);

  const current = open !== null ? list[open] : null;

  return (
    <>
      <div className="mx-auto mb-6 max-w-xl">
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search gallery…" aria-label="Search gallery" className="field !pl-11" />
        </div>
      </div>
      <div className="mb-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Gallery categories">
        {categories.map((c) => (
          <button key={c} type="button" role="tab" aria-selected={cat === c} data-active={cat === c} onClick={() => setCat(c)} className="chip">{c}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-center text-muted">No photos or videos found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {list.map((g, i) => (
            <button key={g.id || `${g.title}-${i}`} type="button" onClick={() => setOpen(i)} aria-label={`Open ${g.title || "media"}`}
              className="card card-hover group relative aspect-[4/3] overflow-hidden text-left">
              <SmartImage src={isVideo(g) ? assetUrl(g.thumbnailUrl) : mediaSrc(g)} alt={g.title || "Gallery item"} className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(min-width: 768px) 33vw, 50vw" />
              {isVideo(g) ? (
                <span className="absolute inset-0 grid place-items-center bg-black/30"><span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-black"><Play size={20} /></span></span>
              ) : null}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
                <span className="block text-sm font-bold">{g.title}</span>
                {g.category ? <span className="block text-[0.7rem] opacity-80">{g.category}</span> : null}
              </span>
            </button>
          ))}
        </div>
      )}

      {current ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label={current.title || "Gallery viewer"} onClick={() => setOpen(null)}>
          <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><X size={20} /></button>
          {list.length > 1 ? (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="Previous" className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronLeft size={22} /></button>
              <button type="button" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="Next" className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronRight size={22} /></button>
            </>
          ) : null}
          <figure className="max-h-[90vh] max-w-4xl text-center text-white" onClick={(e) => e.stopPropagation()}>
            {isVideo(current) ? (
              <video src={mediaSrc(current)} controls autoPlay className="mx-auto max-h-[70vh] rounded-xl" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaSrc(current)} alt={current.title || ""} className="mx-auto max-h-[70vh] rounded-xl object-contain" />
            )}
            <figcaption className="mt-4">
              <p className="font-display text-lg font-bold">{current.title}</p>
              <p className="mt-1 text-xs opacity-70">{[current.category, formatDate(current.eventDate)].filter(Boolean).join(" · ")}</p>
              {current.description ? <p className="mx-auto mt-2 max-w-xl text-sm opacity-85">{current.description}</p> : null}
            </figcaption>
          </figure>
        </div>
      ) : null}
    </>
  );
}