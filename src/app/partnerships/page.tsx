import type { Metadata } from "next";
import {
  Landmark,
  FlaskConical,
  Banknote,
  Building2,
  Cpu,
  Truck,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal, RevealGroup } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Partnerships",
  description:
    "FFFCSL's approach to partnership and collaboration with government, financial institutions, research bodies, and the private sector.",
};

const PARTNER_TYPES = [
  { icon: Landmark, label: "Federal & State Government Institutions" },
  { icon: Building2, label: "Agricultural Agencies" },
  { icon: Banknote, label: "Financial Institutions" },
  { icon: FlaskConical, label: "Research & Academic Institutions" },
  { icon: Cpu, label: "Agricultural Technology Companies" },
  { icon: Truck, label: "Input Suppliers, Processors & Off-takers" },
];

export default function PartnershipsPage() {
  return (
    <>
      <PageHero
        eyebrow="Partnership & Collaboration"
        title="Building Productive Relationships Across the Agricultural Sector"
        description="FFFCSL recognizes that sustainable agricultural transformation requires collaboration. Partnerships are pursued to deliver measurable benefits to farmers and strengthen agricultural value chains."
      />

      <section className="py-16 sm:py-20">
        <Container>
          <RevealGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PARTNER_TYPES.map((p) => (
              <Reveal
                key={p.label}
                className="flex items-center gap-4 rounded-2xl border border-line bg-white p-6"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream-soft">
                  <p.icon size={20} className="text-forest" />
                </div>
                <p className="text-sm font-medium text-forest-dark">{p.label}</p>
              </Reveal>
            ))}
          </RevealGroup>
        </Container>
      </section>

      <section className="border-t border-line bg-cream-soft py-16 sm:py-20">
        <Container className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Reveal className="rounded-2xl border border-line bg-white p-8">
            <h3 className="font-serif text-lg font-semibold text-forest-dark">
              Transparency & Accountability
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              FFFCSL is committed to promoting responsible cooperative
              governance, transparency, accountability, proper documentation,
              and effective programme monitoring &mdash; with growing emphasis on
              reliable farmer data, transparent beneficiary records, and
              appropriate controls over access to information as our digital
              systems expand.
            </p>
          </Reveal>
          <Reveal delay={0.08} className="rounded-2xl border border-line bg-white p-8">
            <h3 className="font-serif text-lg font-semibold text-forest-dark">
              Contribution to Food Security
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              By organizing farmers, increasing access to inputs and
              mechanisation, promoting irrigation, strengthening extension
              services, and encouraging year-round production, FFFCSL seeks
              to contribute to increased agricultural output across Nigeria.
            </p>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
