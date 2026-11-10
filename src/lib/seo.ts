import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import { assetUrl } from "@/lib/utils";

export type SeoPageKey = "about" | "events" | "team" | "projects" | "gallery" | "resources" | "join" | "contact";

/** Per-page title/description from the CMS (seo.pages.*), same values the old site used. */
export async function pageMetadata(key: SeoPageKey): Promise<Metadata> {
  const c = await getContent();
  const p = c.seo.pages[key];
  const image = assetUrl(p.ogImage || c.seo.defaultImage);
  return {
    title: { absolute: p.title },
    description: p.description,
    keywords: p.keywords,
    alternates: { canonical: `/${key}` },
    robots: p.robots,
    openGraph: { title: p.title, description: p.description, url: `/${key}`, images: [image], type: "website" },
    twitter: { card: "summary_large_image", title: p.title, description: p.description, images: [image] },
  };
}