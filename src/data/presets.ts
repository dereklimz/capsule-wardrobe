import { Palette, Season } from './colors';
export interface Preset { id: string; name: string; palette: Palette; seasons: Season[] }
const p = (n: string, b: string, a: string): Palette => ({ neutrals: n.split(' '), bases: b.split(' '), accents: a.split(' ') });
export const PRESETS: Preset[] = [
  { id: 'quiet-luxe', name: 'Quiet Luxe', palette: p('cream charcoal', 'camel slate burgundy', 'softpink teal plum mustard'), seasons: ['fall', 'winter', 'spring'] },
  { id: 'coastal', name: 'Coastal', palette: p('white navy', 'lightblue slate sage', 'softpink mustard teal cobalt'), seasons: ['summer', 'spring'] },
  { id: 'earthy', name: 'Earthy', palette: p('cream espresso', 'olive camel rust', 'mustard teal cobalt softpink'), seasons: ['fall', 'spring', 'summer'] },
  { id: 'city-dark', name: 'City Dark', palette: p('charcoal white', 'slate burgundy olive', 'softpink mustard teal brickred'), seasons: ['winter', 'fall'] },
  { id: 'soft-casual', name: 'Soft Casual', palette: p('cream grey', 'sage lightblue camel', 'softpink teal burntorange plum'), seasons: ['spring', 'summer'] },
  { id: 'autumn-heritage', name: 'Autumn Heritage', palette: p('khaki navy', 'olive camel burgundy', 'mustard teal cobalt softpink'), seasons: ['fall', 'winter'] },
];
export const presetsFor = (season: Season) =>
  [...PRESETS].sort((a, b) => Number(b.seasons.includes(season)) - Number(a.seasons.includes(season)));
