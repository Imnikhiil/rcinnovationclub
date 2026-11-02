import Link from "next/link";
import { Mail } from "lucide-react";

interface Props {
  brand: string;
  description: string;
  email?: string;
  copyright?: string;
  instagram?: string;
  whatsapp?: string;
}

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/team", label: "Team" },
  { href: "/projects", label: "Projects" },
  { href: "/gallery", label: "Gallery" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
  { href: "/join", label: "Join" },
];

export default function Footer({ brand, description, email, copyright, instagram, whatsapp }: Props) {
  return (
    <footer className="border-t border-line bg-bg-soft">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-xl font-bold">{brand}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Explore</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted transition-colors hover:text-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Connect</p>
          <ul className="mt-4 space-y-2 text-sm">
            {email ? (
              <li>
                <a href={`mailto:${email}`} className="inline-flex items-center gap-2 text-muted transition-colors hover:text-accent">
                  <Mail size={15} /> {email}
                </a>
              </li>
            ) : null}
            {instagram ? (
              <li>
                <a href={instagram} target="_blank" rel="noopener noreferrer" className="text-muted transition-colors hover:text-accent">
                  Instagram
                </a>
              </li>
            ) : null}
            {whatsapp ? (
              <li>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="text-muted transition-colors hover:text-accent">
                  WhatsApp Channel
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">{copyright}</div>
    </footer>
  );
}