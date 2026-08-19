import { STATE_CODES } from "@/lib/ng-locations";

export function generateMemberId(state: string) {
  const code = STATE_CODES[state] ?? "NG";
  const serial = Math.floor(100000 + Math.random() * 899999);
  return `FFFCSL/${code}/${serial}`;
}
