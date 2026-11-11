"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Thin reading-progress line at the very top + a "back to top" button (after 500px of scrolling),
 * like the old site. The progress bar is updated without re-rendering React on every scroll event.
 */
export default function ScrollUi() {
  const bar = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
      setShowTop(y > 500);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  function toTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
        <div ref={bar} className="h-full origin-left" style={{ background: "var(--gradient-brand)", transform: "scaleX(0)" }} />
      </div>

      {/* On phones it sits above the sticky "Join" bar (bottom-center), so the two never overlap */}
      <button
        type="button"
        onClick={toTop}
        aria-label="Back to top"
        tabIndex={showTop ? 0 : -1}
        className={`card fixed right-4 z-40 grid h-12 w-12 place-items-center !rounded-full shadow-xl backdrop-blur-xl transition-all duration-300 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 md:right-6 ${
          showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <ArrowUp size={20} />
      </button>
    </>
  );
}