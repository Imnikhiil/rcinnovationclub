"use client";

import Image from "next/image";
import { useState } from "react";
import { initials } from "@/lib/utils";

interface Props {
  src?: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** true for people photos: the placeholder then shows initials */
  person?: boolean;
}

function canOptimize(src: string) {
  if (src.startsWith("/")) return true;
  try {
    const host = new URL(src).hostname;
    return host === "images.unsplash.com" || host.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

function Placeholder({ alt, person }: { alt: string; person?: boolean }) {
  return (
    <div
      role="img"
      aria-label={alt}
      className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#0a1020] via-[#0b3b4d] to-[#2e1a5e] text-center"
    >
      <div>
        <div className="font-display text-5xl font-extrabold text-accent/90 sm:text-6xl">
          {person ? initials(alt) : "RC"}
        </div>
        {!person && alt ? (
          <div className="mt-2 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            {alt.slice(0, 34)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * A photo that never shows a broken-image icon: if the file is missing or
 * the link is dead, a branded placeholder appears instead.
 * The parent element must be `relative` and have a size.
 */
export default function SmartImage({ src, alt, className, sizes, priority, person }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <Placeholder alt={alt} person={person} />;

  if (!canOptimize(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`absolute inset-0 h-full w-full ${className ?? ""}`}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes ?? "(min-width: 1024px) 33vw, 100vw"}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}