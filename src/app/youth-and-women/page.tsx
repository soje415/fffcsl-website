import type { Metadata } from "next";
import { Sprout, Tractor, Factory, LineChart, GraduationCap, Briefcase } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal, RevealGroup } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Youth & Women in Agriculture",
  description:
    "FFFCSL's commitment to meaningful participation of young people and women across agriculture and agribusiness.",
};

const OPPORTUNITIES = [
  { icon: Sprout, label: "Crop Production" },
  { icon: Tractor, label: "Mechanisation" },
  { icon: Factory, label: "Processing" },
  { icon: LineChart, label: "Aggregation & Marketing" },
  { icon: GraduationCap, label: "Agricultural Technology & Extension" },
  { icon: Briefcase, label: "Agribusiness Entrepreneurship" },
];

export default function YouthAndWomenPage() {
  return (
    <>
      <PageHero
        eyebrow="Youth & Women in Agriculture"
        title="Making Agriculture an Attractive Livelihood for the Next Generation"
        description="FFFCSL recognizes that Nigeria's long-term agricultural development depends significantly on the participation of young people and women."
      />

      <section className="py-16 sm:py-20">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <p className="leading-relaxed text-ink-soft">
              The Federation promotes opportunities across crop production,
              livestock, mechanisation, processing, aggregation, marketing,
              agricultural technology, extension services, and agribusiness
              entrepreneurship for young people and women.
            </p>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Our objective is to help make agriculture a productive and
              economically attractive livelihood and business opportunity for
              the next generation &mdash; strengthening rural economies and
              broadening participation beyond traditional roles.
            </p>
          </Reveal>

          <Reveal className="rounded-2xl border border-line bg-cream-soft p-7">
            <h3 className="font-serif text-lg font-semibold text-forest-dark">
              Why It Matters
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Increasing meaningful participation of youth and women in
              agriculture is one of FFFCSL&apos;s core objectives &mdash; central
              to building a resilient, productive, and inclusive agricultural
              system for Nigeria.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="border-t border-line bg-cream-soft py-16 sm:py-20">
        <Container>
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-terracotta">
              Areas of Opportunity
            </p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl font-semibold text-forest-dark">
              Where Youth & Women Can Participate
            </h2>
          </Reveal>
          <RevealGroup className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3">
            {OPPORTUNITIES.map((o) => (
              <Reveal
                key={o.label}
                className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white p-6 text-center"
              >
                <o.icon size={24} className="text-forest" />
                <p className="text-sm font-medium text-forest-dark">{o.label}</p>
              </Reveal>
            ))}
          </RevealGroup>
        </Container>
      </section>
    </>
  );
}
