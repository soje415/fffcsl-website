// Hausa letters that don't decompose under Unicode normalisation.
const HAUSA: Record<string, string> = { ɓ: "b", ɗ: "d", ƙ: "k", ƴ: "y", Ɓ: "b", Ɗ: "d", Ƙ: "k", Ƴ: "y" };

function tokens(...parts: Array<string | undefined>): string[] {
  return parts
    .join(" ")
    .replace(/[ɓɗƙƴƁƊƘƳ]/g, (c) => HAUSA[c] ?? c)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((t) => t.length >= 2);
}

function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Spelling drift is normal (Muhammad/Mohammed, Aisha/Ayisha), so longer names get a little slack. */
function sameName(a: string, b: string): boolean {
  if (a === b) return true;
  const shortest = Math.min(a.length, b.length);
  const allowed = shortest >= 7 ? 2 : shortest >= 4 ? 1 : 0;
  return allowed > 0 && editDistance(a, b, allowed) <= allowed;
}

/**
 * Does the name on a registry record belong to the person who registered?
 * Order-insensitive and typo-tolerant. A farmer who typed two or more names
 * must have at least two of them appear on the record, so knowing just a
 * first name (or a NIN alone) isn't enough to claim someone else's identity.
 */
export function registryNameMatches(
  typed: { firstName: string; lastName: string; otherNames?: string },
  registry: { firstName?: string; lastName?: string; middleName?: string }
): boolean {
  const mine = [...new Set(tokens(typed.firstName, typed.lastName, typed.otherNames))];
  const theirs = tokens(registry.firstName, registry.lastName, registry.middleName);
  if (mine.length === 0 || theirs.length === 0) return false;

  const matched = mine.filter((m) => theirs.some((t) => sameName(m, t))).length;
  return matched >= Math.min(2, mine.length);
}
