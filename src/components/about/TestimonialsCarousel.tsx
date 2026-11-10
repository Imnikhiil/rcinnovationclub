"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import { assetUrl } from "@/lib/utils";
import type { TestimonialItem } from "@/lib/types";

function usePerView() {
  const [n, setN] = useState(1);
  useEffect(() => {
    const calc = () => setN(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return n;
}

export default function TestimonialsCarousel({ items }: { items: TestimonialItem[] }) {
  const perView = usePerView();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const maxIndex = Math.max(0, items.length - perView);
  const safeIndex = Math.min(index, maxIndex);

  const go = useCallback((dir: 1 | -1) => {
    setIndex((i) => {
      const cur = Math.min(i, maxIndex);
      if (dir === 1) return cur >= maxIndex ? 0 : cur + 1;
      return cur <= 0 ? maxIndex : cur - 1;
    });
  }, [maxIndex]);

  useEffect(() => {
    if (paused || maxIndex === 0) return;
    const t = setInterval(() => go(1), 6000);
    return () => clearInterval(t);
  }, [paused, maxIndex, go]);

  if (!items.length) return null;

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${(safeIndex * 100) / perView}%)` }}
        >
          {items.map((t, i) => (
            <div key={`${t.name}-${i}`} className="shrink-0 p-2" style={{ flexBasis: `${100 / perView}%` }}>
              <figure className="card h-full p-6">
                <Quote size={26} className="text-accent" />
                {t.rating ? (
                  <div className="mt-3 flex gap-0.5" aria-label={`${t.rating} out of 5`}>
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={14} className={s < (t.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-muted"} />
                    ))}
                  </div>
                ) : null}
                <blockquote className="mt-3 text-sm leading-relaxed text-muted">“{t.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="relative h-11 w-11 overflow-hidden rounded-full">
                    <SmartImage src={assetUrl(t.image)} alt={t.name} person className="object-cover" sizes="44px" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{t.name}</span>
                    {t.role ? <span className="block text-xs text-muted">{t.role}</span> : null}
                  </span>
                </figcaption>
              </figure>
            </div>
          ))}
        </div>
      </div>
      {maxIndex > 0 ? (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button type="button" onClick={() => go(-1)} aria-label="Previous testimonial" className="card grid h-10 w-10 place-items-center rounded-full"><ChevronLeft size={18} /></button>
          <div className="flex gap-1.5">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button key={i} type="button" onClick={() => setIndex(i)} aria-label={`Go to testimonial ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === safeIndex ? "w-6 bg-[var(--accent)]" : "w-2 bg-[var(--border)]"}`} />
            ))}
          </div>
          <button type="button" onClick={() => go(1)} aria-label="Next testimonial" className="card grid h-10 w-10 place-items-center rounded-full"><ChevronRight size={18} /></button>
        </div>
      ) : null}
    </div>
  );
}