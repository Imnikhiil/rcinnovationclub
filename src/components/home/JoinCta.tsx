import Link from "next/link";
import { MessageCircle } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

interface Props {
  eyebrow?: string;
  title: string;
  description: string;
  instagramLabel?: string;
  whatsappLabel?: string;
  instagram?: string;
  whatsapp?: string;
}

function InstagramGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function JoinCta({ eyebrow, title, description, instagramLabel, whatsappLabel, instagram, whatsapp }: Props) {
  return (
    <section id="join" className="section-y">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-line p-8 text-center sm:p-14">
            <div aria-hidden className="absolute inset-0 opacity-70" style={{ background: "radial-gradient(60% 80% at 20% 0%, var(--glow-1), transparent), radial-gradient(60% 80% at 90% 100%, var(--glow-2), transparent)" }} />
            <div className="relative mx-auto max-w-2xl">
              {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
              <p className="mt-4 leading-relaxed text-muted">{description}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/join" className="btn btn-primary">Join the Club</Link>
                {instagram ? (
                  <a href={instagram} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                    <InstagramGlyph /> {instagramLabel || "Instagram"}
                  </a>
                ) : null}
                {whatsapp ? (
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                    <MessageCircle size={18} /> {whatsappLabel || "WhatsApp"}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}