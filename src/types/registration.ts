export type KycType = "" | "bvn" | "nin";

export type RegistrationData = {
  firstName: string;
  lastName: string;
  otherNames: string;
  dob: string;
  gender: "" | "Male" | "Female";
  maritalStatus: "" | "Single" | "Married" | "Divorced" | "Widowed";
  phone: string;
  email: string;
  nin: string;
  bvn: string;
  photoDataUrl: string;
  photoSource: "" | "kyc" | "upload";

  residentialAddress: string;
  state: string;
  lga: string;
  community: string;
  crops: string[];
  farmSizeHectares: string;
  yearsFarming: string;
  cluster: string;

  nokName: string;
  nokRelationship: string;
  nokPhone: string;

  consentData: boolean;

  welcomeSmsSent: boolean;
  paymentSmsSent: boolean;

  paymentStatus: "pending" | "paid";
  paymentMethod: "" | "bankTransfer" | "ussd" | "opay";
  virtualAccountNumber: string;
  virtualAccountBank: string;
  virtualAccountCustomerId: string;
  checkoutInvoiceId: string;
  ussdCode: string;
  ussdBankCode: string;

  kycType: KycType;
  kycNumber: string;
  verificationStatus: "pending" | "verified" | "mismatch";

  memberId: string;
};

export const EMPTY_REGISTRATION: RegistrationData = {
  firstName: "",
  lastName: "",
  otherNames: "",
  dob: "",
  gender: "",
  maritalStatus: "",
  phone: "",
  email: "",
  nin: "",
  bvn: "",
  photoDataUrl: "",
  photoSource: "",

  residentialAddress: "",
  state: "",
  lga: "",
  community: "",
  crops: [],
  farmSizeHectares: "",
  yearsFarming: "",
  cluster: "",

  nokName: "",
  nokRelationship: "",
  nokPhone: "",

  consentData: false,

  welcomeSmsSent: false,
  paymentSmsSent: false,

  paymentStatus: "pending",
  paymentMethod: "",
  virtualAccountNumber: "",
  virtualAccountBank: "",
  virtualAccountCustomerId: "",
  checkoutInvoiceId: "",
  ussdCode: "",
  ussdBankCode: "",

  kycType: "",
  kycNumber: "",
  verificationStatus: "pending",

  memberId: "",
};

// Order for the Registration wizard (Phase 1) — every personal, farm, and
// next-of-kin detail is collected *before* a token is issued, so nothing is
// left to fill in later.
export const REGISTER_STEP_LABELS = ["Personal Details", "Address & Farm", "Next of Kin", "Consent"];
export const REGISTER_STEP_LABELS_HA = ["Bayanan kai", "Adireshi da gona", "Mai kula da kai", "Yarjejeniya"];

// Order for the ID Card Registration wizard (Phase 2, after a farmer holds a
// token from Phase 1) — payment comes first (required server-side before any
// KYC lookup runs), then BVN/NIN identity verification, then the ID card.
export const ID_CARD_STEP_LABELS = ["Payment", "Identity Verification", "Membership ID"];
export const ID_CARD_STEP_LABELS_HA = ["Biya", "Tabbatar da asali", "Katin zama memba"];
