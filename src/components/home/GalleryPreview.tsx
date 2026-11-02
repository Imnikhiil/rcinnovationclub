import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import SmartImage from "@/components/ui/SmartImage";
import { assetUrl } from "@/lib/utils";
import type { GalleryItem } from "@/lib/types";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: GalleryItem[];
}

function thumb(item: GalleryItem) {
  const url = item.type === "video" ? item.thumbnailUrl || item.mediaUrl : item.mediaUrl || item.src || item.image;
  return assetUrl(url);
}

export default function GalleryPreview({ eyebrow, title, subtitle, items }: Props) {
  const shown = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).slice(0, 6);
  if (!shown.length) return null;

  return (
    <section id="gallery" className="section-y bg-bg-soft/60">
      <div className="container-x">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {shown.map((item, i) => (
            <Reveal key={item.id ?? i} delay={(i % 3) * 0.06}>
              <Link
                href="/gallery"
                className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-line"
                aria-label={item.title ? `Open gallery: ${item.title}` : "Open gallery"}
              >
                <SmartImage
                  src={thumb(item)}
                  alt={item.title || "Gallery photo"}
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(min-width: 1024px) 33vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
                {item.type === "video" ? (
                  <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white">
                    <Play size={16} />
                  </span>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  {item.category ? (
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-accent">{item.category}</span>
                  ) : null}
                  {item.title ? <p className="mt-1 font-display text-sm font-bold text-white sm:text-base">{item.title}</p> : null}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10 text-center">
          <Link href="/gallery" className="btn btn-ghost">
            View full gallery <ArrowRight size={18} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}