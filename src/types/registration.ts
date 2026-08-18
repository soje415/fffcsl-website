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
  virtualAccountNumber: string;
  virtualAccountBank: string;
  virtualAccountCustomerId: string;

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
  virtualAccountNumber: "",
  virtualAccountBank: "",
  virtualAccountCustomerId: "",

  kycType: "",
  kycNumber: "",
  verificationStatus: "pending",

  memberId: "",
};

export const STEP_LABELS = [
  "Personal Details",
  "Phone Verification",
  "Address & Farm",
  "Next of Kin",
  "Consent",
  "Payment",
  "Identity Verification",
  "Membership ID",
];
