import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal, RevealGroup } from "@/components/ui/reveal";
import { StructureDiagram } from "@/components/structure-diagram";
import { CORE_OBJECTIVES } from "@/lib/content";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Who FFFCSL is, our national structure, mandate, mission, vision, and core objectives.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About FFFCSL"
        title="A Nationally Recognized Apex Farmers' Cooperative"
        description="Duly registered under the Federal Department of Cooperatives, Federal Ministry of Agriculture and Food Security, Nigeria."
      />

      <section className="py-16 sm:py-20">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <h2 className="font-serif text-2xl font-semibold text-forest-dark">
              Who We Are
            </h2>
            <div className="mt-5 space-y-4 text-ink-soft leading-relaxed">
              <p>
                The Federation of Fadama Farmers Cooperative Society Limited
                (FFFCSL) was established to organize, represent, support, and
                empower farmers through a coordinated cooperative structure
                capable of connecting grassroots agricultural producers with
                opportunities in agricultural production, mechanisation,
                irrigation, finance, markets, technology, extension services,
                capacity development, and sustainable agricultural investment.
              </p>
              <p>
                FFFCSL serves as a platform through which farmers can
                collectively address major challenges affecting agricultural
                productivity and rural livelihoods. Rather than farmers
                operating individually and in isolation, the Federation
                promotes organized agricultural production through cooperative
                societies, farmer groups, clusters, and structured programmes.
              </p>
              <p>
                Our approach places the farmer at the centre of agricultural
                development. We believe that strengthening farmers with the
                right knowledge, inputs, equipment, technology, finance,
                infrastructure, market opportunities, and institutional
                support can significantly increase agricultural productivity,
                improve livelihoods, strengthen rural economies, and
                contribute to sustainable national food security.
              </p>
            </div>
          </Reveal>

          <Reveal className="rounded-2xl border border-line bg-cream-soft p-7">
            <h3 className="font-serif text-lg font-semibold text-forest-dark">
              Our Mandate
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              To organize and empower farmers for sustainable agricultural
              production and economic development &mdash; creating an enabling
              environment in which farmers can improve productivity, access
              agricultural opportunities, adopt modern farming practices,
              participate in structured markets, and develop sustainable
              agricultural enterprises.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="border-y border-line bg-cream-soft py-16 sm:py-20">
        <Container>
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-terracotta">
              Our National Structure
            </p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl font-semibold text-forest-dark">
              National Headquarters to Individual Farmers
            </h2>
            <p className="mt-4 max-w-2xl text-ink-soft">
              The Federation&apos;s structure covers the 36 States of the
              Federation and the Federal Capital Territory (FCT), with
              organizational structures extending through State, LGA,
              community, and farmer cluster levels &mdash; enabling farmer
              mobilization, beneficiary identification, extension, data
              collection, field monitoring, and market linkage.
            </p>
          </Reveal>
          <div className="mt-12">
            <StructureDiagram />
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Reveal className="rounded-2xl border border-line bg-white p-8">
            <h3 className="font-serif text-xl font-semibold text-forest-dark">
              Our Mission
            </h3>
            <p className="mt-4 leading-relaxed text-ink-soft">
              To empower farmers across Nigeria with knowledge, resources,
              technology, institutional support, and market access required to
              achieve sustainable agricultural growth, increased productivity,
              food security, and improved livelihoods.
            </p>
          </Reveal>
          <Reveal delay={0.08} className="rounded-2xl border border-line bg-white p-8">
            <h3 className="font-serif text-xl font-semibold text-forest-dark">
              Our Vision
            </h3>
            <p className="mt-4 leading-relaxed text-ink-soft">
              To be the leading farmers&apos; cooperative in Nigeria, recognized
              for driving agricultural transformation, promoting sustainable
              rural development, advancing modern farming practices, and
              positioning Nigerian farmers as competitive participants in
              local and global agricultural markets.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="border-t border-line bg-cream-soft py-16 sm:py-20">
        <Container>
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-terracotta">
              Our Core Objectives
            </p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl font-semibold text-forest-dark">
              What We&apos;re Working to Achieve
            </h2>
          </Reveal>
          <RevealGroup className="mt-10 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {CORE_OBJECTIVES.map((obj) => (
              <Reveal key={obj} className="flex items-start gap-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-forest" />
                <p className="text-sm leading-relaxed text-ink-soft">{obj}</p>
              </Reveal>
            ))}
          </RevealGroup>
        </Container>
      </section>
    </>
  );
}
