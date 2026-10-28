import { Season } from './colors';
export type Category = 'tops' | 'sweaters' | 'outerwear' | 'bottoms' | 'shoes';
export const CATEGORIES: { id: Category; label: string; quota: number }[] = [
  { id: 'tops', label: 'Tops', quota: 6 }, { id: 'sweaters', label: 'Sweaters', quota: 4 },
  { id: 'outerwear', label: 'Outerwear', quota: 2 }, { id: 'bottoms', label: 'Bottoms', quota: 5 }, { id: 'shoes', label: 'Shoes', quota: 4 },
];
export interface Style {
  id: string; name: string; cat: Category; seasons: Season[]; fabrics: string[]; formality: [number, number];
  tags: string[]; role: 'K' | 'B' | 'A'; silhouette: string; allowed: string[] | 'all'; womenOnly?: boolean;
}
const S = (x: string): Season[] => x === 'all' ? ['spring', 'summer', 'fall', 'winter'] : x.split(' ').map((k) => ({ sp: 'spring', su: 'summer', fa: 'fall', wi: 'winter' } as const)[k as 'sp']);
const L = (x: string) => x.split(' ');
const mk = (id: string, name: string, cat: Category, seasons: string, fabrics: string, f: [number, number], tags: string, role: 'K' | 'B' | 'A', silhouette: string, allowed: string | 'all'): Style =>
  ({ id, name, cat, seasons: S(seasons), fabrics: fabrics.split(', '), formality: f, tags: tags.split(', '), role, silhouette, allowed: allowed === 'all' ? 'all' : L(allowed) });

// Men's catalog (spec 8.2) with the color feasibility lists from 8.4. Footwear is handled separately (FOOTWEAR_ALLOWED).
export const STYLES: Style[] = [
  mk('tshirt', 'T-shirt', 'tops', 'sp su fa', 'cotton, knit-cotton', [1, 2], 'relaxed, sporty', 'B', 'tee', 'all'),
  mk('vneck-tee', 'V-neck tee', 'tops', 'sp su fa', 'cotton, knit-cotton', [1, 2], 'relaxed, classic', 'B', 'v-neck tee', 'all'),
  mk('polo', 'Polo', 'tops', 'sp su fa', 'pique, knit-cotton, linen-blend', [2, 3], 'polished-casual, classic', 'B', 'polo', 'black charcoal grey white cream khaki navy espresso olive forest camel slate lightblue burgundy rust sage mustard brickred teal cobalt softpink'),
  mk('henley', 'Henley', 'tops', 'sp fa wi', 'waffle-cotton, cotton', [1, 2], 'relaxed, rugged', 'B', 'henley', 'black charcoal grey white cream khaki navy espresso olive forest camel slate lightblue burgundy rust sage mustard burntorange brickred teal cobalt'),
  mk('camp-shirt', 'Camp-collar shirt', 'tops', 'sp su', 'linen, linen-blend, silk', [2, 3], 'resort, artsy', 'A', 'oxford', 'white cream khaki navy olive camel sage slate lightblue rust burgundy mustard burntorange teal cobalt softpink plum'),
  mk('oxford', 'Oxford shirt', 'tops', 'sp fa wi', 'oxford', [2, 4], 'classic, polished-casual', 'B', 'oxford', 'white cream grey lightblue slate softpink mustard navy burgundy olive'),
  mk('dress-shirt', 'Dress shirt', 'tops', 'all', 'poplin', [4, 5], 'tailored, refined', 'B', 'dress shirt', 'white cream grey lightblue softpink slate mustard navy charcoal burgundy black'),
  mk('crew-knit', 'Crewneck sweater', 'sweaters', 'sp fa wi', 'merino, cashmere, knit-cotton', [2, 3], 'classic, relaxed', 'B', 'sweater', 'all'),
  mk('vneck-knit', 'V-neck sweater', 'sweaters', 'sp fa wi', 'merino, cashmere, wool', [2, 4], 'classic, tailored', 'B', 'sweater', 'black charcoal grey white cream khaki navy espresso olive forest camel slate lightblue burgundy rust sage mustard brickred teal cobalt softpink'),
  mk('turtleneck', 'Turtleneck', 'sweaters', 'sp fa wi', 'merino, cashmere', [3, 4], 'refined, artsy', 'B', 'sweater', 'black charcoal grey cream navy espresso olive forest camel slate burgundy rust sage'),
  mk('cardigan', 'Cardigan', 'sweaters', 'sp fa wi', 'merino, knit-cotton', [2, 3], 'classic, relaxed', 'B', 'sweater', 'black charcoal grey cream khaki navy espresso olive forest camel slate burgundy rust sage'),
  mk('blazer', 'Blazer', 'outerwear', 'sp fa wi su', 'wool-light, wool, linen-blend', [3, 5], 'tailored, classic', 'K', 'blazer', 'navy charcoal grey khaki camel olive espresso cream black'),
  mk('overshirt', 'Overshirt', 'outerwear', 'sp fa', 'cotton-twill, flannel, canvas', [1, 3], 'rugged, relaxed', 'K', 'overshirt', 'black charcoal grey cream khaki navy espresso olive forest camel slate lightblue burgundy rust sage mustard'),
  mk('trench', 'Trench coat', 'outerwear', 'sp fa', 'cotton-twill', [3, 4], 'classic, tailored', 'K', 'blazer', 'khaki camel navy black olive'),
  mk('denim-jacket', 'Denim jacket', 'outerwear', 'sp fa', 'denim', [1, 2], 'relaxed, urban', 'K', 'overshirt', 'lightblue slate navy black charcoal white cream'),
  mk('bomber', 'Bomber', 'outerwear', 'sp fa', 'nylon, wool', [1, 3], 'edgy, sporty', 'K', 'overshirt', 'black charcoal navy olive forest espresso camel burgundy khaki grey'),
  mk('leather-jacket', 'Leather jacket', 'outerwear', 'sp fa wi', 'leather', [2, 4], 'edgy, bold', 'K', 'blazer', 'black espresso camel rust'),
  mk('wool-coat', 'Wool overcoat', 'outerwear', 'fa wi', 'wool, cashmere', [3, 5], 'tailored, refined', 'K', 'blazer', 'charcoal grey navy camel black espresso olive'),
  mk('puffer', 'Puffer', 'outerwear', 'wi', 'down, nylon', [1, 2], 'sporty, rugged', 'K', 'overshirt', 'black charcoal grey navy olive forest camel burgundy slate khaki'),
  mk('light-jacket', 'Light jacket', 'outerwear', 'su sp', 'nylon, cotton-twill', [1, 2], 'sporty, relaxed', 'K', 'overshirt', 'black charcoal grey khaki navy olive camel slate lightblue sage'),
  mk('jeans', 'Jeans', 'bottoms', 'all', 'denim', [1, 3], 'relaxed, rugged, urban', 'K', 'jeans', 'lightblue slate navy black charcoal white cream'),
  mk('chinos', 'Chinos', 'bottoms', 'all', 'cotton-twill', [2, 3], 'classic, polished-casual', 'K', 'chinos', 'khaki cream navy olive grey charcoal black camel espresso forest lightblue'),
  mk('trousers', 'Tailored trousers', 'bottoms', 'all', 'wool-light, wool, cotton-twill', [3, 5], 'tailored, refined', 'K', 'trousers', 'charcoal grey navy black khaki cream camel espresso olive slate'),
  mk('linen-pants', 'Linen trousers', 'bottoms', 'sp su', 'linen, linen-blend', [2, 3], 'resort, relaxed', 'K', 'trousers', 'white cream khaki camel navy olive sage lightblue grey'),
  mk('shorts', 'Shorts', 'bottoms', 'su sp', 'cotton-twill, linen', [1, 2], 'relaxed, resort', 'K', 'chinos', 'khaki navy olive cream white grey camel sage slate lightblue black charcoal'),
  mk('cords', 'Corduroy pants', 'bottoms', 'fa wi', 'corduroy', [2, 3], 'artsy, classic', 'K', 'chinos', 'camel khaki espresso olive forest rust navy charcoal grey cream mustard burgundy'),
  mk('leather-pants', 'Leather pants', 'bottoms', 'sp fa wi', 'leather', [3, 4], 'edgy, bold', 'K', 'trousers', 'black espresso'),
  mk('sneakers', 'Sneakers', 'shoes', 'all', 'leather, canvas', [1, 3], 'relaxed, urban', 'K', 'sneakers', 'all'),
  mk('loafers', 'Loafers', 'shoes', 'sp su fa', 'leather, suede', [3, 4], 'classic, polished-casual', 'K', 'loafers', 'all'),
  mk('dress-shoes', 'Dress shoes', 'shoes', 'all', 'leather', [4, 5], 'tailored, refined', 'K', 'dressshoes', 'all'),
  mk('chelsea-boots', 'Chelsea boots', 'shoes', 'sp fa wi', 'leather, suede', [2, 4], 'edgy, refined', 'K', 'chelsea', 'all'),
  mk('sandals', 'Sandals', 'shoes', 'su sp', 'leather', [1, 2], 'resort, relaxed', 'K', 'loafers', 'all'),
  mk('hiking-boots', 'Hiking boots', 'shoes', 'sp fa wi', 'leather, nylon', [1, 1], 'rugged, sporty', 'K', 'chelsea', 'all'),
];
export const STYLE_BY_ID: Record<string, Style> = Object.fromEntries(STYLES.map((s) => [s.id, s]));

// Footwear colors allowed per shoe style (spec 8.3 and 8.4). Oxblood never on boots or sneakers.
export const FOOTWEAR_ALLOWED: Record<string, string[]> = {
  sneakers: ['f-white', 'f-cream', 'f-grey', 'f-black'],
  loafers: ['f-black', 'f-brown', 'f-tan', 'f-oxblood'],
  'dress-shoes': ['f-black', 'f-brown', 'f-tan', 'f-oxblood'],
  'chelsea-boots': ['f-black', 'f-brown', 'f-tan'],
  sandals: ['f-tan', 'f-brown', 'f-black'],
  'hiking-boots': ['f-brown', 'f-tan', 'f-black'],
};
const dark = 'black charcoal navy espresso olive forest burgundy slate rust';
const light = 'white cream khaki lightblue grey sage camel';
const FOOT_BOTTOMS: Record<string, string> = {
  'f-black': 'black charcoal grey navy slate white cream lightblue',
  'f-brown': 'navy olive khaki camel lightblue slate cream white grey charcoal forest burgundy sage',
  'f-tan': 'navy olive khaki lightblue slate cream white grey forest sage burgundy',
  'f-oxblood': 'navy charcoal grey slate khaki olive',
  'f-white': dark + ' ' + light,
  'f-cream': dark + ' ' + light,
  'f-grey': light + ' navy black charcoal',
};
export const footwearGoesWith = (footId: string, bottomColorId: string) => FOOT_BOTTOMS[footId]?.split(' ').includes(bottomColorId) ?? false;
export const isShoe = (s: Style) => s.cat === 'shoes';
