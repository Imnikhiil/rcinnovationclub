"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Hand } from "lucide-react";
import { PastCard } from "./EventCards";
import type { EventWithSlug } from "@/lib/events";

/** Swipeable row of past events with arrow buttons (same idea as the old events carousel). */
export default function PastEventsScroller({ events }: { events: EventWithSlug[] }) {
  const ref = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(280, el.clientWidth * 0.8), behavior: "smooth" });
  }

  return (
    <div>
      <div className="relative">
        <button type="button" onClick={() => scroll(-1)} aria-label="Previous events"
          className="card absolute -left-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full md:grid">
          <ChevronLeft size={18} />
        </button>
        <button type="button" onClick={() => scroll(1)} aria-label="Next events"
          className="card absolute -right-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full md:grid">
          <ChevronRight size={18} />
        </button>
        <div ref={ref} className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:thin]">
          {events.map((e, i) => (
            <div key={`${e.slug}-${i}`} className="w-[82%] shrink-0 snap-start sm:w-[46%] lg:w-[31%]">
              <PastCard e={e} />
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 flex items-center justify-center gap-2 text-xs text-muted md:hidden">
        <Hand size={14} /> Swipe to explore events
      </p>
    </div>
  );
}