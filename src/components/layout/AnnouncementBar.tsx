"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { siteHref } from "@/lib/utils";

interface Props {
  id: string;
  message: string;
  linkUrl?: string;
  linkLabel?: string;
  dismissible?: boolean;
}

export default function AnnouncementBar({ id, message, linkUrl, linkLabel, dismissible }: Props) {
  const [hidden, setHidden] = useState(false);
  const storageKey = `rc-announce-${id}`;

  useEffect(() => {
    try {
      if (sessionStorage.getItem(storageKey)) setHidden(true);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  if (hidden) return null;

  function close() {
    setHidden(true);
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative bg-[image:var(--gradient-brand)] px-10 py-2.5 text-center text-sm font-semibold text-[var(--on-accent)]">
      <span>{message}</span>
      {linkUrl ? (
        <Link href={siteHref(linkUrl)} className="ml-3 underline underline-offset-4">
          {linkLabel || "Learn more"}
        </Link>
      ) : null}
      {dismissible ? (
        <button
          type="button"
          onClick={close}
          aria-label="Close announcement"
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg hover:bg-black/10"
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}