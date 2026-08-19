import type { Metadata } from "next";
import { QrCode } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { VerifySearchForm } from "@/components/verify-search-form";

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
            <VerifySearchForm />
          </Reveal>
        </Container>
      </section>
    </>
  );
}
