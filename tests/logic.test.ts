import { describe, expect, it } from 'vitest';
import { ACTIVITIES, activitiesFor } from '../src/data/activities';
import { ACCENTS, BASES, COLORS, NEUTRALS, SEASONS, Palette, Season } from '../src/data/colors';
import { compatible } from '../src/data/compat';
import { VALID_FABRICS } from '../src/data/fabrics';
import { PRESETS } from '../src/data/presets';
import { STYLES, STYLE_BY_ID } from '../src/data/pieces';
import { accentGate, baseGate, canComplete, cleanDraft, emptyDraft, neutralGate, suggestAccents, swapOptions, validatePalette } from '../src/logic/gating';
import { colorsFor, generateCapsule } from '../src/logic/capsule';
import { generateOutfits } from '../src/logic/outfits';
import { mulberry32 } from '../src/logic/rng';

const HARD_WINTER_BAN = ['linen', 'linen-blend', 'seersucker', 'pique'];
const HARD_SUMMER_BAN = ['cashmere', 'flannel', 'corduroy', 'tweed', 'shearling', 'down'];

describe('palette rules', () => {
  it('every preset passes validatePalette', () => PRESETS.forEach((p) => expect(validatePalette(p.palette), p.name).toBe(true)));
  it('neutrals are compatible with every color, including each other', () => {
    for (const n of NEUTRALS) for (const c of COLORS) expect(compatible(n.id, c.id)).toBe(true);
  });
  it('compat map is symmetric', () => { for (const a of COLORS) for (const b of COLORS) expect(compatible(a.id, b.id)).toBe(compatible(b.id, a.id)); });
  it("burgundy and mustard, the article's own counterexample, do not pair", () => expect(compatible('burgundy', 'mustard')).toBe(false));
  it('randomized gating sweep only ever produces valid palettes, and never dead-ends', () => {
    const rand = mulberry32(42);
    for (let run = 0; run < 150; run++) {
      let d = emptyDraft();
      const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];
      while (d.neutrals.length < 2) { const o = NEUTRALS.filter((c) => neutralGate(c.id, d).enabled && !d.neutrals.includes(c.id)); expect(o.length).toBeGreaterThan(0); d = { ...d, neutrals: [...d.neutrals, pick(o).id] }; }
      while (d.bases.length < 3) { const o = BASES.filter((c) => baseGate(c.id, d).enabled && !d.bases.includes(c.id)); expect(o.length, JSON.stringify(d)).toBeGreaterThan(0); d = { ...d, bases: [...d.bases, pick(o).id] }; }
      while (d.accents.length < 4) { const o = ACCENTS.filter((c) => accentGate(c.id, d).enabled && !d.accents.includes(c.id)); expect(o.length, JSON.stringify(d)).toBeGreaterThan(0); d = { ...d, accents: [...d.accents, pick(o).id] }; }
      expect(validatePalette(d)).toBe(true);
    }
  });
  it('lookahead: any valid first neutral can be completed', () => NEUTRALS.forEach((n) => { if (neutralGate(n.id, emptyDraft()).enabled) expect(canComplete({ ...emptyDraft(), neutrals: [n.id] })).toBe(true); }));
  it('at least one first neutral is enabled and gating disables colors that clash', () => {
    const d = { neutrals: ['cream', 'charcoal'], bases: ['olive'], accents: [] };
    expect(baseGate('camel', d).enabled).toBe(true);
    expect(baseGate('forest', d).enabled).toBe(false);
    expect(baseGate('lightblue', d).enabled).toBe(true);
    expect(baseGate('rust', d).enabled).toBe(true);
    const d2 = { neutrals: ['cream', 'charcoal'], bases: ['burgundy'], accents: [] };
    expect(baseGate('rust', d2).enabled).toBe(false);
    expect(baseGate('rust', d2).reason).toMatch(/Clashes with Burgundy/);
  });
  it('suggested accents complete a valid palette for every preset base set', () => {
    for (const p of PRESETS) {
      const acc = suggestAccents(p.palette.neutrals, p.palette.bases, 'fall');
      expect(acc).toHaveLength(4);
      expect(validatePalette({ ...p.palette, accents: acc }), p.name).toBe(true);
    }
  });
  it('swap options only offer colors that keep the palette valid', () => {
    for (const p of PRESETS) for (const role of ['neutrals', 'bases', 'accents'] as const) for (const cur of p.palette[role])
      for (const o of swapOptions(p.palette, role, cur)) expect(validatePalette({ ...p.palette, [role]: p.palette[role].map((x) => (x === cur ? o : x)) })).toBe(true);
  });
  it('cleanDraft removes picks that became invalid', () => {
    const { draft, removed } = cleanDraft({ neutrals: ['cream', 'charcoal'], bases: ['olive', 'camel', 'burgundy'], accents: ['mustard', 'teal', 'cobalt', 'softpink'] });
    expect(validatePalette(draft)).toBe(true); expect(removed).toHaveLength(0);
    const r = cleanDraft({ neutrals: ['cream', 'charcoal'], bases: ['burgundy', 'rust', 'olive'], accents: [] });
    expect(r.removed).toContain('rust');
  });
});

describe('capsule and outfits', () => {
  for (const season of SEASONS) {
    for (const preset of PRESETS) {
      it(`${season} / ${preset.name}: season-correct fabrics, color feasibility, >=6 outfits per occasion`, () => {
        const acts = activitiesFor(season).map((a) => a.id);
        const { pieces } = generateCapsule({ season, palette: preset.palette, activityIds: acts, excluded: [], included: [], pins: [] });
        expect(pieces.length).toBeGreaterThan(10);
        for (const p of pieces) {
          const st = STYLE_BY_ID[p.styleId];
          expect(VALID_FABRICS[season], `${p.styleId} ${p.fabricId}`).toContain(p.fabricId);
          if (season === 'winter') expect(HARD_WINTER_BAN).not.toContain(p.fabricId);
          if (season === 'summer') expect(HARD_SUMMER_BAN).not.toContain(p.fabricId);
          expect(st.seasons).toContain(season);
          expect(colorsFor(st, preset.palette), `${st.id} cannot be ${p.colorId}`).toContain(p.colorId);
        }
        const outfits = generateOutfits(pieces, season, acts, 1);
        const ids = new Set(pieces.map((p) => p.id));
        for (const a of acts) {
          const list = outfits.filter((o) => o.activityId === a);
          expect(list.length, `${season}/${preset.name}/${a}`).toBeGreaterThanOrEqual(6);
          for (const o of list) {
            o.pieceIds.forEach((id) => expect(ids.has(id)).toBe(true));
            const ps = o.pieceIds.map((id) => pieces.find((p) => p.id === id)!);
            const cols = ps.filter((p) => STYLE_BY_ID[p.styleId].cat !== 'shoes').map((p) => p.colorId);
            expect(new Set(cols.filter((c) => COLORS.find((x) => x.id === c)!.role === 'accent')).size).toBeLessThanOrEqual(1);
            for (const x of cols) for (const y of cols) expect(compatible(x, y)).toBe(true);
          }
        }
      });
    }
  }
  it('never makes an orange oxford, teal oxford or burgundy chinos', () => {
    for (const color of COLORS) {
      if (!['burntorange', 'teal', 'brickred', 'cobalt', 'plum'].includes(color.id)) continue;
      expect(colorsFor(STYLE_BY_ID['oxford'], { neutrals: ['white', 'navy'], bases: ['lightblue', 'slate', 'sage'], accents: ['burntorange', 'teal', 'cobalt', 'plum'] })).not.toContain(color.id);
    }
    expect(colorsFor(STYLE_BY_ID['chinos'], { neutrals: ['khaki', 'navy'], bases: ['olive', 'camel', 'burgundy'], accents: ['mustard', 'teal', 'cobalt', 'softpink'] })).not.toContain('burgundy');
  });
  it('shoes never use palette colors and oxblood never lands on boots or sneakers', () => {
    for (const season of SEASONS) for (const preset of PRESETS) {
      const { pieces } = generateCapsule({ season, palette: preset.palette, activityIds: activitiesFor(season).map((a) => a.id), excluded: [], included: [], pins: [] });
      for (const p of pieces.filter((x) => STYLE_BY_ID[x.styleId].cat === 'shoes')) {
        expect(p.colorId.startsWith('f-')).toBe(true);
        if (p.colorId === 'f-oxblood') expect(['loafers', 'dress-shoes']).toContain(p.styleId);
      }
    }
  });
  it('excluded styles are respected and pins survive regeneration', () => {
    const palette = PRESETS[5].palette;
    const base = generateCapsule({ season: 'fall', palette, activityIds: ['brunch', 'nice-dinner'], excluded: [], included: [], pins: [] });
    const pin = { ...base.pieces.find((p) => p.styleId === 'oxford')!, colorId: 'navy', pinned: true } as any;
    const again = generateCapsule({ season: 'fall', palette, activityIds: ['brunch', 'nice-dinner'], excluded: ['polo', 'jeans'], included: [], pins: [pin] });
    expect(again.pieces.some((p) => p.styleId === 'polo' || p.styleId === 'jeans')).toBe(false);
    expect(again.pieces.some((p) => p.styleId === 'oxford' && p.colorId === 'navy' && p.pinned)).toBe(true);
  });
  it('different seasons give different capsules', () => {
    const palette = PRESETS[0].palette;
    const a = generateCapsule({ season: 'summer', palette, activityIds: ['brunch', 'rooftop'], excluded: [], included: [], pins: [] }).pieces.map((p) => p.styleId).sort().join();
    const b = generateCapsule({ season: 'winter', palette, activityIds: ['brunch', 'wine-jazz'], excluded: [], included: [], pins: [] }).pieces.map((p) => p.styleId).sort().join();
    expect(a).not.toBe(b);
  });
  it('shuffle (new seed) changes the outfits', () => {
    const palette = PRESETS[2].palette;
    const { pieces } = generateCapsule({ season: 'fall', palette, activityIds: ['brunch'], excluded: [], included: [], pins: [] });
    const a = generateOutfits(pieces, 'fall', ['brunch'], 1).slice(0, 6).map((o) => o.id).join();
    const b = generateOutfits(pieces, 'fall', ['brunch'], 99).slice(0, 6).map((o) => o.id).join();
    expect(a).not.toBe(b);
  });
});
