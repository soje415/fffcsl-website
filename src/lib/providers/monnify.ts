const DEFAULT_BASE_URL = "https://sandbox.monnify.com";

function config() {
  const apiKey = process.env.MONNIFY_API_KEY;
  const secretKey = process.env.MONNIFY_SECRET_KEY;
  const contractCode = process.env.MONNIFY_CONTRACT_CODE;
  if (!apiKey || !secretKey || !contractCode) {
    throw new Error(
      "Monnify credentials are not configured (set MONNIFY_API_KEY, MONNIFY_SECRET_KEY and MONNIFY_CONTRACT_CODE)."
    );
  }
  return {
    baseUrl: (process.env.MONNIFY_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, ""),
    apiKey,
    secretKey,
    contractCode,
  };
}

export type MonnifyError = Error & { code?: string; status?: number };

// Cached per warm serverless instance; a cold start just logs in again.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5_000) return cachedToken.value;

  const { baseUrl, apiKey, secretKey } = config();
  const basic = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");
  const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
  });
  const payload = (await res.json().catch(() => null)) as {
    requestSuccessful?: boolean;
    responseMessage?: string;
    responseBody?: { accessToken?: string; expiresIn?: number };
  } | null;

  if (!res.ok || !payload?.requestSuccessful || !payload.responseBody?.accessToken) {
    const err = new Error(payload?.responseMessage ?? `Monnify login failed (${res.status})`) as MonnifyError;
    err.status = res.status;
    throw err;
  }

  const token = payload.responseBody.accessToken;
  const ttlMs = (payload.responseBody.expiresIn ?? 3600) * 1000;
  cachedToken = { value: token, expiresAt: Date.now() + ttlMs };
  return token;
}

async function request(path: string, body?: unknown, method: "GET" | "POST" = "POST") {
  const { baseUrl } = config();
  const token = await getAccessToken();
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  type MonnifyResponse = {
    requestSuccessful?: boolean;
    responseMessage?: string;
    responseCode?: string;
    responseBody?: Record<string, unknown>;
  };
  let payload: MonnifyResponse | null = null;
  try {
    payload = (await res.json()) as MonnifyResponse;
  } catch {
    payload = null;
  }

  if (!res.ok || !payload?.requestSuccessful) {
    const err = new Error(payload?.responseMessage ?? `Monnify request failed (${res.status})`) as MonnifyError;
    err.code = payload?.responseCode;
    err.status = res.status;
    throw err;
  }

  return payload.responseBody ?? {};
}

export type ReservedAccount = {
  accountNumber: string;
  accountName: string;
  bankName: string;
  accountReference: string;
  reservationReference: string;
};

/**
 * Creates (or, on retry, would recreate — callers should reuse an existing
 * accountReference instead) a dedicated Monnify Reserved Account. With
 * getAllAvailableBanks the response lists several bank options for the same
 * account reference; we surface the first as the primary display account.
 */
function toReservedAccount(body: Record<string, unknown>, fallbackReference: string): ReservedAccount {
  const accounts = (body.accounts as Array<Record<string, unknown>>) ?? [];
  const primary = accounts[0] ?? {};
  return {
    accountNumber: (primary.accountNumber as string) ?? "",
    accountName: (primary.accountName as string) ?? "",
    bankName: (primary.bankName as string) ?? "",
    accountReference: (body.accountReference as string) ?? fallbackReference,
    reservationReference: (body.reservationReference as string) ?? "",
  };
}

export async function getReservedAccount(accountReference: string): Promise<ReservedAccount> {
  const body = await request(
    `/api/v2/bank-transfer/reserved-accounts/${encodeURIComponent(accountReference)}`,
    undefined,
    "GET"
  );
  return toReservedAccount(body, accountReference);
}

export async function createReservedAccount(input: {
  accountReference: string;
  accountName: string;
  customerEmail: string;
  customerName: string;
  bvn?: string;
}): Promise<ReservedAccount> {
  const { contractCode } = config();
  try {
    const body = await request("/api/v2/bank-transfer/reserved-accounts", {
      accountReference: input.accountReference,
      accountName: input.accountName,
      currencyCode: "NGN",
      contractCode,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      bvn: input.bvn || undefined,
      getAllAvailableBanks: true,
    });
    return toReservedAccount(body, input.accountReference);
  } catch (err) {
    // A retry after our own DB write failed on a previous attempt would
    // otherwise dead-end here, since Monnify already holds this reference.
    const e = err as MonnifyError;
    if (e.status === 400 && /already exist|duplicate/i.test(e.message)) {
      return getReservedAccount(input.accountReference);
    }
    throw err;
  }
}

type MonnifyTransaction = {
  paymentStatus?: string;
  amountPaid?: string | number;
};

/**
 * Sums PAID/OVERPAID transactions credited to a reserved account and
 * compares against the fee we expect — mirrors how the webhook re-checks
 * against our own amount rather than trusting the event alone.
 */
export async function checkReservedAccountPaid(accountReference: string, amountKobo: number): Promise<boolean> {
  const body = await request(
    `/api/v1/bank-transfer/reserved-accounts/transactions?accountReference=${encodeURIComponent(accountReference)}&page=0&size=20`,
    undefined,
    "GET"
  );
  const page = (body.content as MonnifyTransaction[] | undefined) ?? [];
  const totalKobo = page
    .filter((t) => t.paymentStatus === "PAID" || t.paymentStatus === "OVERPAID")
    .reduce((sum, t) => sum + Math.round(Number(t.amountPaid ?? 0) * 100), 0);
  return totalKobo >= amountKobo;
}

export type CheckoutSession = { checkoutUrl: string; transactionReference: string };

/**
 * Monnify's hosted checkout — one redirect that lets the payer choose card,
 * bank transfer or USSD, unlike Hyparrow which needed a separate
 * integration per rail. paymentReference is ours (idempotency key);
 * transactionReference comes back from Monnify and is what we track by.
 */
export async function initCheckout(input: {
  amountNaira: number;
  paymentReference: string;
  customerName: string;
  customerEmail: string;
  description: string;
  redirectUrl: string;
}): Promise<CheckoutSession> {
  const { contractCode } = config();
  const body = await request("/api/v1/merchant/transactions/init-transaction", {
    amount: input.amountNaira,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    paymentReference: input.paymentReference,
    paymentDescription: input.description,
    currencyCode: "NGN",
    contractCode,
    redirectUrl: input.redirectUrl,
    paymentMethods: ["ACCOUNT_TRANSFER"],
  });

  const checkoutUrl = body.checkoutUrl as string | undefined;
  const transactionReference = body.transactionReference as string | undefined;
  if (!checkoutUrl || !transactionReference) {
    throw new Error("Monnify did not return a checkout URL.");
  }
  return { checkoutUrl, transactionReference };
}

export async function getTransactionStatus(transactionReference: string): Promise<boolean> {
  const body = await request(`/api/v2/transactions/${encodeURIComponent(transactionReference)}`, undefined, "GET");
  const status = body.paymentStatus as string | undefined;
  return status === "PAID" || status === "OVERPAID";
}
