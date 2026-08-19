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
 * Live Hyparrow invoice + hosted-checkout API, proxied through serverless
 * routes so the API key/secret never reach the browser. Powers the
 * OPay-redirect and USSD payment options alongside the dedicated virtual
 * account (bank transfer) flow.
 */
export const hyparrowCheckoutProvider = {
  async createInvoice(input: { amount: number; customerName: string; customerEmail: string }) {
    const data = await postJson<{ success: boolean; invoiceId: string }>("/api/hyparrow/checkout", {
      title: "FFFCSL ID Card Fee",
      amount: input.amount,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
    });
    return data.invoiceId;
  },

  async initOpay(invoiceId: string) {
    const data = await postJson<{ success: boolean; redirectUrl: string }>(
      "/api/hyparrow/checkout/opay",
      { invoiceId }
    );
    return data.redirectUrl;
  },

  async generateUssd(invoiceId: string, bankCode: string) {
    const data = await postJson<{ success: boolean; ussdCode: string }>(
      "/api/hyparrow/checkout/ussd",
      { invoiceId, bankCode }
    );
    return data.ussdCode;
  },

  async checkStatus(invoiceId: string) {
    const data = await postJson<{ success: boolean; paid: boolean }>(
      "/api/hyparrow/checkout/status",
      { invoiceId }
    );
    return data.paid;
  },
};
