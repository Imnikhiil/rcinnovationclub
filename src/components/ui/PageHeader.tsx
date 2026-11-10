import Reveal from "./Reveal";

interface Props {
  eyebrow?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
}

/** Top of every inner page (the page's single <h1>). */
export default function PageHeader({ eyebrow, title, highlight, subtitle }: Props) {
  return (
    <header className="container-x pb-4 pt-8 text-center sm:pb-6 sm:pt-16">
      <Reveal className="mx-auto max-w-2xl">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1 className="mt-4 font-display text-[2rem] font-extrabold leading-tight tracking-tight sm:text-5xl">
          {title} {highlight ? <span className="text-gradient">{highlight}</span> : null}
        </h1>
        {subtitle ? <p className="mt-3 text-[0.95rem] leading-relaxed text-muted sm:mt-4 sm:text-base">{subtitle}</p> : null}
      </Reveal>
    </header>
  );
}