import Link from "next/link";
import { Eye, Sparkles, Target, ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  mission: string;
  vision: string;
  culture: string;
}

export default function About({ eyebrow, title, subtitle, mission, vision, culture }: Props) {
  const cards = [
    { icon: Target, heading: "Mission", text: mission, color: "var(--accent)" },
    { icon: Eye, heading: "Vision", text: vision, color: "var(--accent-2)" },
    { icon: Sparkles, heading: "Culture", text: culture, color: "#34d399" },
  ];

  return (
    <section id="about" className="section-y bg-bg-soft/60">
      <div className="container-x">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.heading} delay={i * 0.08}>
              <article className="card card-hover h-full p-7">
                <span
                  className="grid h-12 w-12 place-items-center rounded-xl"
                  style={{ background: `color-mix(in srgb, ${c.color} 16%, transparent)`, color: c.color }}
                >
                  <c.icon size={22} />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold">{c.heading}</h3>
                <p className="mt-3 leading-relaxed text-muted">{c.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10 text-center">
          <Link href="/about" className="btn btn-ghost">
            Learn more about us <ArrowRight size={18} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}