import Hero from "@/components/home/Hero";
import Stats from "@/components/home/Stats";
import About from "@/components/home/About";
import EventsPreview from "@/components/home/EventsPreview";
import GalleryPreview from "@/components/home/GalleryPreview";
import JoinCta from "@/components/home/JoinCta";
import { getContent } from "@/lib/content";
import { eventStartMs, type NextEventData } from "@/lib/countdown";
import { isUpcomingEvent } from "@/lib/utils";
import type { EventItem, GalleryItem, StatItem } from "@/lib/types";

export default async function HomePage() {
  const c = await getContent();

  // Soonest event that really is in the future (an old event stuck on "upcoming" is ignored).
  const nowMs = Date.now();
  const nextEvent: NextEventData | null =
    (c.events as EventItem[])
      .filter((e) => e.eventDate && isUpcomingEvent(e, nowMs))
      .map((e) => ({ e, start: eventStartMs(e) }))
      .filter((x): x is { e: EventItem; start: number } => x.start !== null && x.start > nowMs)
      .sort((a, b) => a.start - b.start)
      .map(({ e }) => ({
        title: e.title,
        tag: e.tag,
        eventDate: e.eventDate as string,
        time: e.time,
        registerUrl: e.registerUrl,
        registerLabel: e.registerLabel,
      }))[0] ?? null;

  return (
    <>
      <Hero
        badge={c.hero.badge}
        title={c.hero.title}
        highlight={c.hero.titleHighlight}
        description={c.hero.description}
        primaryLabel={c.hero.btnPrimary}
        secondaryLabel={c.hero.btnSecondary}
        nextEvent={nextEvent}
      />
      {c.statsSection.enabled ? (
        <Stats
          eyebrow={c.statsSection.eyebrow}
          title={c.statsSection.title}
          subtitle={c.statsSection.subtitle}
          stats={c.stats as StatItem[]}
        />
      ) : null}
      <About
        eyebrow={c.about.eyebrow}
        title={c.about.title}
        subtitle={c.about.subtitle}
        mission={c.about.mission}
        vision={c.about.vision}
        culture={c.about.culture}
      />
      <EventsPreview
        eyebrow={c.eventsSection.eyebrow}
        title={c.eventsSection.title}
        subtitle={c.eventsSection.subtitle}
        upcomingTitle={c.eventsSection.upcomingTitle}
        pastTitle={c.eventsSection.pastTitle}
        events={c.events as EventItem[]}
      />
      <GalleryPreview
        eyebrow={c.gallerySection.eyebrow}
        title={c.gallerySection.title}
        subtitle={c.gallerySection.subtitle}
        items={c.gallery as GalleryItem[]}
      />
      <JoinCta
        eyebrow={c.join.eyebrow}
        title={c.join.title}
        description={c.join.description}
        instagramLabel={c.join.btnInstagram}
        whatsappLabel={c.join.btnWhatsapp}
        instagram={c.social.instagram}
        whatsapp={c.social.whatsapp}
      />
    </>
  );
}