export interface NextEventData {
  title: string;
  tag?: string;
  eventDate: string;
  time?: string;
  registerUrl?: string;
  registerLabel?: string;
}

/**
 * Start moment of an event in the visitor's local time.
 * Uses eventDate ("2026-12-05") and the first clock time found in `time` ("10:00 AM" or "14:30").
 * No readable time = start of that day.
 */
export function eventStartMs(e: { eventDate?: string; time?: string }): number | null {
  if (!e.eventDate) return null;
  let h = 0;
  let m = 0;
  const t = e.time || "";
  const ampm = t.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  const h24 = t.match(/(\d{1,2}):(\d{2})/);
  if (ampm) {
    h = Number(ampm[1]);
    m = Number(ampm[2] || 0);
    const ap = ampm[3].toUpperCase();
    if (ap === "PM" && h < 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
  } else if (h24) {
    h = Number(h24[1]);
    m = Number(h24[2]);
  }
  if (h > 23 || m > 59) {
    h = 0;
    m = 0;
  }
  const d = new Date(`${e.eventDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}