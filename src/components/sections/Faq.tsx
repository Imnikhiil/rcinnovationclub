import { Plus } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import type { FaqSection } from "@/lib/faq";

/** Accordion built on native <details>: works without JavaScript, is keyboard accessible, and is crawlable. */
export default function Faq({ faq }: { faq: FaqSection }) {
  if (!faq.enabled || faq.items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };

  return (
    <section className="section-y" id="faq">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container-x max-w-3xl">
        <SectionHeading eyebrow={faq.eyebrow} title={faq.title} subtitle={faq.subtitle} />
        <div className="space-y-3">
          {faq.items.map((item, i) => (
            <Reveal key={`${item.question}-${i}`} delay={Math.min(i, 5) * 0.04}>
              <details className="group card overflow-hidden">
                <summary className="flex min-h-[3.5rem] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display text-[0.95rem] font-semibold sm:text-base [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-accent transition-transform duration-300 group-open:rotate-45">
                    <Plus size={18} />
                  </span>
                </summary>
                <p className="whitespace-pre-line px-5 pb-5 text-sm leading-relaxed text-muted sm:text-[0.95rem]">{item.answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}