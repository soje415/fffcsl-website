import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal, RevealGroup } from "@/components/ui/reveal";
import { DEPARTMENTS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Departments",
  description: "The six functional departments that run FFFCSL nationally.",
};

export default function DepartmentsPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Structure"
        title="Six Functional Departments"
        description="Each department carries a distinct institutional responsibility, working together to deliver FFFCSL's national mandate."
      />

      <section className="py-16 sm:py-20">
        <Container>
          <RevealGroup className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {DEPARTMENTS.map((dept, i) => (
              <Reveal
                key={dept.title}
                className="flex gap-5 rounded-2xl border border-line bg-white p-7"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream-soft font-serif text-lg font-semibold text-terracotta">
                  {i + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <dept.icon size={18} className="text-forest" />
                    <h3 className="text-base font-semibold text-forest-dark">
                      {dept.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {dept.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </RevealGroup>
        </Container>
      </section>
    </>
  );
}
