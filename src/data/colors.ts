export type Role = 'neutral' | 'base' | 'accent';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';
export interface Color {
  id: string; name: string; hex: string; role: Role;
  tone: 'warm' | 'cool' | 'neutral'; depth: 'light' | 'mid' | 'deep'; seasons: Season[]; hue: string;
}
const A: Season[] = ['spring', 'summer', 'fall', 'winter'];
const s = (x: string): Season[] => x.split(' ').map((k) => ({ sp: 'spring', su: 'summer', fa: 'fall', wi: 'winter' } as const)[k as 'sp']);
export const COLORS: Color[] = [
  { id: 'black', name: 'Black', hex: '#1C1C1C', role: 'neutral', tone: 'neutral', depth: 'deep', seasons: A, hue: 'neutral' },
  { id: 'charcoal', name: 'Charcoal', hex: '#444444', role: 'neutral', tone: 'cool', depth: 'deep', seasons: A, hue: 'neutral' },
  { id: 'grey', name: 'Heather grey', hex: '#939393', role: 'neutral', tone: 'cool', depth: 'mid', seasons: A, hue: 'neutral' },
  { id: 'white', name: 'Off-white', hex: '#F7F6F2', role: 'neutral', tone: 'neutral', depth: 'light', seasons: A, hue: 'neutral' },
  { id: 'cream', name: 'Cream', hex: '#F3E0C3', role: 'neutral', tone: 'warm', depth: 'light', seasons: A, hue: 'neutral' },
  { id: 'khaki', name: 'Khaki', hex: '#C3B091', role: 'neutral', tone: 'warm', depth: 'light', seasons: s('sp su fa'), hue: 'neutral' },
  { id: 'navy', name: 'Navy', hex: '#1E2A4A', role: 'neutral', tone: 'cool', depth: 'deep', seasons: A, hue: 'neutral' },
  { id: 'espresso', name: 'Espresso brown', hex: '#583229', role: 'neutral', tone: 'warm', depth: 'deep', seasons: s('sp fa wi'), hue: 'neutral' },
  { id: 'olive', name: 'Olive', hex: '#576047', role: 'base', tone: 'warm', depth: 'mid', seasons: s('sp fa wi'), hue: 'green' },
  { id: 'forest', name: 'Forest green', hex: '#3D5431', role: 'base', tone: 'cool', depth: 'deep', seasons: s('fa wi'), hue: 'green' },
  { id: 'camel', name: 'Camel', hex: '#C19A6B', role: 'base', tone: 'warm', depth: 'mid', seasons: s('sp fa wi'), hue: 'brown' },
  { id: 'slate', name: 'Slate blue', hex: '#505D79', role: 'base', tone: 'cool', depth: 'mid', seasons: A, hue: 'blue' },
  { id: 'lightblue', name: 'Light blue', hex: '#8FA6C0', role: 'base', tone: 'cool', depth: 'light', seasons: s('sp su fa'), hue: 'blue' },
  { id: 'burgundy', name: 'Burgundy', hex: '#6C1B26', role: 'base', tone: 'warm', depth: 'deep', seasons: s('fa wi'), hue: 'red' },
  { id: 'rust', name: 'Rust', hex: '#925842', role: 'base', tone: 'warm', depth: 'mid', seasons: s('su fa'), hue: 'orange' },
  { id: 'sage', name: 'Sage', hex: '#7B8D7A', role: 'base', tone: 'cool', depth: 'mid', seasons: s('sp su fa'), hue: 'green' },
  { id: 'mustard', name: 'Mustard', hex: '#D1A93A', role: 'accent', tone: 'warm', depth: 'mid', seasons: s('su fa wi'), hue: 'yellow' },
  { id: 'burntorange', name: 'Burnt orange', hex: '#C75B2A', role: 'accent', tone: 'warm', depth: 'mid', seasons: s('fa'), hue: 'orange' },
  { id: 'brickred', name: 'Brick red', hex: '#961F25', role: 'accent', tone: 'warm', depth: 'deep', seasons: s('fa wi'), hue: 'red' },
  { id: 'teal', name: 'Teal', hex: '#367D79', role: 'accent', tone: 'cool', depth: 'mid', seasons: A, hue: 'teal' },
  { id: 'cobalt', name: 'Cobalt', hex: '#255586', role: 'accent', tone: 'cool', depth: 'mid', seasons: A, hue: 'blue' },
  { id: 'softpink', name: 'Soft pink', hex: '#EFC4CC', role: 'accent', tone: 'warm', depth: 'light', seasons: s('sp su'), hue: 'pink' },
  { id: 'plum', name: 'Plum', hex: '#58395D', role: 'accent', tone: 'cool', depth: 'deep', seasons: s('fa wi'), hue: 'purple' },
];
export const COLOR_BY_ID: Record<string, Color> = Object.fromEntries(COLORS.map((c) => [c.id, c]));
export const NEUTRALS = COLORS.filter((c) => c.role === 'neutral');
export const BASES = COLORS.filter((c) => c.role === 'base');
export const ACCENTS = COLORS.filter((c) => c.role === 'accent');
export interface Palette { neutrals: string[]; bases: string[]; accents: string[] }
export const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];

export interface Footwear { id: string; name: string; hex: string }
export const FOOTWEAR: Footwear[] = [
  { id: 'f-black', name: 'Black', hex: '#1C1C1C' },
  { id: 'f-brown', name: 'Dark brown', hex: '#4A2C20' },
  { id: 'f-tan', name: 'Tan', hex: '#946844' },
  { id: 'f-oxblood', name: 'Oxblood', hex: '#4A1620' },
  { id: 'f-white', name: 'White', hex: '#F5F4EF' },
  { id: 'f-cream', name: 'Cream', hex: '#EDE4D0' },
  { id: 'f-grey', name: 'Grey', hex: '#9A9A9A' },
];
export const FOOTWEAR_BY_ID: Record<string, Footwear> = Object.fromEntries(FOOTWEAR.map((f) => [f.id, f]));
export const colorName = (id: string) => COLOR_BY_ID[id]?.name ?? FOOTWEAR_BY_ID[id]?.name ?? id;
export const colorHex = (id: string) => COLOR_BY_ID[id]?.hex ?? FOOTWEAR_BY_ID[id]?.hex ?? '#999';
