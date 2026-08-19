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
  photoDataUrl: string;
  photoSource: "" | "kyc" | "upload";
  phoneVerified: boolean;

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
  consentTerms: boolean;

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
  photoDataUrl: "",
  photoSource: "",
  phoneVerified: false,

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
  consentTerms: false,

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

export const STEP_LABELS = [
  "Identity Verification",
  "Personal Details",
  "Phone Verification",
  "Address & Farm",
  "Next of Kin",
  "Consent",
  "Payment",
  "Membership ID",
];
