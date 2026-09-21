"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { NG_STATES } from "@/lib/ng-locations";

type FarmerRow = {
  member_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  state: string;
  lga: string;
  community: string;
  verification_status: string;
  photo: string;
  created_at: string;
  paid: boolean;
};

type Summary = {
  total: number;
  verified: number;
  pending_verification: number;
  mismatch: number;
  paid: number;
};

const PAGE_SIZE = 25;

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    verified: "bg-forest/10 text-forest-dark",
    pending: "bg-amber/15 text-walnut-dark",
    mismatch: "bg-terracotta/15 text-terracotta-dark",
  };
  return styles[status] ?? "bg-cream-soft text-ink-soft";
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [farmers, setFarmers] = useState<FarmerRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (q.trim()) params.set("q", q.trim());
      if (state) params.set("state", state);
      if (status) params.set("status", status);

      const res = await fetch(`/api/admin/farmers?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Could not load farmers.");
        return;
      }
      setFarmers(data.farmers);
      setSummary(data.summary);
      setTotal(data.total);
    } catch {
      setError("Could not load farmers.");
    } finally {
      setLoading(false);
    }
  }, [page, q, state, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  function exportHref() {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (state) params.set("state", state);
    if (status) params.set("status", status);
    const qs = params.toString();
    return `/api/admin/export${qs ? `?${qs}` : ""}`;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="py-10 sm:py-14">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-ink">Farmer Records</h1>
            <p className="mt-1 text-sm text-ink-soft">All registered members, from token issuance to ID card.</p>
          </div>
          <div className="flex gap-2">
            <a
              href={exportHref()}
              className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-forest"
            >
              Export CSV
            </a>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-terracotta hover:text-terracotta-dark"
            >
              Log Out
            </button>
          </div>
        </div>

        {summary ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "Total", value: summary.total },
              { label: "Verified", value: summary.verified },
              { label: "Pending KYC", value: summary.pending_verification },
              { label: "Mismatch", value: summary.mismatch },
              { label: "Paid", value: summary.paid },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-line bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{card.label}</p>
                <p className="mt-1 font-serif text-2xl font-semibold text-ink">{card.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="Search name, phone, member ID, NIN, BVN…"
            className="min-w-[240px] flex-1 rounded-lg border border-line bg-white px-4 py-2 text-sm text-ink outline-none focus:border-forest"
          />
          <select
            value={state}
            onChange={(e) => {
              setPage(1);
              setState(e.target.value);
            }}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-forest"
          >
            <option value="">All States</option>
            {NG_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-forest"
          >
            <option value="">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="mismatch">Mismatch</option>
          </select>
        </div>

        {error ? <p className="mt-4 text-sm text-terracotta-dark">{error}</p> : null}

        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-line bg-cream-soft text-xs font-semibold uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Member ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">KYC</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-ink-soft">
                    Loading…
                  </td>
                </tr>
              ) : farmers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-ink-soft">
                    No farmers match this filter.
                  </td>
                </tr>
              ) : (
                farmers.map((f) => (
                  <tr key={f.member_id} className="hover:bg-cream-soft/60">
                    <td className="px-4 py-2.5">
                      {f.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/photo/${encodeURIComponent(f.member_id)}`}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-soft text-xs text-ink-soft">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">
                      <Link
                        href={`/admin/farmers/${encodeURIComponent(f.member_id)}`}
                        className="text-forest-dark hover:underline"
                      >
                        {f.member_id}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      {f.first_name} {f.last_name}
                    </td>
                    <td className="px-4 py-2.5">{f.phone}</td>
                    <td className="px-4 py-2.5">
                      {[f.community, f.lga, f.state].filter(Boolean).join(", ")}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(f.verification_status)}`}>
                        {f.verification_status || "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          f.paid ? "bg-forest/10 text-forest-dark" : "bg-cream-soft text-ink-soft"
                        }`}
                      >
                        {f.paid ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-ink-soft">
                      {new Date(f.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-ink-soft">
          <p>
            Page {page} of {totalPages} &middot; {total} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-line bg-white px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-line bg-white px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
