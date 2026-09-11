import type { Metadata } from "next";
import { PreRegisterForm } from "@/components/registration/pre-register-form";

export const metadata: Metadata = {
  title: "Register",
  description:
    "Register with FFFCSL — personal, farm, and next-of-kin details — to get your token, then continue to ID card registration.",
};

export default function PreRegisterPage() {
  return <PreRegisterForm />;
}
