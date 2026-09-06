import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardList,
  ShieldCheck,
  Wallet,
  IdCard,
  FlaskConical,
  ArrowRight,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal, RevealGroup } from "@/components/ui/reveal";
import { isDemoMode } from "@/lib/demo-mode";

export const metadata: Metadata = {
  title: "Become a Member",
  description:
    "Pre-register with FFFCSL to get your token, then pay the ID card fee, verify your identity, and receive your official membership ID.",
};

const STEPS = [
  {
    icon: ClipboardList,
    title: "1. Pre-Register",
    description:
      "Give us your name and phone number and we'll issue you a token — no identity verification needed yet.",
  },
  {
    icon: Wallet,
    title: "2. Pay the ID Card Fee",
    description:
      "Bring your token back to ID Card Registration and pay a one-time ₦2,000 processing fee by bank transfer, USSD, or OPay.",
  },
  {
    icon: ShieldCheck,
    title: "3. Verify Your Identity",
    description:
      "Once payment is confirmed, your BVN or NIN is verified automatically to confirm your identity and protect the integrity of the Federation's membership records.",
  },
  {
    icon: IdCard,
    title: "4. Get Your Membership ID",
    description:
      "Finish your personal, farm, and next-of-kin details and your official membership ID card is ready to view, download, and print.",
  },
];

export default function MembershipPage() {
  return (
    <>
      <PageHero
        eyebrow="Become a Member"
        title="Join FFFCSL as a Registered Farmer"
        description="Pre-register to get your token, then use it to complete payment, identity verification, and your official FFFCSL membership ID card."
      />

      <section className="py-16 sm:py-20">
        <Container>
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <Reveal key={step.title} className="rounded-2xl border border-line bg-white p-7">
                <step.icon size={24} className="text-forest" />
                <h3 className="mt-4 text-base font-semibold text-forest-dark">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {step.description}
                </p>
              </Reveal>
            ))}
          </RevealGroup>
        </Container>
      </section>

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
              Complete the four steps above to get your official FFFCSL
              membership ID.
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
                  <strong>Demo mode:</strong> payment, phone, and BVN/NIN
                  verification are simulated for this walkthrough — no real
                  transfer, SMS, or identity lookup happens.
                </p>
              </div>
            )}
          </Reveal>
        </Container>
      </section>
    </>
  );
}
