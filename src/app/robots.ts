import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = (await getContent()).seo.siteUrl.replace(/\/$/, "");
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${base}/sitemap.xml` };
}