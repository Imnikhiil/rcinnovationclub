import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";

const PAGES = ["", "about", "events", "team", "projects", "gallery", "resources", "join", "contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (await getContent()).seo.siteUrl.replace(/\/$/, "");
  return PAGES.map((p) => ({ url: p ? `${base}/${p}` : base, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 }));
}