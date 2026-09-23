const DEFAULT_BASE_URL = "https://api.hyparrow.cloud/api/v1";

function config() {
  const apiKey = process.env.HYPARROW_API_KEY;
  const apiSecret = process.env.HYPARROW_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error(
      "Hyparrow credentials are not configured (set HYPARROW_API_KEY and HYPARROW_API_SECRET)."
    );
  }
  return {
    baseUrl: process.env.HYPARROW_BASE_URL ?? DEFAULT_BASE_URL,
    headers: {
      "X-API-Key": apiKey,
      "X-API-Secret": apiSecret,
      "Content-Type": "application/json",
    },
  };
}

export type HyparrowError = Error & { code?: string; status?: number };

async function request(path: string, body?: unknown, method: "GET" | "POST" = "POST") {
  const { baseUrl, headers } = config();
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload: Record<string, unknown> | null = null;
  try {
    payload = (await res.json()) as Record<string, unknown>;
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const err = new Error(
      (payload?.error as string) ?? (payload?.message as string) ?? `Hyparrow request failed (${res.status})`
    ) as HyparrowError;
    err.code = (payload?.code as string) ?? `HTTP_${res.status}`;
    err.status = res.status;
    throw err;
  }

  return payload as Record<string, unknown>;
}

export type IdentityRecord = {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  dateOfBirth?: string;
  gender?: string;
  photo?: string;
};

export type VerificationOutcome = {
  status: "verified" | "not_found";
  record?: IdentityRecord;
  reason?: string;
};

function asDataUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  if (value.startsWith("data:") || value.startsWith("http")) return value;
  return `data:image/jpeg;base64,${value}`;
}

function extractIdentity(payload: Record<string, unknown> | null): IdentityRecord | undefined {
  // Hyparrow forwards the verification network's envelope as `data`, with the
  // actual record nested one level deeper at `data.data` (see the KYC docs).
  const envelope = payload?.data as Record<string, unknown> | undefined;
  const record = (envelope?.data as Record<string, unknown> | undefined) ?? envelope;
  if (!record || typeof record !== "object") return undefined;
  return {
    firstName: record.firstName as string | undefined,
    lastName: record.lastName as string | undefined,
    middleName: record.middleName as string | undefined,
    dateOfBirth: record.dateOfBirth as string | undefined,
    gender: record.gender as string | undefined,
    photo: asDataUrl(record.photo ?? record.photograph ?? record.image ?? record.base64Image),
  };
}

/**
 * Looks up a BVN/NIN record via Hyparrow and returns whatever the registry
 * has on file — the caller uses this to auto-fill the registration form
 * rather than matching it against user-typed details.
 */
export async function verifyIdentity(input: {
  type: "bvn" | "nin";
  identifier: string;
}): Promise<VerificationOutcome> {
  const path = input.type === "bvn" ? "/kyc/identity/bvn/basic" : "/kyc/identity/nin";
  const body = input.type === "bvn" ? { bvn: input.identifier } : { nin: input.identifier };
  const payload = await request(path, body);
  // Field names only, never values: shows which registry fields Hyparrow
  // returns (e.g. whether a phone number is available for stronger checks).
  const envelope = payload?.data as Record<string, unknown> | undefined;
  const raw = (envelope?.data as Record<string, unknown> | undefined) ?? envelope;
  console.info("[kyc] registry response fields:", raw && typeof raw === "object" ? Object.keys(raw).join(",") : "none");
  const record = extractIdentity(payload);
  if (!record || !(record.firstName || record.lastName)) {
    return { status: "not_found", reason: "No identity record was returned for that number." };
  }
  return { status: "verified", record };
}

export type VirtualAccount = {
  accountNumber: string;
  accountName: string;
  bankName: string;
  customerId: string;
  reference: string;
};

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

/**
 * Hyparrow's customer list doesn't actually filter on query params, so we
 * pull the (small, per-client) list and match client-side. Each customer
 * record already carries its virtual-account details once one has been
 * issued, which lets the caller skip a redundant VA-creation call.
 */
async function findExistingCustomer(
  email: string,
  phoneNumber: string
): Promise<Record<string, unknown> | undefined> {
  const payload = await request("/customers?limit=500", undefined, "GET");
  const list = (payload?.data as Array<Record<string, unknown>>) ?? [];
  const wantEmail = email.trim().toLowerCase();
  const wantPhone = normalizePhone(phoneNumber);
  return list.find((c) => {
    const cEmail = String(c.email ?? "").trim().toLowerCase();
    const cPhone = normalizePhone(String(c.phoneNumber ?? ""));
    return (wantEmail && cEmail === wantEmail) || (wantPhone && cPhone === wantPhone);
  });
}

export async function createVirtualAccount(input: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: string;
  address?: string;
}): Promise<VirtualAccount> {
  let customerId: string | undefined;
  let existing: Record<string, unknown> | undefined;

  try {
    const customerPayload = await request("/customers", {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phoneNumber: input.phoneNumber,
      dateOfBirth: input.dateOfBirth || undefined,
      address: input.address || undefined,
    });
    const customer = (customerPayload?.data ?? {}) as Record<string, unknown>;
    customerId = customer.id as string | undefined;
  } catch (err) {
    const e = err as HyparrowError;
    // Hyparrow rejects creating a second customer for an email/phone it has
    // already seen — common on retries/re-registrations. Reuse that
    // customer (and their existing account, if any) instead of failing.
    if (e.status === 400 && /already exists/i.test(e.message)) {
      existing = await findExistingCustomer(input.email, input.phoneNumber);
      customerId = existing?.id as string | undefined;
    }
    if (!customerId) throw err;
  }

  if (!customerId) {
    throw new Error("Hyparrow did not return a customer id when creating the customer.");
  }

  if (existing?.accountNumber) {
    return {
      accountNumber: existing.accountNumber as string,
      accountName: existing.accountName as string,
      bankName: existing.bankName as string,
      customerId,
      reference: customerId,
    };
  }

  const bankCode = process.env.HYPARROW_VA_BANK_CODE ?? "035";
  const vaPayload = await request("/customers/virtual-account/custom", {
    customerId,
    bankCode,
    prefix: "FFFCSL",
  });
  const account = (vaPayload?.data ?? {}) as Record<string, unknown>;

  return {
    accountNumber: (account.accountNumber as string) ?? "",
    accountName: (account.accountName as string) ?? "",
    bankName: (account.bankName as string) ?? "",
    customerId,
    reference: customerId,
  };
}

export async function checkVirtualAccountPaid(customerId: string, amountKobo: number): Promise<boolean> {
  // On a busy registration day many farmers' transfers complete close
  // together; too small a limit here lets an older (still-unconfirmed)
  // payment scroll off the page before its check or webhook retry runs.
  const payload = await request(
    `/transactions?type=virtual_account&status=completed&limit=100`,
    undefined,
    "GET"
  );
  const list = (payload?.data as Array<Record<string, unknown>>) ?? [];
  return list.some((tx) => {
    if (tx.customerId !== customerId) return false;
    const amount = Number(tx.amount ?? 0);
    return amount >= amountKobo;
  });
}

/**
 * Hyparrow's invoice + hosted-checkout API. Used for the OPay-redirect and
 * USSD payment rails — separate from the dedicated virtual account above,
 * which stays the default "bank transfer" method since it already works.
 */
export async function createInvoice(input: {
  title: string;
  amountNaira: number;
  customerName?: string;
  customerEmail?: string;
}): Promise<{ id: string }> {
  const payload = await request("/invoices/", {
    title: input.title,
    customerName: input.customerName || undefined,
    customerEmail: input.customerEmail || undefined,
    lineItems: [{ description: input.title, quantity: 1, unitPrice: input.amountNaira }],
  });
  const invoice = (payload?.data ?? {}) as Record<string, unknown>;
  const id = invoice.id as string | undefined;
  if (!id) {
    throw new Error("Hyparrow did not return an invoice id.");
  }
  return { id };
}

export async function initOpayCheckout(invoiceId: string): Promise<{ redirectUrl: string }> {
  const payload = await request(`/checkout/${invoiceId}/opay`, {});
  const redirectUrl = payload?.redirectUrl as string | undefined;
  if (!redirectUrl) {
    throw new Error("Hyparrow did not return an OPay redirect URL.");
  }
  return { redirectUrl };
}

export async function generateUssdCode(
  invoiceId: string,
  bankCode: string
): Promise<{ ussdCode: string }> {
  const payload = await request(`/checkout/${invoiceId}/ussd`, { bankCode });
  const data = (payload?.data ?? {}) as Record<string, unknown>;
  const ussdCode = data.ussdCode as string | undefined;
  if (!ussdCode) {
    throw new Error("Hyparrow did not return a USSD code.");
  }
  return { ussdCode };
}

export async function getCheckoutStatus(invoiceId: string): Promise<boolean> {
  const payload = await request(`/checkout/${invoiceId}/status`, undefined, "GET");
  const data = (payload?.data ?? {}) as Record<string, unknown>;
  return Boolean(data.paid);
}
