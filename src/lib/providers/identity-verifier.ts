export type VerificationResult = {
  status: "verified" | "mismatch";
  matchedName?: string;
};

export interface IdentityVerifier {
  verify(input: {
    bvn: string;
    nin: string;
    firstName: string;
    lastName: string;
    dob: string;
  }): Promise<VerificationResult>;
}

/**
 * Placeholder until Hyparrow's BVN/NIN verification API key/docs are wired
 * in (see plan phases 4-5). Validates format only and always resolves
 * "verified" so the registration flow is fully clickable end to end.
 */
export const mockIdentityVerifier: IdentityVerifier = {
  async verify({ firstName, lastName }) {
    await new Promise((r) => setTimeout(r, 900));
    return { status: "verified", matchedName: `${firstName} ${lastName}` };
  },
};
