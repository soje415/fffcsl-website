import type { Metadata } from "next";
import { VerifyResult } from "@/components/verify-result";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ memberId: string }>;
}): Promise<Metadata> {
  const { memberId } = await params;
  return {
    title: `Verify ${decodeURIComponent(memberId)}`,
    description: "Confirm the authenticity of an FFFCSL membership ID card.",
  };
}

export default async function VerifyMemberPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  return <VerifyResult memberId={decodeURIComponent(memberId)} />;
}
