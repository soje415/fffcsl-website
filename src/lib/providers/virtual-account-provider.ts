export type VirtualAccount = {
  accountNumber: string;
  bankName: string;
  accountName: string;
  amount: number;
  reference: string;
};

export interface VirtualAccountProvider {
  createAccount(input: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    amount: number;
  }): Promise<VirtualAccount>;

  checkStatus(reference: string): Promise<"pending" | "paid">;
}

/**
 * Placeholder until Hyparrow's dedicated-virtual-account API key/docs are
 * wired in (see plan phases 4-5). Simulates network latency and a
 * deterministic test account so the registration flow is fully clickable.
 */
export const mockVirtualAccountProvider: VirtualAccountProvider = {
  async createAccount({ firstName, lastName, amount }) {
    await new Promise((r) => setTimeout(r, 600));
    const reference = `FFFCSL-${Date.now().toString(36).toUpperCase()}`;
    const accountNumber = String(
      1000000000 + Math.floor(Math.random() * 8999999999)
    );
    return {
      accountNumber,
      bankName: "Hyparrow (Test Mode)",
      accountName: `FFFCSL / ${firstName} ${lastName}`.toUpperCase(),
      amount,
      reference,
    };
  },
  async checkStatus() {
    await new Promise((r) => setTimeout(r, 400));
    return "paid";
  },
};
