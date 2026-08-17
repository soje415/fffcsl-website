import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-line bg-cream-soft">
      <Container className="py-16 sm:py-20">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-terracotta">
            {eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold leading-tight text-forest-dark sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
              {description}
            </p>
          )}
        </Reveal>
      </Container>
    </div>
  );
}
