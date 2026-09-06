export type IdentityRecord = {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  dateOfBirth?: string;
  gender?: string;
  photo?: string;
};

export type VerificationResult = {
  status: "verified" | "not_found";
  record?: IdentityRecord;
  reason?: string;
};

export interface IdentityVerifier {
  verify(input: { type: "bvn" | "nin"; identifier: string; memberId: string }): Promise<VerificationResult>;
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
      record?: IdentityRecord;
      reason?: string;
    }>("/api/hyparrow/verify", {
      type: input.type,
      identifier: input.identifier,
      memberId: input.memberId,
    });
    return {
      status: data.status,
      record: data.record,
      reason: data.reason,
    };
  },
};

export const mockIdentityVerifier: IdentityVerifier = {
  async verify() {
    await new Promise((r) => setTimeout(r, 900));
    return {
      status: "verified",
      record: { firstName: "Amina", lastName: "Bello", dateOfBirth: "1990-01-01", gender: "Female" },
    };
  },
};
