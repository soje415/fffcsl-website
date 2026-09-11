import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { PreRegisterForm } from "@/components/registration/pre-register-form";

export const metadata: Metadata = {
  title: "Register",
  description:
    "Register with FFFCSL — personal, farm, and next-of-kin details — to get your token, then continue to ID card registration.",
};

export default function PreRegisterPage() {
  return (
    <>
      <PageHero
        eyebrow="Membership Registration"
        title="Register as an FFFCSL Farmer"
        description="Fill in your personal details, farm information, and next of kin to get your token. You'll use it to come back, pay the ₦2,000 ID card fee, and verify your identity."
      />
      <PreRegisterForm />
    </>
  );
}
