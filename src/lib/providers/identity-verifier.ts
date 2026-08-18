export type VerificationResult = {
  status: "verified" | "mismatch";
  matchedName?: string;
  reason?: string;
};

export interface IdentityVerifier {
  verify(input: {
    type: "bvn" | "nin";
    identifier: string;
    firstName: string;
    lastName: string;
  }): Promise<VerificationResult>;
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
 * Live Hyparrow BVN/NIN verification, proxied through a serverless API route
 * so the API key/secret never reach the browser.
 */
export const hyparrowIdentityVerifier: IdentityVerifier = {
  async verify(input) {
    const data = await postJson<{
      success: boolean;
      status: VerificationResult["status"];
      matchedName?: string;
      reason?: string;
    }>("/api/hyparrow/verify", input);
    return {
      status: data.status,
      matchedName: data.matchedName,
      reason: data.reason,
    };
  },
};

export const mockIdentityVerifier: IdentityVerifier = {
  async verify({ firstName, lastName }) {
    await new Promise((r) => setTimeout(r, 900));
    return { status: "verified", matchedName: `${firstName} ${lastName}` };
  },
};
