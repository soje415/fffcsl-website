import Link from "next/link";
import { ArrowRight, ShieldCheck, MapPinned, Users2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup } from "@/components/ui/reveal";
import { Counter } from "@/components/ui/counter";
import { StructureDiagram } from "@/components/structure-diagram";
import { WHAT_WE_DO, DEPARTMENTS } from "@/lib/content";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_85%_0%,rgba(217,131,36,0.14),transparent),radial-gradient(50%_40%_at_0%_100%,rgba(30,86,49,0.12),transparent)]"
        />
        <Container className="py-20 sm:py-28">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-forest-dark">
              <ShieldCheck size={14} className="text-forest" />
              Registered under the Federal Department of Cooperatives, Nigeria
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-6 max-w-3xl font-serif text-4xl font-semibold leading-[1.1] text-forest-dark sm:text-5xl lg:text-6xl">
              Organizing and Empowering Nigeria&apos;s Farmers, Nationwide.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
              The Federation of Fadama Farmers Cooperative Society Limited
              (FFFCSL) is a nationally recognized apex farmers&apos; cooperative
              connecting grassroots agricultural producers with production,
              mechanisation, irrigation, finance, markets, and technology &mdash;
              across all 36 states and the FCT.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/membership"
                className="group inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3.5 text-sm font-semibold text-cream shadow-sm shadow-forest/25 transition-colors hover:bg-forest-dark"
              >
                Become a Member
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-3.5 text-sm font-semibold text-forest-dark transition-colors hover:border-forest/40"
              >
                Learn About FFFCSL
              </Link>
            </div>
          </Reveal>
        </Container>

        {/* Stat strip */}
        <div className="border-t border-line bg-cream-soft">
          <Container className="grid grid-cols-2 gap-8 py-10 sm:grid-cols-4">
            {[
              { icon: MapPinned, value: 36, suffix: "", label: "States Covered" },
              { icon: Users2, value: 1, suffix: "", label: "National Federation" },
              { icon: ShieldCheck, value: 6, suffix: "", label: "Functional Departments" },
              { icon: MapPinned, value: 5, suffix: "", label: "Structural Levels to Farmer" },
            ].map((s) => (
              <Reveal key={s.label}>
                <div>
                  <Counter
                    value={s.value}
                    suffix={s.suffix || (s.value === 36 ? " + FCT" : "")}
                    className="font-serif text-3xl font-semibold text-forest-dark sm:text-4xl"
                  />
                  <p className="mt-1 text-sm text-ink-soft">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </Container>
        </div>
      </section>

      {/* National structure */}
      <section className="py-20 sm:py-24">
        <Container>
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-terracotta">
              Our National Structure
            </p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl font-semibold text-forest-dark sm:text-4xl">
              From National Headquarters to Every Individual Farmer
            </h2>
            <p className="mt-4 max-w-2xl text-ink-soft">
              A nationwide framework connecting national coordination with
              farmers at the grassroots &mdash; enabling farmer mobilization,
              programme implementation, field monitoring, and market linkage.
            </p>
          </Reveal>
          <div className="mt-12">
            <StructureDiagram />
          </div>
        </Container>
      </section>

      {/* What we do */}
      <section className="border-y border-line bg-cream-soft py-20 sm:py-24">
        <Container>
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-terracotta">
                  What We Do
                </p>
                <h2 className="mt-3 max-w-xl font-serif text-3xl font-semibold text-forest-dark sm:text-4xl">
                  A Coordinated Cooperative Structure for Agricultural Development
                </h2>
              </div>
              <Link
                href="/what-we-do"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-dark hover:text-forest"
              >
                See everything we do
                <ArrowRight size={15} />
              </Link>
            </div>
          </Reveal>

          <RevealGroup className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHAT_WE_DO.slice(0, 8).map((item) => (
              <Reveal key={item.title} className="rounded-2xl border border-line bg-white p-6">
                <item.icon size={22} className="text-forest" />
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

      {/* Departments */}
      <section className="py-20 sm:py-24">
        <Container>
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-terracotta">
                  Our Structure
                </p>
                <h2 className="mt-3 max-w-xl font-serif text-3xl font-semibold text-forest-dark sm:text-4xl">
                  Six Functional Departments
                </h2>
              </div>
              <Link
                href="/departments"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-dark hover:text-forest"
              >
                View all departments
                <ArrowRight size={15} />
              </Link>
            </div>
          </Reveal>

          <RevealGroup className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DEPARTMENTS.map((dept) => (
              <Reveal key={dept.title} className="rounded-2xl border border-line bg-white p-6">
                <dept.icon size={22} className="text-terracotta" />
                <h3 className="mt-4 text-base font-semibold text-forest-dark">
                  {dept.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {dept.description}
                </p>
              </Reveal>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* CTA band */}
      <section className="bg-forest-dark py-20 text-cream">
        <Container className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <Reveal className="max-w-xl">
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
              Ready to Register as an FFFCSL Farmer?
            </h2>
            <p className="mt-4 text-cream/75">
              Pre-register to get your token, then complete ID card
              registration, verify your identity, and get your official
              FFFCSL membership ID &mdash; issued after a one-time
              &#8358;2,000 processing payment.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <Link
              href="/membership"
              className="inline-flex items-center gap-2 rounded-full bg-amber px-7 py-3.5 text-sm font-semibold text-ink shadow-sm transition-colors hover:brightness-95"
            >
              Start Registration
              <ArrowRight size={16} />
            </Link>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
