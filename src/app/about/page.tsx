import { Eye, Sparkles, Target } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import SmartImage from "@/components/ui/SmartImage";
import TestimonialsCarousel from "@/components/about/TestimonialsCarousel";
import Newsletter from "@/components/sections/Newsletter";
import { getContent } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { assetUrl } from "@/lib/utils";
import type { FacultyItem, LegacyItem, PartnerItem, TestimonialItem } from "@/lib/types";

export async function generateMetadata() {
  return pageMetadata("about");
}

const PARTNER_GROUPS: { type: string; label: string }[] = [
  { type: "sponsor", label: "Sponsors" },
  { type: "partner", label: "Partners" },
  { type: "collaborator", label: "Collaborators" },
];

export default async function AboutPage() {
  const c = await getContent();
  const a = c.about;
  const faculty = c.faculty as unknown as FacultyItem[];
  const legacy = c.legacy as unknown as LegacyItem[];
  const testimonials = c.testimonials as unknown as TestimonialItem[];
  const partners = c.partners as unknown as PartnerItem[];

  const cards = [
    { icon: Target, heading: "Mission", text: a.mission, color: "var(--accent)" },
    { icon: Eye, heading: "Vision", text: a.vision, color: "var(--accent-2)" },
    { icon: Sparkles, heading: "Culture", text: a.culture, color: "#34d399" },
  ];

  return (
    <>
      <PageHeader eyebrow={a.eyebrow} title={a.title} subtitle={a.subtitle} />

      <section className="section-y pt-6">
        <div className="container-x grid gap-4 md:grid-cols-3">
          {cards.map((x, i) => (
            <Reveal key={x.heading} delay={i * 0.08}>
              <article className="card card-hover h-full p-7">
                <span className="grid h-12 w-12 place-items-center rounded-xl"
                  style={{ background: `color-mix(in srgb, ${x.color} 16%, transparent)`, color: x.color }}>
                  <x.icon size={22} />
                </span>
                <h2 className="mt-5 font-display text-xl font-bold">{x.heading}</h2>
                <p className="mt-3 leading-relaxed text-muted">{x.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {faculty.length > 0 ? (
        <section className="section-y bg-bg-soft/60" id="faculty">
          <div className="container-x">
            <SectionHeading eyebrow={c.facultySection.eyebrow} title={c.facultySection.title} subtitle={c.facultySection.subtitle} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {faculty.map((f, i) => (
                <Reveal key={`${f.name}-${i}`} delay={(i % 3) * 0.08}>
                  <article className="card card-hover h-full overflow-hidden text-center">
                    <div className="relative mx-auto mt-6 h-28 w-28 overflow-hidden rounded-full border border-[var(--border)]">
                      <SmartImage src={assetUrl(f.image)} alt={f.name} person className="object-cover" sizes="112px" />
                    </div>
                    <div className="p-6 pt-4">
                      <h3 className="font-display text-lg font-bold">{f.name}</h3>
                      {f.designation ? <p className="text-sm text-muted">{f.designation}</p> : null}
                      {f.role ? <p className="mt-2 text-sm font-semibold text-accent">{f.role}</p> : null}
                      {f.period ? <p className="mt-1 text-xs text-muted">{f.period}</p> : null}
                      {f.description ? <p className="mt-3 text-sm leading-relaxed text-muted">{f.description}</p> : null}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {legacy.length > 0 ? (
        <section className="section-y" id="legacy">
          <div className="container-x max-w-3xl">
            <SectionHeading eyebrow={c.legacySection.eyebrow} title={c.legacySection.title} subtitle={c.legacySection.subtitle} />
            <ol className="relative space-y-6 border-l border-[var(--border)] pl-6">
              {legacy.map((l, i) => (
                <Reveal key={`${l.year}-${i}`} delay={(i % 4) * 0.05}>
                  <li className="relative">
                    <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-[var(--accent)] ring-4 ring-[var(--accent-soft)]" />
                    <span className="eyebrow">{l.year}</span>
                    <h3 className="mt-2 font-display text-lg font-bold">{l.title}</h3>
                    {l.description ? <p className="mt-1 text-sm leading-relaxed text-muted">{l.description}</p> : null}
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {testimonials.length > 0 ? (
        <section className="section-y bg-bg-soft/60" id="testimonials">
          <div className="container-x">
            <SectionHeading eyebrow={c.testimonialsSection.eyebrow} title={c.testimonialsSection.title} subtitle={c.testimonialsSection.subtitle} />
            <TestimonialsCarousel items={testimonials} />
          </div>
        </section>
      ) : null}

      {partners.length > 0 ? (
        <section className="section-y" id="partners">
          <div className="container-x">
            <SectionHeading eyebrow={c.partnersSection.eyebrow} title={c.partnersSection.title} subtitle={c.partnersSection.subtitle} />
            {PARTNER_GROUPS.map((g) => {
              const list = partners.filter((p) => (p.type || "partner") === g.type);
              if (!list.length) return null;
              return (
                <div key={g.type} className="mb-8">
                  <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-[0.18em] text-muted">{g.label}</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((p, i) => {
                      const inner = (
                        <article className="card card-hover h-full p-5 text-center">
                          <div className="relative mx-auto h-14 w-28">
                            {p.logo ? (
                              <SmartImage src={assetUrl(p.logo)} alt={p.name} className="object-contain" sizes="112px" />
                            ) : (
                              <span className="grid h-full place-items-center font-display text-xl font-extrabold text-gradient">{p.name}</span>
                            )}
                          </div>
                          {p.logo ? <h4 className="mt-3 font-display font-bold">{p.name}</h4> : null}
                          {p.description ? <p className="mt-2 text-sm leading-relaxed text-muted">{p.description}</p> : null}
                        </article>
                      );
                      return p.url ? (
                        <a key={`${p.name}-${i}`} href={p.url} target="_blank" rel="noopener noreferrer">{inner}</a>
                      ) : (
                        <div key={`${p.name}-${i}`}>{inner}</div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <Newsletter />
    </>
  );
}