export type VirtualAccount = {
  accountNumber: string;
  accountName: string;
  bankName: string;
  customerId: string;
  reference: string;
};

export interface VirtualAccountProvider {
  createAccount(input: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    dateOfBirth?: string;
    address?: string;
    amount: number;
  }): Promise<VirtualAccount>;

  checkStatus(customerId: string, amount: number): Promise<"pending" | "paid">;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Request failed.");
  }
  return data;
}

/**
 * Live Hyparrow dedicated virtual account, proxied through a serverless API
 * route so the API key/secret never reach the browser. Amounts are converted
 * to kobo (Hyparrow's minor unit) before hitting the API.
 */
export const hyparrowVirtualAccountProvider: VirtualAccountProvider = {
  async createAccount(input) {
    const data = await postJson<{ success: boolean; account: VirtualAccount }>(
      "/api/hyparrow/virtual-account",
      {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phoneNumber: input.phone,
        dateOfBirth: input.dateOfBirth,
        address: input.address,
      }
    );
    return data.account;
  },

  async checkStatus(customerId, amount) {
    const data = await postJson<{ success: boolean; paid: boolean }>(
      "/api/hyparrow/virtual-account/status",
      { customerId, amountKobo: Math.round(amount * 100) }
    );
    return data.paid ? "paid" : "pending";
  },
};

export const mockVirtualAccountProvider: VirtualAccountProvider = {
  async createAccount({ firstName, lastName }) {
    await new Promise((r) => setTimeout(r, 600));
    const reference = `FFFCSL-${Date.now().toString(36).toUpperCase()}`;
    const accountNumber = String(
      1000000000 + Math.floor(Math.random() * 8999999999)
    );
    return {
      accountNumber,
      accountName: `FFFCSL / ${firstName} ${lastName}`.toUpperCase(),
      bankName: "Hyparrow (Test Mode)",
      customerId: reference,
      reference,
    };
  },
  async checkStatus() {
    await new Promise((r) => setTimeout(r, 400));
    return "paid";
  },
};
