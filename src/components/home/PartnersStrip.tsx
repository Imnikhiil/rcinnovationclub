import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import SmartImage from "@/components/ui/SmartImage";
import Reveal from "@/components/ui/Reveal";
import { assetUrl } from "@/lib/utils";
import type { PartnerItem } from "@/lib/types";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  partners: PartnerItem[];
}

const TYPE_LABEL: Record<string, string> = { sponsor: "Sponsor", partner: "Partner", collaborator: "Collaborator" };

function Item({ p, hidden }: { p: PartnerItem; hidden?: boolean }) {
  const body = (
    <div className="card flex h-full min-w-[11rem] flex-col items-center justify-center gap-2 px-5 py-4 text-center sm:min-w-[13rem]">
      {p.logo ? (
        <div className="relative h-11 w-28 overflow-hidden rounded-lg bg-white">
          <SmartImage src={assetUrl(p.logo)} alt={hidden ? "" : p.name} className="object-contain p-1" sizes="112px" />
        </div>
      ) : (
        <span className="font-display text-lg font-extrabold leading-tight text-gradient">{p.name}</span>
      )}
      {p.logo ? <span className="text-sm font-bold leading-tight">{p.name}</span> : null}
      <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted">
        {TYPE_LABEL[p.type || "partner"] || "Partner"}
      </span>
    </div>
  );

  return p.url ? (
    <a href={p.url} target="_blank" rel="noopener noreferrer" tabIndex={hidden ? -1 : undefined} className="block">
      {body}
    </a>
  ) : (
    <div>{body}</div>
  );
}

/**
 * Endless, CSS-only scrolling row of partners/sponsors (pauses on hover).
 * The list is repeated until one "half" is wider than a big screen, then shown twice for a seamless loop.
 * The second half is hidden from screen readers and the Tab key.
 */
export default function PartnersStrip({ eyebrow, title, subtitle, partners }: Props) {
  if (!partners.length) return null;

  const repeat = Math.max(1, Math.ceil(12 / partners.length));
  const half = Array.from({ length: repeat }, () => partners).flat();
  const duration = Math.max(30, half.length * 4); // seconds for one full loop

  return (
    <section className="section-y bg-bg-soft/60" id="partners">
      <div className="container-x">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
      </div>

      <Reveal>
        <div className="marquee" aria-label="Our partners and sponsors">
          <div className="marquee-track" style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}>
            {[false, true].map((hidden) => (
              <div key={String(hidden)} aria-hidden={hidden || undefined} className="flex shrink-0 gap-4 pr-4">
                {half.map((p, i) => (
                  <Item key={`${p.name}-${i}`} p={p} hidden={hidden} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <div className="container-x mt-8 text-center">
        <Link href="/about#partners" className="btn btn-ghost">
          All partners <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}