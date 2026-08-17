"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PartyPopper, Printer, UserPlus } from "lucide-react";
import { IdCard } from "@/components/id-card";
import type { RegistrationData } from "@/types/registration";

export function SuccessStep({
  data,
  onStartNew,
}: {
  data: RegistrationData;
  onStartNew: () => void;
}) {
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
        Welcome to FFFCSL, {data.firstName}
      </h2>
      <p className="mt-2 max-w-md text-sm text-ink-soft">
        Your membership is active and your official ID card is ready. You can
        print it now or return anytime from your member portal.
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
          Print / Save as PDF
        </button>
        <button
          type="button"
          onClick={onStartNew}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-forest-dark transition-colors hover:border-forest/40"
        >
          <UserPlus size={16} />
          Register Another Farmer
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-ink-soft transition-colors hover:text-forest-dark"
        >
          Return to Homepage
        </Link>
      </div>
    </motion.div>
  );
}
