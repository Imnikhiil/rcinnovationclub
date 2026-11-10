export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** "assets/events/a b.webp" -> "/assets/events/a%20b.webp". Absolute URLs are returned as-is. */
export function assetUrl(path?: string | null): string {
  if (!path) return "";
  if (/^(https?:|data:|blob:|\/)/.test(path)) return path;
  return "/" + encodeURI(path.replace(/^\.?\//, ""));
}

/** Old CMS links like "#events" must work from every page. */
export function siteHref(href?: string): string {
  if (!href) return "/";
  return href.startsWith("#") ? "/" + href : href;
}

export function eventTime(e: { eventDate?: string; date?: string }): number {
  if (e.eventDate) {
    const t = Date.parse(e.eventDate + "T00:00:00");
    if (!Number.isNaN(t)) return t;
  }
  if (e.date) {
    const t = Date.parse(e.date.split("·")[0].trim());
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

/** Same rule as the old site: forceStatus wins, otherwise the date decides (today counts as upcoming). */
export function isUpcomingEvent(e: { eventDate?: string; forceStatus?: string }, now = Date.now()): boolean {
  if (e.forceStatus === "upcoming") return true;
  if (e.forceStatus === "past") return false;
  if (!e.eventDate) return false;
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  return Date.parse(e.eventDate + "T00:00:00") >= day.getTime();
}

export function initials(name?: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "RC";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDate(d?: string): string {
  if (!d) return "";
  const t = new Date(d.includes("T") ? d : `${d}T00:00:00`);
  if (Number.isNaN(t.getTime())) return d;
  return t.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function splitList(v?: string | string[]): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return v.split(",").map((t) => t.trim()).filter(Boolean);
}

/** Scrolls the tapped chip to the middle of its swipeable row (mobile). */
export function centerInRow(el: HTMLElement | null) {
  el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
}