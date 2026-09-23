"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { IdCardFront } from "@/components/id-card";
import { EMPTY_REGISTRATION, type RegistrationData } from "@/types/registration";

type Member = {
  memberId: string;
  firstName: string;
  lastName: string;
  state: string;
  lga: string;
  crops: string[];
  hasPhoto: boolean;
  memberSince: number;
  validTill: string;
};

type Status = "loading" | "found" | "not-found" | "error";

export function VerifyResult({ memberId }: { memberId: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [member, setMember] = useState<Member | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Reset so a stale result doesn't flash if memberId changes without a remount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("loading");
    setMember(null);

    fetch(`/api/verify/${encodeURIComponent(memberId)}`)
      .then(async (res) => {
        const body = (await res.json()) as { success: boolean; member?: Member };
        if (cancelled) return;
        if (res.ok && body.success && body.member) {
          setMember(body.member);
          setStatus("found");
        } else if (res.status === 404) {
          setStatus("not-found");
        } else {
          setStatus("error");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const cardData: RegistrationData | null = member
    ? {
        ...EMPTY_REGISTRATION,
        memberId: member.memberId,
        firstName: member.firstName,
        lastName: member.lastName,
        state: member.state,
        lga: member.lga,
        crops: member.crops,
        photoDataUrl: member.hasPhoto ? `/api/photo/${encodeURIComponent(member.memberId)}` : "",
      }
    : null;

  return (
    <>
      <PageHero
        eyebrow="Verify a Member"
        title="Confirm an FFFCSL Membership ID"
        description={`Checking Member ID ${memberId}`}
      />
      <section className="py-16 sm:py-20">
        <Container className="max-w-md">
          <div className="rounded-2xl border border-line bg-white p-8 text-center">
            {status === "loading" && (
              <div className="flex flex-col items-center gap-3 py-8 text-ink-soft">
                <Loader2 size={28} className="animate-spin text-forest" />
                <p className="text-sm">Checking this member ID…</p>
              </div>
            )}

            {status === "found" && cardData && (
              <div className="flex flex-col items-center gap-5">
                <div className="flex items-center gap-2 rounded-full bg-forest/10 px-4 py-2 text-sm font-semibold text-forest-dark">
                  <ShieldCheck size={18} />
                  Verified FFFCSL Member
                </div>
                <IdCardFront
                  data={cardData}
                  expires={member ? new Date(member.validTill) : undefined}
                />
              </div>
            )}

            {status === "not-found" && (
              <div className="flex flex-col items-center gap-3 py-4 text-terracotta-dark">
                <ShieldX size={28} />
                <p className="font-semibold">Not a Valid FFFCSL Member ID</p>
                <p className="text-sm text-ink-soft">
                  We couldn&rsquo;t find a member with the ID &ldquo;{memberId}&rdquo;. Double-check
                  the card and try again.
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-3 py-4 text-terracotta-dark">
                <ShieldX size={28} />
                <p className="font-semibold">Could not verify right now</p>
                <p className="text-sm text-ink-soft">Please try again in a moment.</p>
              </div>
            )}

            <Link
              href="/verify"
              className="mt-6 inline-block text-sm font-medium text-forest-dark underline underline-offset-2"
            >
              Check another ID
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
