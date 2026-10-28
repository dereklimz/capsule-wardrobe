import { Season } from './colors';
const f = (x: string) => x.split(', ');
export const VALID_FABRICS: Record<Season, string[]> = {
  summer: f('linen, linen-blend, cotton, pique, poplin, chambray, seersucker, knit-cotton, wool-light, silk, leather, canvas, nylon, cotton-twill, denim'),
  spring: f('linen-blend, cotton, pique, poplin, chambray, knit-cotton, merino, wool-light, oxford, waffle-cotton, silk, leather, suede, canvas, nylon, cotton-twill, denim'),
  fall: f('cotton, poplin, oxford, chambray, knit-cotton, merino, cashmere, wool, wool-light, flannel, corduroy, tweed, waffle-cotton, suede, leather, canvas, nylon, cotton-twill, denim'),
  winter: f('wool, cashmere, merino, flannel, corduroy, tweed, oxford, waffle-cotton, poplin, suede, leather, shearling, down, nylon, cotton-twill, denim, silk'),
};
export const FABRIC_LABEL: Record<string, string> = {
  linen: 'Linen', 'linen-blend': 'Linen blend', cotton: 'Cotton', pique: 'Piqué', poplin: 'Poplin', chambray: 'Chambray',
  seersucker: 'Seersucker', 'knit-cotton': 'Cotton knit', 'wool-light': 'Light wool', silk: 'Silk', leather: 'Leather', canvas: 'Canvas',
  nylon: 'Nylon', 'cotton-twill': 'Cotton twill', denim: 'Denim', merino: 'Merino', oxford: 'Oxford cloth', 'waffle-cotton': 'Waffle cotton',
  suede: 'Suede', cashmere: 'Cashmere', wool: 'Wool', flannel: 'Flannel', corduroy: 'Corduroy', tweed: 'Tweed', shearling: 'Shearling', down: 'Down',
};
