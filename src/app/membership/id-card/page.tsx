import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/ui/page-hero";
import { IdCardWizard } from "@/components/registration/id-card-wizard";

export const metadata: Metadata = {
  title: "ID Card Registration",
  description: "Continue with your pre-registration token to pay the ID card fee, verify your identity, and get your official FFFCSL membership ID.",
};

export default function IdCardPage() {
  return (
    <>
      <PageHero
        eyebrow="ID Card Registration"
        title="Complete Your FFFCSL ID Card"
        description="Enter your pre-registration token, pay the ₦2,500 ID card fee, verify your identity, and get your official membership ID."
      />
      <Suspense fallback={null}>
        <IdCardWizard />
      </Suspense>
    </>
  );
}
