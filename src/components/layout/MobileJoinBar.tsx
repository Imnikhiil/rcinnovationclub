"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserPlus, X } from "lucide-react";
import { getRegistrationStatus } from "@/lib/registration";
import type { RegistrationConfig } from "@/lib/types";

const KEY = "rc-joinbar-dismissed";

/**
 * Phone-only sticky "Join" bar.
 * Shows only while membership registration is open, after the visitor scrolls a bit.
 * Hidden on /join, while typing in a form, near the page bottom (so the footer stays readable),
 * and after the visitor closes it (remembered for this browser session).
 */
export default function MobileJoinBar({ registration }: { registration: RegistrationConfig }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [nearBottom, setNearBottom] = useState(false);
  const [typing, setTyping] = useState(false);
  const [dismissed, setDismissed] = useState(true); // true until we've read sessionStorage (no flash)

  useEffect(() => {
    setOpen(getRegistrationStatus(registration) === "open");
    try {
      setDismissed(sessionStorage.getItem(KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, [registration]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 400);
      setNearBottom(window.innerHeight + y >= document.documentElement.scrollHeight - 180);
    };
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement | null;
      setTyping(!!t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
    };
    const onFocusOut = () => setTyping(false);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, [pathname]);

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  }

  const visible = open && !dismissed && scrolled && !nearBottom && !typing && pathname !== "/join";

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="join-bar"
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
        >
          <div className="card flex items-center gap-3 !rounded-2xl p-2.5 pl-4 shadow-2xl backdrop-blur-xl">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold leading-tight">Join RC Innovation Club</p>
              <p className="truncate text-[0.72rem] text-muted">Registrations are open</p>
            </div>
            <Link href="/join" className="btn btn-primary shrink-0 !px-4 !py-2.5 text-sm">
              <UserPlus size={16} /> Join Now
            </Link>
            <button type="button" onClick={dismiss} aria-label="Dismiss" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-[var(--accent-soft)]">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}