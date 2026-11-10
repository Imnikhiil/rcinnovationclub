import Link from "next/link";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import { assetUrl, siteHref } from "@/lib/utils";
import type { EventItem } from "@/lib/types";

export function formatEventDate(e: EventItem): string {
  if (e.date) return e.date;
  if (!e.eventDate) return "";
  const d = new Date(e.eventDate + "T00:00:00");
  return Number.isNaN(d.getTime()) ? e.eventDate : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export function UpcomingCard({ e }: { e: EventItem }) {
  const date = formatEventDate(e);
  return (
    <article className="card card-hover flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/9] overflow-hidden">
        <SmartImage src={assetUrl(e.image)} alt={e.title} className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
        <span className="absolute left-3 top-3 rounded-full bg-emerald-400 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-emerald-950">
          Upcoming
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        {e.tag ? <span className="eyebrow self-start">{e.tag}</span> : null}
        <h3 className="mt-3 font-display text-xl font-bold">{e.title}</h3>
        <ul className="mt-3 space-y-1.5 text-sm text-muted">
          {date ? <li className="flex items-center gap-2"><CalendarDays size={15} className="text-accent" /> {date}</li> : null}
          {e.time ? <li className="flex items-center gap-2"><Clock size={15} className="text-accent" /> {e.time}</li> : null}
          {e.venue ? <li className="flex items-center gap-2"><MapPin size={15} className="text-accent" /> {e.venue}</li> : null}
        </ul>
        {e.description ? <p className="mt-3 text-sm leading-relaxed text-muted">{e.description}</p> : null}
        {e.registerUrl ? (
          <Link
            href={siteHref(e.registerUrl)}
            className="btn btn-primary mt-5 self-start"
            {...(e.registerUrl.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {e.registerLabel || "Register Now"}
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export function PastCard({ e }: { e: EventItem }) {
  const date = formatEventDate(e);
  return (
    <article className="card card-hover h-full overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden">
        <SmartImage src={assetUrl(e.image)} alt={e.title} className="object-cover" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 90vw" />
      </div>
      <div className="p-5">
        {e.tag ? <span className="eyebrow">{e.tag}</span> : null}
        <h3 className="mt-3 font-display text-lg font-bold">{e.title}</h3>
        {date ? <p className="mt-1 text-xs text-muted">{date}</p> : null}
        {e.description ? <p className="mt-3 text-sm leading-relaxed text-muted">{e.description}</p> : null}
      </div>
    </article>
  );
}