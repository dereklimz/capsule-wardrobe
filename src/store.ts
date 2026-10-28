import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { activitiesFor } from './data/activities';
import { Palette, Season } from './data/colors';
import { STYLE_BY_ID } from './data/pieces';
import { CapsulePiece, availableStyles, colorsFor, fabricFor, generateCapsule, pieceValid } from './logic/capsule';
import { Draft, cleanDraft, emptyDraft, swapOptions, validatePalette } from './logic/gating';
import { Outfit, generateOutfits } from './logic/outfits';

export type Wardrobe = 'men' | 'women' | 'both' | null;
export interface SeasonCapsule {
  palette: Palette; activityIds: string[]; excluded: string[]; included: string[]; pins: CapsulePiece[];
  pieces: CapsulePiece[]; outfits: Outfit[]; seed: number; stale: boolean;
}
export function defaultSeason(hemisphere: 'north' | 'south', d = new Date()): Season {
  const m = d.getMonth(); // 0-11
  const north: Season = m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'fall' : 'winter';
  if (hemisphere === 'north') return north;
  return ({ spring: 'fall', summer: 'winter', fall: 'spring', winter: 'summer' } as const)[north];
}
const flip = (h: 'north' | 'south') => (h === 'north' ? 'south' : 'north');

export interface State {
  screen: 'choose' | 'capsule';
  hemisphere: 'north' | 'south';
  season: Season;
  wardrobe: Wardrobe;
  draft: Draft;
  activityIds: string[];
  capsules: Partial<Record<Season, SeasonCapsule>>;
  saved: string[];
  toast: { msg: string; undo?: () => void } | null;
  setHemisphere: (h: 'north' | 'south') => void;
  setSeason: (s: Season) => void;
  setWardrobe: (w: Wardrobe) => void;
  setDraft: (d: Draft) => void;
  applyPalette: (p: Palette) => void;
  toggleActivity: (id: string) => void;
  generate: () => void;
  goChoose: () => void;
  selectSeasonOnCapsule: (s: Season) => void;
  toggleStyle: (styleId: string) => boolean;
  swapPiece: (pieceId: string, styleId: string, colorId: string) => void;
  swapPaletteColor: (role: 'neutrals' | 'bases' | 'accents', from: string, to: string) => boolean;
  shuffle: () => void;
  toggleSaved: (id: string) => void;
  showToast: (msg: string, undo?: () => void) => void;
  clearToast: () => void;
  reset: () => void;
}

const isComplete = (d: Draft): d is Palette => d.neutrals.length === 2 && d.bases.length === 3 && d.accents.length === 4;

function build(s: { season: Season; palette: Palette; activityIds: string[]; excluded: string[]; included: string[]; pins: CapsulePiece[]; seed: number }): SeasonCapsule {
  const acts = s.activityIds.filter((id) => activitiesFor(s.season).some((a) => a.id === id));
  const { pieces } = generateCapsule({ season: s.season, palette: s.palette, activityIds: acts, excluded: s.excluded, included: s.included, pins: s.pins });
  return { palette: s.palette, activityIds: acts, excluded: s.excluded, included: s.included, pins: pieces.filter((p) => p.pinned),
    pieces, outfits: generateOutfits(pieces, s.season, acts, s.seed), seed: s.seed, stale: false };
}

const initialHemisphere = 'north' as const;
const init = () => ({
  screen: 'choose' as const, hemisphere: initialHemisphere, season: defaultSeason(initialHemisphere), wardrobe: null as Wardrobe,
  draft: emptyDraft(), activityIds: [] as string[], capsules: {} as State['capsules'], saved: [] as string[], toast: null as State['toast'],
});

export const useStore = create<State>()(persist((set, get) => ({
  ...init(),
  setHemisphere: (h) => set((st) => ({ hemisphere: h, season: st.capsules[st.season] ? st.season : defaultSeason(h) })),
  setSeason: (season) => set((st) => {
    // Activities that do not apply to the new season are dropped.
    const ok = new Set(activitiesFor(season).map((a) => a.id));
    return { season, activityIds: st.activityIds.filter((id) => ok.has(id)) };
  }),
  setWardrobe: (wardrobe) => set({ wardrobe }),
  setDraft: (d) => {
    const { draft, removed } = cleanDraft(d);
    set({ draft });
    if (removed.length) get().showToast(`Removed ${removed.length} pick${removed.length > 1 ? 's' : ''} that no longer match.`, () => set({ draft: d }));
  },
  applyPalette: (p) => set({ draft: { neutrals: [...p.neutrals], bases: [...p.bases], accents: [...p.accents] } }),
  toggleActivity: (id) => set((st) => ({ activityIds: st.activityIds.includes(id) ? st.activityIds.filter((x) => x !== id) : [...st.activityIds, id] })),
  generate: () => {
    const st = get();
    if (!isComplete(st.draft) || st.wardrobe !== 'men' || st.activityIds.length < 2) return;
    const prev = st.capsules[st.season];
    const palette: Palette = { neutrals: [...st.draft.neutrals], bases: [...st.draft.bases], accents: [...st.draft.accents] };
    const cap = build({ season: st.season, palette, activityIds: st.activityIds, excluded: prev?.excluded ?? [], included: prev?.included ?? [],
      pins: (prev?.pins ?? []).filter((p) => pieceValid(p, st.season, palette)), seed: prev ? prev.seed : 1 });
    set({ capsules: { ...st.capsules, [st.season]: cap }, screen: 'capsule', toast: null });
  },
  goChoose: () => set((st) => {
    const cap = st.capsules[st.season];
    return { screen: 'choose', draft: cap ? { ...cap.palette } : st.draft, activityIds: cap ? cap.activityIds : st.activityIds };
  }),
  selectSeasonOnCapsule: (season) => {
    const st = get();
    const acts = st.activityIds.filter((id) => activitiesFor(season).some((a) => a.id === id));
    if (st.capsules[season]) { set({ season }); return; }
    const src = st.capsules[st.season];
    if (!src) { set({ season }); return; }
    const need = acts.length >= 2 ? acts : activitiesFor(season).filter((a) => src.activityIds.includes(a.id)).map((a) => a.id);
    const useActs = need.length >= 2 ? need : activitiesFor(season).slice(0, 2).map((a) => a.id);
    const cap = build({ season, palette: src.palette, activityIds: useActs, excluded: [], included: [], pins: [], seed: 1 });
    set({ season, activityIds: cap.activityIds, capsules: { ...st.capsules, [season]: cap } });
  },
  toggleStyle: (styleId) => {
    const st = get(); const cap = st.capsules[st.season]; if (!cap) return false;
    const style = STYLE_BY_ID[styleId];
    const isOff = cap.excluded.includes(styleId);
    if (!isOff) {
      const sameCat = availableStyles(st.season, cap.palette).filter((s) => s.cat === style.cat && !cap.excluded.includes(s.id));
      if (sameCat.length <= 1) { get().showToast(`Keep at least one ${style.cat === 'shoes' ? 'shoe' : style.cat.replace(/s$/, '')} style on.`); return false; }
    }
    const excluded = isOff ? cap.excluded.filter((x) => x !== styleId) : [...cap.excluded, styleId];
    const included = isOff ? [...cap.included, styleId] : cap.included.filter((x) => x !== styleId);
    const pins = cap.pins.filter((p) => p.styleId !== styleId);
    set({ capsules: { ...st.capsules, [st.season]: build({ season: st.season, palette: cap.palette, activityIds: cap.activityIds, excluded, included, pins, seed: cap.seed }) } });
    return true;
  },
  swapPiece: (pieceId, styleId, colorId) => {
    const st = get(); const cap = st.capsules[st.season]; if (!cap) return;
    const style = STYLE_BY_ID[styleId];
    if (!style || !colorsFor(style, cap.palette).includes(colorId)) return;
    const fabric = fabricFor(style, st.season); if (!fabric) return;
    const others = cap.pieces.filter((p) => p.id !== pieceId);
    let id = `${styleId}~${colorId}~pin`; let n = 2;
    while (others.some((p) => p.id === id)) id = `${styleId}~${colorId}~pin${n++}`;
    const next: CapsulePiece = { id, styleId, colorId, fabricId: fabric, pinned: true };
    const pieces = cap.pieces.map((p) => (p.id === pieceId ? next : p));
    set({ capsules: { ...st.capsules, [st.season]: { ...cap, pieces, pins: pieces.filter((p) => p.pinned),
      outfits: generateOutfits(pieces, st.season, cap.activityIds, cap.seed) } } });
  },
  swapPaletteColor: (role, from, to) => {
    const st = get(); const cap = st.capsules[st.season]; if (!cap) return false;
    if (!swapOptions(cap.palette, role, from).includes(to)) return false;
    const palette = { ...cap.palette, [role]: cap.palette[role].map((x) => (x === from ? to : x)) } as Palette;
    if (!validatePalette(palette)) return false;
    const pins = cap.pins.map((p) => (p.colorId === from ? { ...p, colorId: to } : p)).filter((p) => pieceValid(p, st.season, palette));
    set({ draft: palette, capsules: { ...st.capsules, [st.season]: build({ season: st.season, palette, activityIds: cap.activityIds, excluded: cap.excluded, included: cap.included, pins, seed: cap.seed }) } });
    return true;
  },
  shuffle: () => {
    const st = get(); const cap = st.capsules[st.season]; if (!cap) return;
    const seed = cap.seed + 1;
    set({ capsules: { ...st.capsules, [st.season]: { ...cap, seed, outfits: generateOutfits(cap.pieces, st.season, cap.activityIds, seed) } } });
  },
  toggleSaved: (id) => set((st) => ({ saved: st.saved.includes(id) ? st.saved.filter((x) => x !== id) : [...st.saved, id] })),
  showToast: (msg, undo) => { set({ toast: { msg, undo } }); setTimeout(() => { if (get().toast?.msg === msg) set({ toast: null }); }, 6000); },
  clearToast: () => set({ toast: null }),
  reset: () => set({ ...init() }),
}), {
  name: 'capsule-wardrobe:v1', version: 1,
  migrate: (persisted) => persisted as State, // stub: add migrations here when the shape changes
  partialize: (s) => ({ hemisphere: s.hemisphere, season: s.season, wardrobe: s.wardrobe, draft: s.draft, activityIds: s.activityIds, capsules: s.capsules, saved: s.saved, screen: s.screen }) as State,
}));
export { flip };
