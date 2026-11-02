"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface Props {
  badge: string;
  title: string;
  highlight: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
}

const CHIPS = [
  { label: "Innovation", className: "right-0 top-[8%]", delay: 0 },
  { label: "Workshops", className: "-left-2 top-[62%]", delay: 0.8 },
  { label: "Community", className: "bottom-[6%] right-[6%]", delay: 1.6 },
];

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero({ badge, title, highlight, description, primaryLabel, secondaryLabel }: Props) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div aria-hidden className="pointer-events-none absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full blur-3xl" style={{ background: "var(--glow-1)" }} />
      <div aria-hidden className="pointer-events-none absolute -right-32 top-24 h-[28rem] w-[28rem] rounded-full blur-3xl" style={{ background: "var(--glow-2)" }} />

      <div className="container-x relative grid items-center gap-12 py-14 lg:min-h-[calc(100svh-110px)] lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div>
          <motion.span
            className="eyebrow"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {badge}
          </motion.span>

          <motion.h1
            className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease }}
          >
            {title}
            <br />
            <span className="text-gradient">{highlight}</span>
          </motion.h1>

          <motion.p
            className="mt-6 max-w-xl text-lg leading-relaxed text-muted"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease }}
          >
            {description}
          </motion.p>

          <motion.div
            className="mt-9 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.28, ease }}
          >
            <Link href="/#events" className="btn btn-primary">
              {primaryLabel} <ArrowRight size={18} />
            </Link>
            <Link href="/about" className="btn btn-ghost">
              {secondaryLabel}
            </Link>
          </motion.div>
        </div>

        {/* Decorative orbit */}
        <motion.div
          aria-hidden
          className="relative mx-auto aspect-square w-[min(78vw,400px)]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
        >
          {[100, 78, 56].map((size, i) => (
            <motion.div
              key={size}
              className="absolute left-1/2 top-1/2 rounded-full border"
              style={{
                width: `${size}%`,
                height: `${size}%`,
                x: "-50%",
                y: "-50%",
                borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
                borderStyle: i === 0 ? "dashed" : "solid",
              }}
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: 40 + i * 14, ease: "linear", repeat: Infinity }}
            />
          ))}

          <div className="absolute left-1/2 top-1/2 h-[30%] w-[30%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-[0_0_60px_-10px_var(--accent-glow)]">
            <Image src="/assets/logo/logo.webp" alt="" fill sizes="120px" className="object-contain p-3" priority />
          </div>

          {CHIPS.map((chip) => (
            <motion.span
              key={chip.label}
              className={`card absolute rounded-full px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-widest ${chip.className}`}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, delay: chip.delay, repeat: Infinity, ease: "easeInOut" }}
            >
              {chip.label}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}