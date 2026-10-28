import { useEffect, useMemo } from 'react';
import { COLOR_BY_ID, Palette, colorHex, colorName } from '../data/colors';
import { STYLE_BY_ID } from '../data/pieces';
import { useStore } from '../store';

declare global { interface Window { Garments?: { img: (type: string, hex: string) => string } } }
const cache = new Map<string, string>();
export function garmentSrc(silhouette: string, hex: string): string {
  const k = silhouette + hex;
  let v = cache.get(k);
  if (!v) { v = window.Garments ? window.Garments.img(silhouette, hex) : ''; cache.set(k, v); }
  return v;
}
export function Garment({ styleId, colorId, className, alt }: { styleId: string; colorId: string; className?: string; alt?: string }) {
  const st = STYLE_BY_ID[styleId];
  const src = useMemo(() => garmentSrc(styleId, colorHex(colorId)), [styleId, colorId]);
  return <img className={className} src={src} alt={alt ?? `${colorName(colorId)} ${st.name}`} draggable={false} />;
}
export function Dot({ id, size = 14 }: { id: string; size?: number }) {
  return <span className="dot" aria-hidden style={{ background: colorHex(id), width: size, height: size }} />;
}
export const isLight = (hex: string) => {
  const h = hex.replace('#', ''); const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.72;
};

/** Nine-slot palette: Neutrals 2, Base 3, Accents 4. Empty slots are outlined placeholders. */
export function PaletteStrip({ draft, onSwatch, activeKey }: { draft: { neutrals: string[]; bases: string[]; accents: string[] }; onSwatch?: (role: 'neutrals' | 'bases' | 'accents', id: string) => void; activeKey?: string }) {
  const groups: { role: 'neutrals' | 'bases' | 'accents'; label: string; n: number }[] = [
    { role: 'neutrals', label: 'Neutrals', n: 2 }, { role: 'bases', label: 'Base', n: 3 }, { role: 'accents', label: 'Accents', n: 4 },
  ];
  return (
    <div className="palette" data-testid="palette">
      {groups.map((g) => (
        <div className="pgroup" key={g.role}>
          <div className="plabel">{g.label}</div>
          <div className="pslots">
            {Array.from({ length: g.n }).map((_, i) => {
              const id = (draft as Palette)[g.role][i];
              if (!id) return <div key={i} className="slot empty" aria-label={`Empty ${g.label} slot`} />;
              const c = COLOR_BY_ID[id];
              const inner = (<>
                <span className={'sw' + (isLight(c.hex) ? ' light' : '')} style={{ background: c.hex }} />
                <span className="swname">{c.name}</span>
              </>);
              return onSwatch ? (
                <button key={id} className={'slot filled' + (activeKey === id ? ' active' : '')} onClick={() => onSwatch(g.role, id)} aria-label={`${c.name} ${c.hex}. Change color`} data-color={id}>{inner}</button>
              ) : (
                <div key={id} className="slot filled" aria-label={`${c.name} ${c.hex}`} data-color={id}>{inner}</div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Toast() {
  const toast = useStore((s) => s.toast); const clear = useStore((s) => s.clearToast);
  useEffect(() => { /* auto-dismiss handled in store */ }, [toast]);
  if (!toast) return null;
  return (
    <div className="toast" role="status" aria-live="polite" data-testid="toast">
      <span>{toast.msg}</span>
      {toast.undo && <button onClick={() => { toast.undo!(); clear(); }}>Undo</button>}
      <button className="x" aria-label="Dismiss" onClick={clear}>×</button>
    </div>
  );
}
