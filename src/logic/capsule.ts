import { ACTIVITY_BY_ID } from '../data/activities';
import { COLOR_BY_ID, Palette, Season } from '../data/colors';
import { VALID_FABRICS } from '../data/fabrics';
import { CATEGORIES, Category, FOOTWEAR_ALLOWED, STYLES, STYLE_BY_ID, Style, footwearGoesWith } from '../data/pieces';

export interface CapsulePiece { id: string; styleId: string; colorId: string; fabricId: string; pinned?: boolean }
export interface CapsuleInput {
  season: Season; palette: Palette; activityIds: string[]; excluded: string[]; included: string[]; pins: CapsulePiece[];
}
export interface CapsuleResult { pieces: CapsulePiece[] }

export const paletteIds = (p: Palette) => [...p.neutrals, ...p.bases, ...p.accents];
export const fabricFor = (style: Style, season: Season): string | null => style.fabrics.find((f) => VALID_FABRICS[season].includes(f)) ?? null;
export const isShoeStyle = (styleId: string) => STYLE_BY_ID[styleId]?.cat === 'shoes';

/** Colors this style may take: its feasibility list (8.4) intersected with the palette. Shoes use the footwear set. */
export function colorsFor(style: Style, palette: Palette): string[] {
  if (style.cat === 'shoes') return FOOTWEAR_ALLOWED[style.id] ?? [];
  const ids = paletteIds(palette);
  return ids.filter((c) => style.allowed === 'all' || style.allowed.includes(c));
}
/** Styles shown for a season and palette: valid season, a valid fabric, and at least one color. */
export function availableStyles(season: Season, palette: Palette): Style[] {
  return STYLES.filter((s) => !s.womenOnly && s.seasons.includes(season) && fabricFor(s, season) !== null && colorsFor(s, palette).length > 0);
}
export function styleScore(style: Style, activityIds: string[], included: string[]): number {
  let score = included.includes(style.id) ? 3 : 0;
  for (const id of activityIds) {
    const a = ACTIVITY_BY_ID[id];
    if (!a) continue;
    const overlap = style.tags.filter((t) => a.tags.includes(t)).length;
    const fit = style.formality[0] <= a.formality[1] && a.formality[0] <= style.formality[1];
    if (fit) score += 2 + overlap; else score += overlap * 0.25;
  }
  return score;
}
const quotaFor = (cat: Category, season: Season, base: number) => {
  if (season === 'summer' && (cat === 'sweaters' || cat === 'outerwear')) return 1;
  return base;
};
const GROUP_RANK: Record<'K' | 'B' | 'A', Array<'neutrals' | 'bases' | 'accents'>> = {
  K: ['bases', 'neutrals'], B: ['neutrals', 'bases', 'accents'], A: ['accents', 'bases', 'neutrals'],
};

export function pieceValid(p: CapsulePiece, season: Season, palette: Palette): boolean {
  const st = STYLE_BY_ID[p.styleId];
  if (!st || !st.seasons.includes(season) || fabricFor(st, season) === null) return false;
  return colorsFor(st, palette).includes(p.colorId);
}


type Slot = { style: Style; pin?: CapsulePiece };
const fitsAct = (st: Style, actId: string) => { const a = ACTIVITY_BY_ID[actId]; return !!a && st.formality[0] <= a.formality[1] && a.formality[0] <= st.formality[1]; };
/** Every occasion needs enough pieces whose formality fits it, in each layer an outfit uses. */
function ensureCoverage(slotsByCat: Record<string, Slot[]>, avail: Style[], season: Season, activityIds: string[], included: string[]) {
  const need = (cat: Category): number => {
    if (cat === 'tops') return 3;
    if (cat === 'bottoms') return 2;
    if (cat === 'shoes') return 2;
    if (season === 'winter' && (cat === 'sweaters' || cat === 'outerwear')) return cat === 'sweaters' ? 2 : 1;
    return 0;
  };
  const cats: Category[] = ['tops', 'bottoms', 'shoes', 'sweaters', 'outerwear'];
  const count = (cat: Category, act: string) => slotsByCat[cat].filter((x) => fitsAct(x.style, act)).length;
  const deficits = () => {
    const out: { act: string; cat: Category }[] = [];
    for (const act of activityIds) for (const cat of cats) {
      const n = Math.min(need(cat), avail.filter((st) => st.cat === cat && fitsAct(st, act)).length * 2);
      if (n > 0 && count(cat, act) < n) out.push({ act, cat });
    }
    return out;
  };
  for (let guard = 0; guard < 60; guard++) {
    const d = deficits();
    if (d.length === 0) return;
    const { act, cat } = d[0];
    const list = slotsByCat[cat];
    const pool = avail.filter((st) => st.cat === cat && fitsAct(st, act)).sort((a, b) => styleScore(b, activityIds, included) - styleScore(a, activityIds, included));
    const have = (id: string) => list.filter((x) => x.style.id === id).length;
    const cand = pool.find((st) => have(st.id) < 2);
    if (!cand) return;
    // remove the weakest slot whose removal does not create a new deficit
    const removable = list.map((x, i) => ({ x, i })).filter(({ x }) => !x.pin && !fitsAct(x.style, act))
      .sort((a, b) => styleScore(a.x.style, activityIds, included) - styleScore(b.x.style, activityIds, included));
    let done = false;
    for (const r of removable) {
      const before = deficits().length;
      list.splice(r.i, 1, { style: cand });
      if (deficits().length < before) { done = true; break; }
      list.splice(r.i, 1, r.x);
    }
    if (!done) { if (list.length < 9) list.push({ style: cand }); else return; }
  }
}

export function generateCapsule(inp: CapsuleInput): CapsuleResult {
  const { season, palette, activityIds, excluded, included } = inp;
  const avail = availableStyles(season, palette).filter((s) => !excluded.includes(s.id));
  const pieces: CapsulePiece[] = [];
  const used: Record<string, number> = {};
  const usedCat: Record<string, number> = {};
  const bump = (cat: string, c: string) => { used[c] = (used[c] ?? 0) + 1; usedCat[cat + c] = (usedCat[cat + c] ?? 0) + 1; };
  const mkPiece = (style: Style, colorId: string, pinned = false): CapsulePiece => {
    let id = `${style.id}~${colorId}`; let n = 2;
    while (pieces.some((p) => p.id === id)) id = `${style.id}~${colorId}~${n++}`;
    return { id, styleId: style.id, colorId, fabricId: fabricFor(style, season)!, ...(pinned ? { pinned: true } : {}) };
  };
  const slots: { style: Style; pin?: CapsulePiece }[] = [];
  const catOrder: Category[] = ['tops', 'sweaters', 'outerwear', 'bottoms', 'shoes'];
  const slotsByCat: Record<string, { style: Style; pin?: CapsulePiece }[]> = {};
  for (const cat of catOrder) {
    const quota = quotaFor(cat, season, CATEGORIES.find((c) => c.id === cat)!.quota);
    const styles = avail.filter((s) => s.cat === cat).sort((a, b) => styleScore(b, activityIds, included) - styleScore(a, activityIds, included) || a.id.localeCompare(b.id));
    const list: { style: Style; pin?: CapsulePiece }[] = [];
    for (const pin of inp.pins) {
      const st = STYLE_BY_ID[pin.styleId];
      if (st?.cat === cat && styles.includes(st) && pieceValid(pin, season, palette) && list.length < quota + 2) list.push({ style: st, pin });
    }
    const count: Record<string, number> = {};
    list.forEach((s) => (count[s.style.id] = (count[s.style.id] ?? 0) + 1));
    for (let pass = 1; list.length < quota && styles.length > 0; pass++) {
      let added = false;
      for (const st of styles) {
        if (list.length >= quota) break;
        if ((count[st.id] ?? 0) < pass) { list.push({ style: st }); count[st.id] = (count[st.id] ?? 0) + 1; added = true; }
      }
      if (!added && pass > 6) break;
    }
    slotsByCat[cat] = list;
  }
  ensureCoverage(slotsByCat, avail, season, activityIds, included);
  for (const cat of catOrder) slots.push(...slotsByCat[cat]);
  // pins first so their colors count toward usage
  for (const s of slots) if (s.pin) { pieces.push({ ...s.pin, fabricId: fabricFor(s.style, season)!, pinned: true }); if (s.style.cat !== 'shoes') bump(s.style.cat, s.pin.colorId); }
  const poolOf = (id: string): 'neutrals' | 'bases' | 'accents' => (palette.neutrals.includes(id) ? 'neutrals' : palette.bases.includes(id) ? 'bases' : 'accents');
  for (const cat of ['tops', 'sweaters', 'outerwear', 'bottoms'] as Category[]) {
    for (const slot of slotsByCat[cat]) {
      if (slot.pin) continue;
      const st = slot.style;
      let opts = colorsFor(st, palette);
      if (st.role === 'K') opts = opts.filter((c) => poolOf(c) !== 'accents');
      if (opts.length === 0) opts = colorsFor(st, palette);
      const sameStyle = pieces.filter((p) => p.styleId === st.id).map((p) => p.colorId);
      const ranks = GROUP_RANK[st.role];
      let best = opts[0], bestScore = Infinity;
      for (const c of opts) {
        const rank = ranks.indexOf(poolOf(c));
        const score = (rank < 0 ? 5 : rank) * 100 + (usedCat[cat + c] ?? 0) * 12 + (used[c] ?? 0) * 3 + (sameStyle.includes(c) ? 40 : 0);
        if (score < bestScore) { bestScore = score; best = c; }
      }
      pieces.push(mkPiece(st, best)); bump(cat, best);
    }
  }
  // every accent appears on at least one top or sweater when a style allows it
  for (const acc of palette.accents) {
    if ((used[acc] ?? 0) > 0) continue;
    const cands = pieces.filter((p) => !p.pinned && ['tops', 'sweaters'].includes(STYLE_BY_ID[p.styleId].cat) && colorsFor(STYLE_BY_ID[p.styleId], palette).includes(acc)
      && poolOf(p.colorId) !== 'accents');
    const formal = (p: CapsulePiece) => (['oxford', 'dress-shirt'].includes(p.styleId) ? 1 : 0); // accents read best on casual tops and knits
    cands.sort((a, b) => formal(a) - formal(b) || (STYLE_BY_ID[a.styleId].role === 'A' ? -1 : 0) - (STYLE_BY_ID[b.styleId].role === 'A' ? -1 : 0) || (used[b.colorId] ?? 0) - (used[a.colorId] ?? 0));
    const pick = cands[0];
    if (pick && (used[pick.colorId] ?? 0) >= 2) {
      used[pick.colorId]--; usedCat['tops' + pick.colorId] = Math.max(0, (usedCat['tops' + pick.colorId] ?? 1) - 1);
      pick.colorId = acc; pick.id = `${pick.styleId}~${acc}`; used[acc] = 1;
    }
  }
  // shoes: pick the footwear color that goes with the most bottoms; vary across the shoe row
  const bottoms = pieces.filter((p) => STYLE_BY_ID[p.styleId].cat === 'bottoms');
  const shoeUsed: Record<string, number> = {};
  pieces.filter((p) => p.pinned && isShoeStyle(p.styleId)).forEach((p) => (shoeUsed[p.colorId] = (shoeUsed[p.colorId] ?? 0) + 1));
  for (const slot of slotsByCat.shoes) {
    if (slot.pin) continue;
    const opts = FOOTWEAR_ALLOWED[slot.style.id] ?? [];
    const sameStyle = pieces.filter((p) => p.styleId === slot.style.id).map((p) => p.colorId);
    let best = opts[0], bestScore = -Infinity;
    for (const f of opts) {
      const goes = bottoms.filter((b) => footwearGoesWith(f, b.colorId)).length;
      const score = goes * 10 - (shoeUsed[f] ?? 0) * 8 - (sameStyle.includes(f) ? 50 : 0) - (f === 'f-oxblood' ? 4 : 0);
      if (score > bestScore) { bestScore = score; best = f; }
    }
    pieces.push(mkPiece(slot.style, best)); shoeUsed[best] = (shoeUsed[best] ?? 0) + 1;
  }
  // stable category order
  const order = (p: CapsulePiece) => catOrder.indexOf(STYLE_BY_ID[p.styleId].cat);
  pieces.sort((a, b) => order(a) - order(b));
  return { pieces };
}
export const colorIsAccent = (id: string) => COLOR_BY_ID[id]?.role === 'accent';
