import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, MapPin } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import SmartImage from "@/components/ui/SmartImage";
import { assetUrl, eventTime, siteHref } from "@/lib/utils";
import { withSlugs } from "@/lib/events";
import type { EventItem } from "@/lib/types";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  upcomingTitle?: string;
  pastTitle?: string;
  events: EventItem[];
}

function isUpcoming(e: EventItem, now: number) {
  if (e.forceStatus === "upcoming") return true;
  if (e.forceStatus === "past") return false;
  return !!e.eventDate && eventTime(e) >= now - 86_400_000;
}

export default function EventsPreview({ eyebrow, title, subtitle, upcomingTitle, pastTitle, events }: Props) {
  const now = Date.now();
  const all = withSlugs(events);
  const upcoming = all.filter((e) => isUpcoming(e, now)).sort((a, b) => eventTime(a) - eventTime(b)).slice(0, 2);
  const past = all.filter((e) => !isUpcoming(e, now)).sort((a, b) => eventTime(b) - eventTime(a)).slice(0, 3);

  return (
    <section id="events" className="section-y">
      <div className="container-x">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />

        {upcoming.length > 0 ? (
          <>
            <h3 className="mb-5 text-center font-display text-lg font-bold">{upcomingTitle || "Upcoming Events"}</h3>
            <div className="grid gap-5 md:grid-cols-2">
              {upcoming.map((e, i) => (
                <Reveal key={e.slug} delay={i * 0.08}>
                  <article className="card card-hover relative flex h-full flex-col overflow-hidden">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <SmartImage src={assetUrl(e.image)} alt={e.title} className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
                      <span className="absolute left-3 top-3 rounded-full bg-emerald-400 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-emerald-950">
                        Upcoming
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      {e.tag ? <span className="eyebrow self-start">{e.tag}</span> : null}
                      <h4 className="mt-3 font-display text-xl font-bold">
                        <Link href={`/events/${e.slug}`} className="after:absolute after:inset-0 after:content-['']">{e.title}</Link>
                      </h4>
                      <ul className="mt-3 space-y-1.5 text-sm text-muted">
                        {e.date ? (
                          <li className="flex items-center gap-2"><CalendarDays size={15} className="text-accent" /> {e.date}</li>
                        ) : null}
                        {e.time ? (
                          <li className="flex items-center gap-2"><Clock size={15} className="text-accent" /> {e.time}</li>
                        ) : null}
                        {e.venue ? (
                          <li className="flex items-center gap-2"><MapPin size={15} className="text-accent" /> {e.venue}</li>
                        ) : null}
                      </ul>
                      {e.description ? <p className="mt-3 text-sm leading-relaxed text-muted">{e.description}</p> : null}
                      {e.registerUrl ? (
                        <Link
                          href={siteHref(e.registerUrl)}
                          className="btn btn-primary relative z-10 mt-5 self-start"
                          {...(e.registerUrl.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                          {e.registerLabel || "Register Now"}
                        </Link>
                      ) : null}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </>
        ) : null}

        {past.length > 0 ? (
          <>
            <h3 className="mb-5 mt-14 text-center font-display text-lg font-bold">{pastTitle || "Past Events"}</h3>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((e, i) => (
                <Reveal key={e.slug} delay={i * 0.08}>
                  <article className="card card-hover relative h-full overflow-hidden">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <SmartImage src={assetUrl(e.image)} alt={e.title} className="object-cover" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                    </div>
                    <div className="p-5">
                      {e.tag ? <span className="eyebrow">{e.tag}</span> : null}
                      <h4 className="mt-3 font-display text-lg font-bold">
                        <Link href={`/events/${e.slug}`} className="after:absolute after:inset-0 after:content-['']">{e.title}</Link>
                      </h4>
                      {e.date ? <p className="mt-1 text-xs text-muted">{e.date}</p> : null}
                      {e.description ? <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{e.description}</p> : null}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </>
        ) : null}

        <Reveal className="mt-10 text-center">
          <Link href="/events" className="btn btn-ghost">
            View all events <ArrowRight size={18} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}