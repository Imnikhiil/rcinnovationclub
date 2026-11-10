"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { eventStartMs, type NextEventData } from "@/lib/countdown";
import { siteHref } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");

/** "Next event" card with a live countdown. Renders nothing once the event has started. */
export default function NextEventCountdown({ event }: { event: NextEventData }) {
  const start = useMemo(() => eventStartMs(event), [event]);
  const [now, setNow] = useState<number | null>(null); // null until mounted: no server/client mismatch

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (start === null) return null;
  if (now === null) return <div aria-hidden className="mt-8 h-[10.5rem] max-w-xl sm:h-[9.5rem]" />; // reserves space, avoids a jump

  const diff = start - now;
  if (diff <= 0) return null;

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const units = [
    { label: "Days", value: days },
    { label: "Hours", value: hours },
    { label: "Mins", value: mins },
    { label: "Secs", value: secs },
  ];

  const external = !!event.registerUrl && event.registerUrl.startsWith("http");
  const linkProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <motion.div
      className="card mt-8 max-w-xl p-4 sm:p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Next Event
          </span>
          <p className="mt-2 truncate font-display text-base font-bold sm:text-lg">{event.title}</p>
        </div>
        {event.registerUrl ? (
          <Link href={siteHref(event.registerUrl)} {...linkProps} className="btn btn-primary hidden shrink-0 !px-4 !py-2.5 text-sm sm:inline-flex">
            {event.registerLabel || "Register"}
          </Link>
        ) : null}
      </div>

      <div role="timer" aria-label={`${days} days ${hours} hours ${mins} minutes left`} className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
        {units.map((u) => (
          <div key={u.label} className="rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] py-2.5 text-center">
            <span className="block font-display text-2xl font-extrabold tabular-nums leading-none sm:text-3xl">{pad(u.value)}</span>
            <span className="mt-1 block text-[0.6rem] font-semibold uppercase tracking-widest text-muted">{u.label}</span>
          </div>
        ))}
      </div>

      {event.registerUrl ? (
        <Link href={siteHref(event.registerUrl)} {...linkProps} className="btn btn-primary mt-4 w-full sm:hidden">
          {event.registerLabel || "Register Now"}
        </Link>
      ) : null}
    </motion.div>
  );
}