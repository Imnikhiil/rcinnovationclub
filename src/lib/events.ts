import { slugify } from "@/lib/utils";
import type { EventItem } from "@/lib/types";

export type EventWithSlug = EventItem & { slug: string };

/**
 * Gives every event a URL-friendly slug (/events/<slug>).
 * Uses the event's id when the CMS has one, otherwise its title. Duplicate titles get -2, -3 ...
 * Call it on the FULL events list (before filtering) so a slug never changes because of a filter.
 */
export function withSlugs(events: EventItem[]): EventWithSlug[] {
  const seen = new Map<string, number>();
  return events.map((e) => {
    const base = slugify(e.id || e.title) || "event";
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return { ...e, slug: n === 1 ? base : `${base}-${n}` };
  });
}