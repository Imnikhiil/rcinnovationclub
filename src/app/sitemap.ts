import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";
import { withSlugs } from "@/lib/events";
import type { EventItem } from "@/lib/types";

const PAGES = ["", "about", "events", "team", "projects", "gallery", "resources", "join", "contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const c = await getContent();
  const base = c.seo.siteUrl.replace(/\/$/, "");
  const pages: MetadataRoute.Sitemap = PAGES.map((p) => ({
    url: p ? `${base}/${p}` : base,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
  const events: MetadataRoute.Sitemap = withSlugs(c.events as unknown as EventItem[]).map((e) => ({
    url: `${base}/events/${e.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [...pages, ...events];
}