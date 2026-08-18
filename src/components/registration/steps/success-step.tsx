"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PartyPopper, Printer, UserPlus } from "lucide-react";
import { IdCard } from "@/components/id-card";
import { useLanguage } from "@/components/registration/language";
import { otpProvider } from "@/lib/providers/otp-provider";
import { submitRegistration } from "@/lib/providers/registration-provider";
import type { RegistrationData } from "@/types/registration";

export function SuccessStep({
  data,
  update,
  onStartNew,
}: {
  data: RegistrationData;
  update: (patch: Partial<RegistrationData>) => void;
  onStartNew: () => void;
}) {
  const { lang } = useLanguage();
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;

    // Persist the completed registration (idempotent on member_id).
    submitRegistration(data).catch(() => {
      /* do not block the success screen if persistence fails */
    });

    // Fire the welcome SMS once.
    if (data.welcomeSmsSent || !data.phone) return;
    const message =
      lang === "ha"
        ? `Barka ${data.firstName}, rajistar FFFCSL ɗinka ta cika. ID na memba: ${data.memberId}. Ka kiyaye wannan ID.`
        : `Congratulations ${data.firstName}, your FFFCSL registration is complete. Member ID: ${data.memberId}. Keep this ID safe.`;
    otpProvider
      .sendSms(data.phone, message)
      .then(() => update({ welcomeSmsSent: true }))
      .catch(() => {
        /* do not block the success screen if SMS fails */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forest/10 text-forest">
        <PartyPopper size={26} />
      </div>
      <h2 className="mt-4 font-serif text-2xl font-semibold text-forest-dark">
        {lang === "ha" ? `Barka da zuwa FFFCSL, ${data.firstName}` : `Welcome to FFFCSL, ${data.firstName}`}
      </h2>
      <p className="mt-2 max-w-md text-sm text-ink-soft">
        {lang === "ha"
          ? "Zama memba ɗinka ya kunna kuma katin shaida ɗinka a shirye. Kana iya buga shi yanzu ko dawo daga tashar memba a kowane lokaci."
          : "Your membership is active and your official ID card is ready. You can print it now or return anytime from your member portal."}
      </p>

      <div className="mt-8">
        <IdCard data={data} />
      </div>

      <div className="no-print mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-forest-dark"
        >
          <Printer size={16} />
          {lang === "ha" ? "Buga / Ajiye PDF" : "Print / Save as PDF"}
        </button>
        <button
          type="button"
          onClick={onStartNew}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-forest-dark transition-colors hover:border-forest/40"
        >
          <UserPlus size={16} />
          {lang === "ha" ? "Rijistar Wani Manomi" : "Register Another Farmer"}
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-ink-soft transition-colors hover:text-forest-dark"
        >
          {lang === "ha" ? "Koma Shafin Farko" : "Return to Homepage"}
        </Link>
      </div>
    </motion.div>
  );
}
