import type { Metadata } from "next";
import { QrCode } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Verify a Member ID",
  description: "Confirm the authenticity of an FFFCSL membership ID card.",
};

export default function VerifyPage() {
  return (
    <>
      <PageHero
        eyebrow="Verify a Member"
        title="Confirm an FFFCSL Membership ID"
        description="Scan the QR code on a membership card, or enter the Member ID below, to confirm it is genuine."
      />
      <section className="py-16 sm:py-20">
        <Container className="max-w-md">
          <Reveal className="rounded-2xl border border-line bg-white p-8 text-center">
            <QrCode size={32} className="mx-auto text-forest" />
            <form className="mt-6 flex flex-col gap-3">
              <input
                disabled
                placeholder="e.g. FFFCSL/LA/000123"
                className="w-full rounded-full border border-line bg-cream-soft px-4 py-2.5 text-center text-sm text-ink-soft outline-none"
              />
              <button
                disabled
                className="rounded-full bg-forest/40 px-6 py-2.5 text-sm font-semibold text-cream"
              >
                Verify Member
              </button>
            </form>
            <p className="mt-5 text-sm text-ink-soft">
              Member verification will be available once the registration
              portal launches.
            </p>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
