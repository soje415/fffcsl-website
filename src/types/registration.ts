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

  residentialAddress: string;
  state: string;
  lga: string;
  community: string;
  primaryCrop: string;
  farmSizeHectares: string;
  yearsFarming: string;
  cluster: string;

  nokName: string;
  nokRelationship: string;
  nokPhone: string;

  consentData: boolean;
  consentTerms: boolean;

  paymentStatus: "pending" | "paid";
  virtualAccountNumber: string;
  virtualAccountBank: string;

  bvn: string;
  nin: string;
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

  residentialAddress: "",
  state: "",
  lga: "",
  community: "",
  primaryCrop: "",
  farmSizeHectares: "",
  yearsFarming: "",
  cluster: "",

  nokName: "",
  nokRelationship: "",
  nokPhone: "",

  consentData: false,
  consentTerms: false,

  paymentStatus: "pending",
  virtualAccountNumber: "",
  virtualAccountBank: "",

  bvn: "",
  nin: "",
  verificationStatus: "pending",

  memberId: "",
};

export const STEP_LABELS = [
  "Personal Details",
  "Address & Farm",
  "Next of Kin",
  "Consent",
  "Payment",
  "Identity Verification",
  "Membership ID",
];
