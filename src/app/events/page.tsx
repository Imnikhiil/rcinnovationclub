import PageHeader from "@/components/ui/PageHeader";
import Reveal from "@/components/ui/Reveal";
import Newsletter from "@/components/sections/Newsletter";
import { UpcomingCard } from "@/components/events/EventCards";
import PastEventsScroller from "@/components/events/PastEventsScroller";
import { getContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { eventTime, isUpcomingEvent } from "@/lib/utils";
import type { EventItem } from "@/lib/types";

export async function generateMetadata() {
  return pageMetadata("events");
}

export default async function EventsPage() {
  const c = await getContent();
  const s = c.eventsSection;
  const all = c.events as unknown as EventItem[];
  const now = Date.now();
  const upcoming = all.filter((e) => isUpcomingEvent(e, now)).sort((a, b) => eventTime(a) - eventTime(b));
  const past = all.filter((e) => !isUpcomingEvent(e, now));

  return (
    <>
      <PageHeader eyebrow={s.eyebrow} title={s.title} subtitle={s.subtitle} />
      <section className="section-y pt-6">
        <div className="container-x">
          {upcoming.length > 0 ? (
            <>
              <h2 className="mb-5 text-center font-display text-xl font-bold">{s.upcomingTitle || "Upcoming Events"}</h2>
              <div className="grid gap-5 md:grid-cols-2">
                {upcoming.map((e, i) => (
                  <Reveal key={`${e.title}-${i}`} delay={(i % 2) * 0.08}>
                    <UpcomingCard e={e} />
                  </Reveal>
                ))}
              </div>
            </>
          ) : null}

          {past.length > 0 ? (
            <>
              <h2 className="mb-5 mt-14 text-center font-display text-xl font-bold">{s.pastTitle || "Past Events"}</h2>
              <PastEventsScroller events={past} />
            </>
          ) : null}
        </div>
      </section>
      <Newsletter />
    </>
  );
}