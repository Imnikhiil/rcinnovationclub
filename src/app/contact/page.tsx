import { Globe, Mail, MapPin, MessageCircle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Reveal from "@/components/ui/Reveal";
import ContactForm from "@/components/forms/ContactForm";
import Newsletter from "@/components/sections/Newsletter";
import { getContent } from "@/lib/content";
import { getNotifyConfig } from "@/lib/notify-config";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return pageMetadata("contact");
}

export default async function ContactPage() {
  const c = await getContent();
  const s = c.contactSection;

  return (
    <>
      <PageHeader eyebrow={s.eyebrow} title={s.title} subtitle={s.subtitle} />
      <section className="section-y pt-6">
        <div className="container-x grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <div className="card h-full p-5 sm:p-7">
              <h2 className="font-display text-xl font-bold">Reach RC Innovation Club</h2>
              <p className="mt-2 text-sm text-muted">
                We welcome questions from students, faculty, sponsors, and partner organizations.
              </p>
              <ul className="mt-5 space-y-3 text-sm">
                {[
                  { icon: Mail, label: c.social.email, href: `mailto:${c.social.email}` },
                  { icon: Globe, label: "Instagram", href: c.social.instagram },
                  { icon: MessageCircle, label: "WhatsApp Channel", href: c.social.whatsapp },
                ].map((r) => (
                  <li key={r.label}>
                    <a
                      href={r.href}
                      {...(r.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="flex min-h-[3.25rem] items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-3 font-medium transition-colors active:bg-[var(--accent-soft)] hover:border-[var(--accent)]"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-accent"><r.icon size={18} /></span>
                      <span className="break-all">{r.label}</span>
                    </a>
                  </li>
                ))}
                <li className="flex min-h-[3.25rem] items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-3 font-medium">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-accent"><MapPin size={18} /></span>
                  <span>DSEU Rajokri Campus, New Delhi</span>
                </li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="card p-5 sm:p-7">
              <ContactForm labels={s} notify={getNotifyConfig(c)} />
            </div>
          </Reveal>
        </div>
      </section>
      <Newsletter />
    </>
  );
}