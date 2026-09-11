import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { isDemoMode } from "@/lib/demo-mode";

export const metadata: Metadata = {
  title: "Become a Member",
  description:
    "Register with FFFCSL with your personal, farm, and next-of-kin details to get your token, then pay the ID card fee and verify your identity to receive your official membership ID.",
};

export default function MembershipPage() {
  return (
    <>
      <PageHero
        eyebrow="Become a Member"
        title="Join FFFCSL as a Registered Farmer"
        description="Register with your details to get your token, then use it to complete payment, identity verification, and your official FFFCSL membership ID card."
      />

      <section className="border-t border-line bg-cream-soft py-16 sm:py-20">
        <Container className="max-w-2xl">
          <Reveal className="rounded-2xl border border-line bg-white p-8 text-center sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-terracotta">
              Registration
            </p>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-forest-dark sm:text-3xl">
              Start Your Membership Application
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
              Register, pay the ID card fee, and verify your identity to get
              your official FFFCSL membership ID.
            </p>
            <Link
              href="/membership/register"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-forest px-7 py-3.5 text-sm font-semibold text-cream shadow-sm shadow-forest/25 transition-colors hover:bg-forest-dark"
            >
              Start Registration
              <ArrowRight size={16} />
            </Link>

            {isDemoMode() && (
              <div className="mx-auto mt-8 flex max-w-md items-start gap-2 rounded-xl border border-amber/40 bg-amber/10 p-4 text-left text-sm text-walnut-dark">
                <FlaskConical size={18} className="mt-0.5 shrink-0" />
                <p>
                  <strong>Demo mode:</strong> payment and BVN/NIN
                  verification are simulated for this walkthrough — no real
                  transfer or identity lookup happens.
                </p>
              </div>
            )}
          </Reveal>
        </Container>
      </section>
    </>
  );
}
