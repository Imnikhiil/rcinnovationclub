import Reveal from "./Reveal";

interface Props {
  eyebrow?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
}

export default function SectionHeading({ eyebrow, title, highlight, subtitle }: Props) {
  return (
    <Reveal className="mx-auto mb-10 max-w-2xl text-center">
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {title} {highlight ? <span className="text-gradient">{highlight}</span> : null}
      </h2>
      {subtitle ? <p className="mt-4 leading-relaxed text-muted">{subtitle}</p> : null}
    </Reveal>
  );
}