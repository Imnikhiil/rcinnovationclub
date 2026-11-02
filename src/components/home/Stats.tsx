"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "framer-motion";
import { CalendarCheck, Clock, GraduationCap, Sparkles, Users, type LucideIcon } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import type { StatItem } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  "calendar-check": CalendarCheck,
  users: Users,
  clock: Clock,
  "graduation-cap": GraduationCap,
};

const ACCENTS: Record<string, string> = {
  sky: "#38bdf8",
  indigo: "#a78bfa",
  emerald: "#34d399",
  amber: "#fbbf24",
};

function iconFor(name?: string): LucideIcon {
  const key = (name || "").split(" ").pop()?.replace("fa-", "") ?? "";
  return ICONS[key] ?? Sparkles;
}

function CountUp({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref}>
      {prefix}
      {n}
      {suffix}
    </span>
  );
}

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  stats: StatItem[];
}

export default function Stats({ eyebrow, title, subtitle, stats }: Props) {
  return (
    <section id="stats" className="section-y">
      <div className="container-x">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => {
            const Icon = iconFor(s.icon);
            const color = ACCENTS[s.accent ?? "sky"] ?? ACCENTS.sky;
            return (
              <motion.div
                key={s.label}
                className="card card-hover p-6"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${color}22`, color }}>
                  <Icon size={22} />
                </span>
                <p className="mt-5 font-display text-4xl font-extrabold" style={{ color }}>
                  <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em]">{s.label}</p>
                {s.description ? <p className="mt-2 text-sm text-muted">{s.description}</p> : null}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}