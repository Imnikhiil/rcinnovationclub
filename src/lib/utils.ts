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

export function initials(name?: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "RC";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}