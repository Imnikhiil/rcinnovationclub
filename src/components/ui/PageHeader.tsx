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
    <header className="container-x pb-6 pt-12 text-center sm:pt-16">
      <Reveal className="mx-auto max-w-2xl">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          {title} {highlight ? <span className="text-gradient">{highlight}</span> : null}
        </h1>
        {subtitle ? <p className="mt-4 leading-relaxed text-muted">{subtitle}</p> : null}
      </Reveal>
    </header>
  );
}