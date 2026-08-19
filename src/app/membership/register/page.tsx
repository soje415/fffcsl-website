import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { RegistrationWizard } from "@/components/registration/registration-wizard";

export const metadata: Metadata = {
  title: "Register",
  description: "Register as an FFFCSL farmer and get your official membership ID.",
};

export default function RegisterPage() {
  return (
    <>
      <PageHero
        eyebrow="Membership Registration"
        title="Register as an FFFCSL Farmer"
        description="Verify your identity with your BVN or NIN, fill in your details, pay the ₦3,000 ID card fee, and get your official membership ID."
      />
      <RegistrationWizard />
    </>
  );
}
