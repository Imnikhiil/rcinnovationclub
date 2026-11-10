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
            <div className="card h-full p-7">
              <h2 className="font-display text-xl font-bold">Reach RC Innovation Club</h2>
              <p className="mt-2 text-sm text-muted">
                We welcome questions from students, faculty, sponsors, and partner organizations.
              </p>
              <ul className="mt-6 space-y-4 text-sm">
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-accent" />
                  <a href={`mailto:${c.social.email}`} className="hover:text-accent">{c.social.email}</a>
                </li>
                <li className="flex items-center gap-3">
                  <Globe size={18} className="text-accent" />
                  <a href={c.social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-accent">Instagram</a>
                </li>
                <li className="flex items-center gap-3">
                  <MessageCircle size={18} className="text-accent" />
                  <a href={c.social.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-accent">WhatsApp Channel</a>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin size={18} className="text-accent" />
                  <span>DSEU Rajokri Campus, New Delhi</span>
                </li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="card p-7">
              <ContactForm labels={s} notify={getNotifyConfig(c)} />
            </div>
          </Reveal>
        </div>
      </section>
      <Newsletter />
    </>
  );
}