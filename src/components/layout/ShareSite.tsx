"use client";

import { useEffect, useRef, useState } from "react";
import { Link2, Share2 } from "lucide-react";

export interface ShareConfig {
  enabled?: boolean;
  sectionLabel?: string;
  title?: string;
  text?: string;
  platforms?: string[];
  copySuccess?: string;
  copyError?: string;
}

const LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  twitter: "X",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  telegram: "Telegram",
  copy: "Copy link",
};

function buildUrl(platform: string, url: string, text: string): string | null {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  switch (platform) {
    case "whatsapp": return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
    case "twitter": return `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
    case "facebook": return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "linkedin": return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "telegram": return `https://t.me/share/url?url=${u}&text=${t}`;
    default: return null;
  }
}

/** "Share this site" row in the footer. Shares whichever page the visitor is on. */
export default function ShareSite({ share }: { share: ShareConfig }) {
  const [msg, setMsg] = useState("");
  const [canNative, setCanNative] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCanNative(typeof navigator !== "undefined" && typeof navigator.share === "function");
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (share.enabled === false) return null;
  const platforms = share.platforms?.length ? share.platforms : ["whatsapp", "twitter", "facebook", "linkedin", "copy"];
  const text = share.text || share.title || "";

  function flash(m: string) {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 2500);
  }

  async function onClick(platform: string) {
    const url = window.location.href;
    if (platform === "copy") {
      try {
        await navigator.clipboard.writeText(url);
        flash(share.copySuccess || "Link copied!");
      } catch {
        flash(share.copyError || "Could not copy link. Please copy the URL manually.");
      }
      return;
    }
    const target = buildUrl(platform, url, text);
    if (target) window.open(target, "_blank", "noopener,noreferrer,width=600,height=500");
  }

  const btn = "btn btn-ghost !min-h-0 !px-3.5 !py-2 text-xs";

  return (
    <div className="text-center">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{share.sectionLabel || "Share this site"}</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {canNative ? (
          <button type="button" className={btn} onClick={() => navigator.share({ title: share.title, text, url: window.location.href }).catch(() => {})}>
            <Share2 size={14} /> Share
          </button>
        ) : null}
        {platforms.map((p) => (
          <button key={p} type="button" className={btn} onClick={() => void onClick(p)} aria-label={p === "copy" ? "Copy link" : `Share on ${LABELS[p] || p}`}>
            {p === "copy" ? <Link2 size={14} /> : null} {LABELS[p] || p}
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite" className="mt-3 min-h-[1.25rem] text-xs font-semibold text-emerald-400">{msg}</p>
    </div>
  );
}