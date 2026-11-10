"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Check, Copy, Download, MessageCircle, Share2 } from "lucide-react";
import { eventStartMs } from "@/lib/countdown";

interface Props {
  title: string;
  description?: string;
  venue?: string;
  eventDate?: string;
  time?: string;
  /** Show the "Add to calendar" buttons (upcoming events with a date only). */
  showCalendar: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");
/** Local "floating" time: 20261205T100000 */
const fmtLocal = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
};
const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export default function EventActions({ title, description, venue, eventDate, time, showCalendar }: Props) {
  const start = useMemo(() => eventStartMs({ eventDate, time }), [eventDate, time]);
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const pageUrl = () => window.location.href;
  const END_AFTER_MS = 2 * 60 * 60 * 1000; // events have no end time: assume 2 hours

  function googleHref() {
    if (start === null) return "#";
    const q = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${fmtLocal(start)}/${fmtLocal(start + END_AFTER_MS)}`,
      details: `${description ? description + "\n\n" : ""}${typeof window !== "undefined" ? pageUrl() : ""}`,
      location: venue || "",
    });
    return `https://calendar.google.com/calendar/render?${q.toString()}`;
  }

  function downloadIcs() {
    if (start === null) return;
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//RC Innovation Club//Events//EN",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@rc-innovation-club`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${fmtLocal(start)}`,
      `DTEND:${fmtLocal(start + END_AFTER_MS)}`,
      `SUMMARY:${icsEscape(title)}`,
      `DESCRIPTION:${icsEscape(`${description ? description + "\n\n" : ""}${pageUrl()}`)}`,
      venue ? `LOCATION:${icsEscape(venue)}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "event.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", pageUrl());
    }
  }

  const calendarOn = showCalendar && start !== null;
  const btn = "btn btn-ghost !px-4 !py-2.5 text-sm";

  return (
    <div className="mt-8 space-y-5">
      {calendarOn ? (
        <div>
          <p className="label">Add to calendar</p>
          <div className="flex flex-wrap gap-2">
            <a href={googleHref()} target="_blank" rel="noopener noreferrer" className={btn}>
              <CalendarPlus size={16} /> Google Calendar
            </a>
            <button type="button" onClick={downloadIcs} className={btn}>
              <Download size={16} /> Apple / Outlook (.ics)
            </button>
          </div>
        </div>
      ) : null}

      <div>
        <p className="label">Share this event</p>
        <div className="flex flex-wrap gap-2">
          {canShare ? (
            <button type="button" onClick={() => navigator.share({ title, url: pageUrl() }).catch(() => {})} className={btn}>
              <Share2 size={16} /> Share
            </button>
          ) : null}
          <a
            href="#share"
            onClick={(e) => {
              e.preventDefault();
              window.open(`https://wa.me/?text=${encodeURIComponent(`${title}\n${pageUrl()}`)}`, "_blank", "noopener,noreferrer");
            }}
            className={btn}
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
          <button type="button" onClick={copyLink} className={btn}>
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}