import { ACCENTS, BASES, COLOR_BY_ID, NEUTRALS, Palette, colorName } from '../data/colors';
import { accentsMayClash, compatible } from '../data/compat';

export interface Draft { neutrals: string[]; bases: string[]; accents: string[] }
export const emptyDraft = (): Draft => ({ neutrals: [], bases: [], accents: [] });

/** The article's rules. Returns the first failed rule as a message, or null when the palette is valid. */
export function paletteProblem(p: Palette): string | null {
  if (p.neutrals.length !== 2 || p.bases.length !== 3 || p.accents.length !== 4) return 'Palette needs 2 neutrals, 3 base colors and 4 accents.';
  const all = [...p.neutrals, ...p.bases, ...p.accents];
  if (new Set(all).size !== 9) return 'Palette has a repeated color.';
  for (const n of p.neutrals) for (const c of all) if (!compatible(n, c)) return `${colorName(n)} should go with every other shade.`;
  for (const b of p.bases) {
    for (const o of p.bases) if (!compatible(b, o)) return `${colorName(b)} clashes with ${colorName(o)}.`;
    if (p.accents.filter((a) => compatible(b, a)).length < 2) return `${colorName(b)} needs at least two matching accents.`;
  }
  for (const a of p.accents) if (p.bases.filter((b) => compatible(a, b)).length < 2) return `${colorName(a)} needs at least two matching base colors.`;
  return null;
}
export const validatePalette = (p: Palette) => paletteProblem(p) === null;

function combos<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [h, ...t] = arr;
  return [...combos(t, k - 1).map((c) => [h, ...c]), ...combos(t, k)];
}
const NID = NEUTRALS.map((c) => c.id), BID = BASES.map((c) => c.id), AID = ACCENTS.map((c) => c.id);

/** Lookahead: can this partial draft still be completed into a valid palette? */
export function canComplete(d: Draft): boolean {
  const ns = d.neutrals.length === 2 ? [d.neutrals] : combos(NID.filter((x) => !d.neutrals.includes(x)), 2 - d.neutrals.length).map((c) => [...d.neutrals, ...c]);
  const bs = combos(BID.filter((x) => !d.bases.includes(x)), 3 - d.bases.length).map((c) => [...d.bases, ...c]);
  const as = combos(AID.filter((x) => !d.accents.includes(x)), 4 - d.accents.length).map((c) => [...d.accents, ...c]);
  for (const neutrals of ns) for (const bases of bs) {
    if (!bases.every((b, i) => bases.every((o, j) => i === j || compatible(b, o)))) continue;
    for (const accents of as) if (validatePalette({ neutrals, bases, accents })) return true;
  }
  return false;
}

export interface Gate { enabled: boolean; reason?: string }

export function neutralGate(id: string, d: Draft): Gate {
  if (d.neutrals.includes(id)) return { enabled: true };
  if (d.neutrals.length >= 2) return { enabled: false, reason: 'You already have 2 neutrals. Tap one to swap.' };
  for (const n of d.neutrals) if (!compatible(n, id)) return { enabled: false, reason: `Clashes with ${colorName(n)}.` };
  if (!canComplete({ ...d, neutrals: [...d.neutrals, id] })) return { enabled: false, reason: 'Leaves too few matching colors.' };
  return { enabled: true };
}
export function baseGate(id: string, d: Draft): Gate {
  if (d.bases.includes(id)) return { enabled: true };
  if (d.neutrals.length < 2) return { enabled: false, reason: 'Pick 2 neutrals first.' };
  if (d.bases.length >= 3) return { enabled: false, reason: 'You already have 3 base colors. Tap one to swap.' };
  for (const n of d.neutrals) if (!compatible(n, id)) return { enabled: false, reason: `Clashes with ${colorName(n)}.` };
  for (const b of d.bases) if (!compatible(b, id)) return { enabled: false, reason: `Clashes with ${colorName(b)}.` };
  if (!canComplete({ ...d, bases: [...d.bases, id] })) return { enabled: false, reason: 'Leaves too few matching colors.' };
  return { enabled: true };
}
export function accentGate(id: string, d: Draft): Gate {
  if (d.accents.includes(id)) return { enabled: true };
  if (d.bases.length < 3) return { enabled: false, reason: 'Pick 3 base colors first.' };
  if (d.accents.length >= 4) return { enabled: false, reason: 'You already have 4 accents. Tap one to swap.' };
  for (const n of d.neutrals) if (!compatible(n, id)) return { enabled: false, reason: `Clashes with ${colorName(n)}.` };
  if (d.bases.filter((b) => compatible(b, id)).length < 2) return { enabled: false, reason: 'Matches fewer than 2 of your base colors.' };
  if (!canComplete({ ...d, accents: [...d.accents, id] })) return { enabled: false, reason: 'Leaves too few matching colors.' };
  return { enabled: true };
}
export const accentWarn = (id: string, d: Draft): string | null => {
  const o = d.accents.find((a) => a !== id && accentsMayClash(a, id));
  return o ? `May clash with ${colorName(o)}.` : null;
};

/** After a change to an earlier pick, drop later picks that became invalid. Returns the cleaned draft and what was removed. */
export function cleanDraft(d: Draft): { draft: Draft; removed: string[] } {
  const removed: string[] = [];
  const neutrals = d.neutrals.filter((n, i) => { const ok = d.neutrals.slice(0, i).every((o) => compatible(o, n)); if (!ok) removed.push(n); return ok; });
  const bases: string[] = [];
  for (const b of d.bases) {
    if (neutrals.length === 2 && neutrals.every((n) => compatible(n, b)) && bases.every((o) => compatible(o, b))) bases.push(b); else removed.push(b);
  }
  const accents: string[] = [];
  for (const a of d.accents) {
    if (bases.length >= 2 && neutrals.every((n) => compatible(n, a)) && bases.filter((b) => compatible(a, b)).length >= 2 && accents.length < 4) accents.push(a); else removed.push(a);
  }
  return { draft: { neutrals, bases, accents }, removed };
}

/** Options for swapping one slot of a complete palette (right-panel color picker). */
export function swapOptions(p: Palette, role: 'neutrals' | 'bases' | 'accents', current: string): string[] {
  const pool = role === 'neutrals' ? NID : role === 'bases' ? BID : AID;
  return pool.filter((c) => c === current || (!Object.values(p).flat().includes(c) && validatePalette({ ...p, [role]: p[role].map((x) => (x === current ? c : x)) })));
}

export const roleOf = (id: string) => COLOR_BY_ID[id]?.role;

/** Suggest 4 accents (spec 6.4): season affinity + hue variety + number of bases each pairs with. */
export function suggestAccents(neutrals: string[], bases: string[], season: string): string[] {
  const cands = AID.filter((a) => neutrals.every((n) => compatible(n, a)) && bases.filter((b) => compatible(a, b)).length >= 2);
  const chosen: string[] = [];
  while (chosen.length < 4 && cands.length > chosen.length) {
    let best = '', bestScore = -1e9;
    for (const a of cands) {
      if (chosen.includes(a)) continue;
      const c = COLOR_BY_ID[a];
      let score = (c.seasons as string[]).includes(season) ? 3 : 0;
      score += bases.filter((b) => compatible(a, b)).length;
      if (chosen.some((o) => COLOR_BY_ID[o].hue === c.hue)) score -= 4;
      if (chosen.some((o) => accentsMayClash(o, a))) score -= 2;
      if (score > bestScore) { bestScore = score; best = a; }
    }
    chosen.push(best);
  }
  // make sure the result is a valid palette; fall back to any completion
  if (!validatePalette({ neutrals, bases, accents: chosen })) {
    const alt = combos(cands, 4).find((acc) => validatePalette({ neutrals, bases, accents: acc }));
    return alt ?? chosen;
  }
  return chosen;
}
