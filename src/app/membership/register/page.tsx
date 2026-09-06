import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { PreRegisterForm } from "@/components/registration/pre-register-form";

export const metadata: Metadata = {
  title: "Pre-Register",
  description: "Pre-register with FFFCSL to get your token, then continue to ID card registration.",
};

export default function PreRegisterPage() {
  return (
    <>
      <PageHero
        eyebrow="Membership Pre-Registration"
        title="Pre-Register as an FFFCSL Farmer"
        description="Give us your name and phone number to get a token. You'll use it to come back, pay the ₦2,000 ID card fee, and verify your identity."
      />
      <PreRegisterForm />
    </>
  );
}
