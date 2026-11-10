import PageHeader from "@/components/ui/PageHeader";
import GalleryExplorer from "@/components/gallery/GalleryExplorer";
import { getContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import type { GalleryItem } from "@/lib/types";

export async function generateMetadata() {
  return pageMetadata("gallery");
}

export default async function GalleryPage() {
  const c = await getContent();
  const s = c.gallerySection;
  return (
    <>
      <PageHeader eyebrow={s.eyebrow} title={s.title} subtitle={s.subtitle} />
      <section className="section-y pt-6">
        <div className="container-x">
          <GalleryExplorer items={c.gallery as unknown as GalleryItem[]} />
        </div>
      </section>
    </>
  );
}