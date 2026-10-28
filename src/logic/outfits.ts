import { ACTIVITY_BY_ID } from '../data/activities';
import { COLOR_BY_ID, Season } from '../data/colors';
import { compatible } from '../data/compat';
import { STYLE_BY_ID, footwearGoesWith } from '../data/pieces';
import { CapsulePiece } from './capsule';
import { mulberry32 } from './rng';

export interface Outfit { id: string; activityId: string; pieceIds: string[]; score: number }

type Range = [number, number];
const overlaps = (a: Range, b: Range) => a[0] <= b[1] && b[0] <= a[1];
const gap = (a: Range, b: Range) => Math.max(0, Math.max(a[0], b[0]) - Math.min(a[1], b[1]));
const mid = (r: Range) => (r[0] + r[1]) / 2;
const st = (p: CapsulePiece) => STYLE_BY_ID[p.styleId];
const catOf = (p: CapsulePiece) => st(p).cat;

export const OUTFIT_DEPTH = 12;

export function enumerateOutfits(pieces: CapsulePiece[], season: Season, activityId: string, rand: () => number): Outfit[] {
  const act = ACTIVITY_BY_ID[activityId];
  if (!act) return [];
  const fits = (p: CapsulePiece) => overlaps(st(p).formality, act.formality);
  const by = (c: string) => pieces.filter((p) => catOf(p) === c && fits(p));
  const tops = by('tops'), sweaters = by('sweaters'), outers = by('outerwear'), bottoms = by('bottoms'), shoes = by('shoes');
  const hasLight = pieces.some((p) => p.styleId === 'light-jacket');
  const sweaterMode = season === 'winter' ? 'req' : season === 'summer' ? 'none' : 'opt';
  const outerMode = season === 'winter' ? 'req' : season === 'summer' ? (hasLight ? 'opt' : 'none') : 'opt';
  const out: Outfit[] = [];
  const sweaterOpts: (CapsulePiece | null)[] = sweaterMode === 'none' ? [null] : sweaterMode === 'req' ? sweaters : [null, ...sweaters];
  const outerOpts: (CapsulePiece | null)[] = outerMode === 'none' ? [null] : outerMode === 'req' ? outers : [null, ...outers];
  for (const sw of sweaterOpts) {
    const topOpts: (CapsulePiece | null)[] = sw && sw.styleId === 'turtleneck' ? [null] : tops;
    for (const top of topOpts) {
      if (!top && !sw) continue;
      for (const ou of outerOpts) {
        if (ou && sw && ['overshirt', 'light-jacket'].includes(ou.styleId)) continue;
        if (ou && sw && sw.styleId === 'cardigan' && ou.styleId === 'blazer') continue;
        for (const bo of bottoms) {
          // color rules over palette colors
          const cols = [top, sw, ou, bo].filter(Boolean).map((p) => p!.colorId);
          let ok = true;
          for (let i = 0; i < cols.length && ok; i++) for (let j = i + 1; j < cols.length; j++) if (!compatible(cols[i], cols[j])) { ok = false; break; }
          if (!ok) continue;
          const distinct = [...new Set(cols)];
          if (distinct.filter((c) => COLOR_BY_ID[c].role === 'accent').length > 1) continue;
          if (distinct.filter((c) => COLOR_BY_ID[c].role !== 'neutral').length > 3) continue;
          const core = [top ?? sw!, bo];
          for (const sh of shoes) {
            const all = [...core, sh];
            if (all.some((a) => all.some((b) => gap(st(a).formality, st(b).formality) > 1))) continue;
            if (!footwearGoesWith(sh.colorId, bo.colorId)) continue;
            if (sh.colorId === 'f-oxblood' && act.formality[1] < 3) continue;
            const parts = [top, sw, ou, bo, sh].filter(Boolean) as CapsulePiece[];
            let score = 0;
            for (const p of parts) {
              score += st(p).tags.filter((t) => act.tags.includes(t)).length * 1.5;
              score -= Math.abs(mid(st(p).formality) - mid(act.formality)) * 0.6;
            }
            const roles = distinct.map((c) => COLOR_BY_ID[c].role);
            if (roles.includes('neutral') && roles.includes('base') && roles.includes('accent')) score += 3;
            else if (roles.includes('accent')) score += 1;
            if (roles.includes('base')) score += 1.5;
            const hues = new Set(distinct.filter((c) => COLOR_BY_ID[c].role !== 'neutral').map((c) => COLOR_BY_ID[c].hue));
            if (hues.size === 1 && distinct.length > 1) score += 1.5;
            score += rand() * 2.2;
            out.push({ id: `${activityId}:${parts.map((p) => p.id).join('+')}`, activityId, pieceIds: parts.map((p) => p.id), score });
          }
        }
      }
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

/** Greedy diversity pick: maximal marginal relevance, with a cap of 3 uses per piece when possible. */
export function pickDiverse(cands: Outfit[], n: number, cap = 3): Outfit[] {
  const picked: Outfit[] = [];
  const uses: Record<string, number> = {};
  const pool = [...cands];
  while (picked.length < n && pool.length) {
    let bestI = -1, bestV = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const o = pool[i];
      if (cap && o.pieceIds.some((id) => (uses[id] ?? 0) >= cap)) continue;
      let sim = 0;
      for (const p of picked) sim = Math.max(sim, o.pieceIds.filter((id) => p.pieceIds.includes(id)).length / o.pieceIds.length);
      const v = o.score - 4 * sim;
      if (v > bestV) { bestV = v; bestI = i; }
    }
    if (bestI < 0) break;
    const [o] = pool.splice(bestI, 1);
    picked.push(o); o.pieceIds.forEach((id) => (uses[id] = (uses[id] ?? 0) + 1));
  }
  if (picked.length < n && cap) {
    const rest = pool.filter((o) => !picked.includes(o));
    return [...picked, ...pickDiverse(rest, n - picked.length, 0)];
  }
  return picked;
}

export function generateOutfits(pieces: CapsulePiece[], season: Season, activityIds: string[], seed: number): Outfit[] {
  const all: Outfit[] = [];
  activityIds.forEach((id, i) => {
    const rand = mulberry32(seed * 7919 + i * 104729 + 13);
    all.push(...pickDiverse(enumerateOutfits(pieces, season, id, rand), OUTFIT_DEPTH));
  });
  return all;
}
