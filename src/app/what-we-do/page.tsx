import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal, RevealGroup } from "@/components/ui/reveal";
import { WHAT_WE_DO, STRATEGIC_FOCUS_AREAS } from "@/lib/content";

export const metadata: Metadata = {
  title: "What We Do",
  description:
    "How FFFCSL supports farmers: mobilization, production, irrigation, mechanisation, extension services, agribusiness, market development, and access to finance.",
};

export default function WhatWeDoPage() {
  return (
    <>
      <PageHero
        eyebrow="What We Do"
        title="Supporting Farmers Across the Entire Agricultural Value Chain"
        description="FFFCSL promotes both wet-season and irrigation farming to increase annual agricultural output, improve farmer income, reduce seasonal production gaps, and strengthen resilience."
      />

      <section className="py-16 sm:py-20">
        <Container>
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHAT_WE_DO.map((item) => (
              <Reveal key={item.title} className="rounded-2xl border border-line bg-white p-7">
                <item.icon size={24} className="text-forest" />
                <h3 className="mt-4 text-base font-semibold text-forest-dark">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {item.description}
                </p>
              </Reveal>
            ))}
          </RevealGroup>
        </Container>
      </section>

      <section className="border-t border-line bg-cream-soft py-16 sm:py-20">
        <Container>
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-terracotta">
              Strategic Focus Areas
            </p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl font-semibold text-forest-dark">
              Where We Concentrate Our Effort
            </h2>
          </Reveal>
          <RevealGroup className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STRATEGIC_FOCUS_AREAS.map((area) => (
              <Reveal
                key={area.title}
                className="rounded-2xl border border-line bg-white p-6"
              >
                <h3 className="text-sm font-semibold text-forest-dark">
                  {area.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {area.description}
                </p>
              </Reveal>
            ))}
          </RevealGroup>
        </Container>
      </section>
    </>
  );
}
