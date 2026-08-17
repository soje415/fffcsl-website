// eslint-disable-next-line @typescript-eslint/no-require-imports
const nsl = require("naija-state-local-government") as {
  states: () => string[];
  lgas: (state: string) => { state: string; lgas: string[] } | undefined;
};

export const NG_STATES = nsl.states();

export function getLgas(state: string): string[] {
  return nsl.lgas(state)?.lgas ?? [];
}

export const STATE_CODES: Record<string, string> = {
  Abia: "AB",
  Adamawa: "AD",
  "Akwa Ibom": "AK",
  Anambra: "AN",
  Bauchi: "BA",
  Bayelsa: "BY",
  Benue: "BE",
  Borno: "BO",
  "Cross River": "CR",
  Delta: "DE",
  Ebonyi: "EB",
  Edo: "ED",
  Ekiti: "EK",
  Enugu: "EN",
  "Federal Capital Territory": "FC",
  Gombe: "GO",
  Imo: "IM",
  Jigawa: "JI",
  Kaduna: "KD",
  Kano: "KN",
  Katsina: "KT",
  Kebbi: "KE",
  Kogi: "KO",
  Kwara: "KW",
  Lagos: "LA",
  Nassarawa: "NA",
  Niger: "NI",
  Ogun: "OG",
  Ondo: "ON",
  Osun: "OS",
  Oyo: "OY",
  Plateau: "PL",
  Rivers: "RI",
  Sokoto: "SO",
  Taraba: "TA",
  Yobe: "YO",
  Zamfara: "ZA",
};
