import { Season } from './colors';
export interface Activity { id: string; label: string; time: 'day' | 'night'; formality: [number, number]; tags: string[]; vibe: string; seasons: Season[] | 'all' }
const A = (id: string, label: string, time: 'day' | 'night', f: [number, number], tags: string, vibe: string, seasons: Activity['seasons'] = 'all'): Activity =>
  ({ id, label, time, formality: f, tags: tags.split(', '), vibe, seasons });
export const ACTIVITIES: Activity[] = [
  A('museums', 'Museums & galleries', 'day', [2, 3], 'artsy, classic', 'Considered, a little creative'),
  A('brunch', 'Brunch & café dates', 'day', [2, 3], 'polished-casual, relaxed', 'Effortless and put together'),
  A('office', 'Creative or business office', 'day', [3, 4], 'tailored, classic', 'Sharp, understated'),
  A('outdoors', 'Hiking & the outdoors', 'day', [1, 1], 'rugged, sporty', 'Practical and weathered', ['spring', 'summer', 'fall']),
  A('markets', 'Markets & city wandering', 'day', [1, 2], 'relaxed, urban', 'Comfortable, street-smart'),
  A('resort', 'Beach & resort days', 'day', [1, 2], 'resort, relaxed', 'Breezy and sunlit', ['spring', 'summer']),
  A('nice-dinner', 'Nice dinners & dates', 'night', [4, 4], 'refined, classic', 'Elevated and intimate'),
  A('nightclubs', 'Nightclubs', 'night', [3, 4], 'bold, edgy', 'Sharp with attitude'),
  A('shows', 'Concerts & live shows', 'night', [2, 3], 'edgy, relaxed', 'Comfortable with an edge'),
  A('cocktail-bars', 'Cocktail bars', 'night', [3, 3], 'polished-casual, urban', 'Smart but loose'),
  A('theater', 'Theater & opera', 'night', [4, 5], 'refined, tailored', 'Formal and polished'),
  A('wine-jazz', 'Wine bars & jazz clubs', 'night', [3, 3], 'artsy, refined', 'Moody and cultured'),
  A('rooftop', 'Rooftops & summer evenings', 'night', [2, 3], 'resort, polished-casual', 'Light and social', ['spring', 'summer']),
];
export const ACTIVITY_BY_ID = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]));
export const activitiesFor = (season: Season) => ACTIVITIES.filter((a) => a.seasons === 'all' || a.seasons.includes(season));
