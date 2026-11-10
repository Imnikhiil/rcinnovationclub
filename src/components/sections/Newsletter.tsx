import Reveal from "@/components/ui/Reveal";
import NewsletterForm from "@/components/forms/NewsletterForm";
import { getContent } from "@/lib/content";

/** Newsletter block shown at the bottom of About, Events, Projects, Resources, Contact, Join (like the old site). */
export default async function Newsletter() {
  const n = (await getContent()).newsletterSection;
  if (n.enabled === false) return null;

  return (
    <section className="section-y" id="newsletter">
      <div className="container-x">
        <Reveal>
          <div className="card grid gap-6 p-5 sm:p-10 md:grid-cols-[1fr_1.1fr] md:items-center">
            <div>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">{n.title}</h2>
              <p className="mt-3 text-muted">{n.subtitle}</p>
              {n.privacyNote ? <p className="mt-2 text-xs text-muted">{n.privacyNote}</p> : null}
            </div>
            <NewsletterForm placeholder={n.placeholder} buttonLabel={n.buttonLabel} successMessage={n.successMessage} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}