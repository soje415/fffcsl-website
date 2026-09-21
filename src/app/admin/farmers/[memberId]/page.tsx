"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";

type Farmer = Record<string, string | number | null>;
type Payment = {
  customer_id: string;
  amount_kobo: number;
  status: string;
  account_number: string;
  bank_name: string;
  paid_at: string | null;
  created_at: string;
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{value || "—"}</p>
    </div>
  );
}

export default function AdminFarmerDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = use(params);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [crops, setCrops] = useState<string[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/farmers/${encodeURIComponent(memberId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setError(data.error ?? "Farmer not found.");
          return;
        }
        setFarmer(data.farmer);
        setCrops(data.crops ?? []);
        setPayments(data.payments ?? []);
      })
      .catch(() => setError("Could not load this farmer."));
  }, [memberId]);

  if (error) {
    return (
      <Container className="py-16">
        <p className="text-terracotta-dark">{error}</p>
        <Link href="/admin" className="mt-4 inline-block text-sm text-forest-dark hover:underline">
          &larr; Back to all farmers
        </Link>
      </Container>
    );
  }

  if (!farmer) {
    return (
      <Container className="py-16">
        <p className="text-ink-soft">Loading…</p>
      </Container>
    );
  }

  return (
    <section className="py-10 sm:py-14">
      <Container>
        <Link href="/admin" className="text-sm text-forest-dark hover:underline">
          &larr; Back to all farmers
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          {farmer.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/photo/${encodeURIComponent(memberId)}`}
              alt=""
              className="h-20 w-20 rounded-xl object-cover ring-1 ring-line"
            />
          ) : null}
          <div>
            <h1 className="font-serif text-2xl font-semibold text-ink">
              {farmer.first_name} {farmer.last_name}
            </h1>
            <p className="font-mono text-sm text-ink-soft">{farmer.member_id}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="rounded-xl border border-line bg-white p-6 lg:col-span-2">
            <h2 className="font-serif text-lg font-semibold text-ink">Personal</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Other Names" value={farmer.other_names} />
              <Field label="Date of Birth" value={farmer.dob} />
              <Field label="Gender" value={farmer.gender} />
              <Field label="Marital Status" value={farmer.marital_status} />
              <Field label="Phone" value={farmer.phone} />
              <Field label="Email" value={farmer.email} />
              <Field label="NIN" value={farmer.nin} />
              <Field label="BVN" value={farmer.bvn} />
            </div>

            <h2 className="mt-8 font-serif text-lg font-semibold text-ink">Location & Farm</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Residential Address" value={farmer.residential_address} />
              <Field label="State" value={farmer.state} />
              <Field label="LGA" value={farmer.lga} />
              <Field label="Community" value={farmer.community} />
              <Field label="Cluster" value={farmer.cluster} />
              <Field label="Farm Size (hectares)" value={farmer.farm_size_hectares} />
              <Field label="Years Farming" value={farmer.years_farming} />
              <Field label="Crops" value={crops.join(", ")} />
            </div>

            <h2 className="mt-8 font-serif text-lg font-semibold text-ink">Next of Kin</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name" value={farmer.nok_name} />
              <Field label="Relationship" value={farmer.nok_relationship} />
              <Field label="Phone" value={farmer.nok_phone} />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-line bg-white p-6">
              <h2 className="font-serif text-lg font-semibold text-ink">Status</h2>
              <div className="mt-4 flex flex-col gap-4">
                <Field label="KYC Type" value={farmer.kyc_type} />
                <Field label="Verification Status" value={farmer.verification_status} />
                <Field label="Registered" value={new Date(String(farmer.created_at)).toLocaleString()} />
              </div>
            </div>

            <div className="rounded-xl border border-line bg-white p-6">
              <h2 className="font-serif text-lg font-semibold text-ink">Payment</h2>
              <div className="mt-4 flex flex-col gap-4">
                <Field label="Virtual Account" value={farmer.virtual_account_number} />
                <Field label="Bank" value={farmer.virtual_account_bank} />
                <Field label="Method" value={farmer.payment_method} />
                {payments.length > 0 ? (
                  <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
                    {payments.map((p) => (
                      <div key={p.customer_id} className="text-sm">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.status === "paid" ? "bg-forest/10 text-forest-dark" : "bg-cream-soft text-ink-soft"
                          }`}
                        >
                          {p.status}
                        </span>{" "}
                        &#8358;{(p.amount_kobo / 100).toLocaleString()} &mdash; {p.bank_name || "—"}{" "}
                        {p.paid_at ? `(${new Date(p.paid_at).toLocaleDateString()})` : ""}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
