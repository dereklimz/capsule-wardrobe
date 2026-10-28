import { COLORS } from './colors';
// Curated, symmetric adjacency map (spec 6.2). Neutrals pair with everything, including each other.
const BASE_BASE = 'olive-camel olive-slate olive-lightblue olive-burgundy olive-rust forest-camel forest-burgundy forest-lightblue forest-slate camel-slate camel-lightblue camel-burgundy camel-rust camel-sage slate-lightblue slate-burgundy slate-rust slate-sage lightblue-burgundy lightblue-sage burgundy-sage rust-sage';
const BASE_ACCENT: Record<string, string> = {
  mustard: 'olive camel slate forest lightblue',
  teal: 'camel burgundy rust lightblue slate olive',
  cobalt: 'camel rust olive sage lightblue',
  softpink: 'slate olive forest burgundy lightblue camel sage',
  brickred: 'slate camel olive lightblue',
  burntorange: 'slate lightblue forest olive sage',
  plum: 'camel sage lightblue slate olive',
};
// Accent-to-accent is soft: these pairs get a "may clash" marker, never a block.
const ACCENT_CLASH = 'burntorange-brickred burntorange-softpink brickred-softpink brickred-plum mustard-plum burntorange-plum';

const adj: Record<string, Set<string>> = {};
COLORS.forEach((c) => (adj[c.id] = new Set()));
const link = (a: string, b: string) => { adj[a].add(b); adj[b].add(a); };
const neutrals = COLORS.filter((c) => c.role === 'neutral').map((c) => c.id);
for (const n of neutrals) for (const c of COLORS) if (c.id !== n) link(n, c.id);
BASE_BASE.split(' ').forEach((p) => { const [a, b] = p.split('-'); link(a, b); });
Object.entries(BASE_ACCENT).forEach(([acc, bs]) => bs.split(' ').forEach((b) => link(acc, b)));

export const COMPAT: Record<string, string[]> = Object.fromEntries(Object.entries(adj).map(([k, v]) => [k, [...v]]));
export const compatible = (a: string, b: string): boolean => a === b || adj[a]?.has(b) === true;
const clash = new Set(ACCENT_CLASH.split(' ').flatMap((p) => { const [a, b] = p.split('-'); return [`${a}|${b}`, `${b}|${a}`]; }));
export const accentsMayClash = (a: string, b: string) => clash.has(`${a}|${b}`);
