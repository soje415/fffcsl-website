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

export const otpProvider = {
  async send(phone: string): Promise<string> {
    const data = await postJson<{ success: boolean; pinId: string }>(
      "/api/termii/otp/send",
      { phone }
    );
    return data.pinId;
  },

  async verify(pinId: string, pin: string): Promise<boolean> {
    const data = await postJson<{ success: boolean; verified: boolean }>(
      "/api/termii/otp/verify",
      { pinId, pin }
    );
    return data.verified;
  },

  async sendSms(phone: string, message: string): Promise<void> {
    await postJson<{ success: boolean }>("/api/termii/sms", { phone, message });
  },
};
