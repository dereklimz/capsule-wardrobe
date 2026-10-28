import { useEffect, useMemo, useRef, useState } from 'react';
import { ACTIVITY_BY_ID } from '../data/activities';
import { COLOR_BY_ID, SEASONS, Season, colorHex, colorName } from '../data/colors';
import { FABRIC_LABEL } from '../data/fabrics';
import { CATEGORIES, STYLE_BY_ID } from '../data/pieces';
import { CapsulePiece, availableStyles, colorsFor } from '../logic/capsule';
import { swapOptions } from '../logic/gating';
import { Outfit } from '../logic/outfits';
import { useStore } from '../store';
import { Dot, Garment, PaletteStrip, isLight } from './ui';

const SEASON_LABEL: Record<Season, string> = { spring: 'Spring', summer: 'Summer', fall: 'Fall', winter: 'Winter' };

function PieceCard({ p, onOpen }: { p: CapsulePiece; onOpen: () => void }) {
  const st = STYLE_BY_ID[p.styleId];
  return (
    <button className={'pcard' + (p.pinned ? ' pinned' : '')} onClick={onOpen} data-testid="piece-card" data-style={p.styleId} data-color={p.colorId}
      aria-label={`${colorName(p.colorId)} ${st.name}, ${FABRIC_LABEL[p.fabricId] ?? p.fabricId}. Change`}>
      <div className="pimg"><Garment styleId={p.styleId} colorId={p.colorId} />{p.pinned && <span className="pin" title="Pinned: regeneration keeps this piece">📌</span>}</div>
      <div className="pname2">{st.name}</div>
      <div className="pmeta"><Dot id={p.colorId} /> {colorName(p.colorId)} · {FABRIC_LABEL[p.fabricId] ?? p.fabricId}</div>
    </button>
  );
}

function PieceDialog({ pieceId, onClose }: { pieceId: string; onClose: () => void }) {
  const s = useStore(); const cap = s.capsules[s.season]!;
  const [id, setId] = useState(pieceId);
  const piece = cap.pieces.find((p) => p.id === id);
  if (!piece) { return null; }
  const style = STYLE_BY_ID[piece.styleId];
  const styles = availableStyles(s.season, cap.palette).filter((x) => x.cat === style.cat);
  const colors = colorsFor(style, cap.palette);
  const apply = (styleId: string, colorId: string) => {
    s.swapPiece(id, styleId, colorId);
    const after = useStore.getState().capsules[s.season]!;
    const idx = cap.pieces.findIndex((p) => p.id === id);
    const nid = after.pieces[idx]?.id; if (nid) setId(nid);
  };
  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div className="dialog" role="dialog" aria-label={`Change ${style.name}`} onClick={(e) => e.stopPropagation()} data-testid="piece-dialog">
        <div className="dialog-h"><b>Change this piece</b><button className="x" onClick={onClose} aria-label="Close">×</button></div>
        <div className="dlg-now"><Garment styleId={piece.styleId} colorId={piece.colorId} className="dlg-img" />
          <div><b>{style.name}</b><div className="pmeta"><Dot id={piece.colorId} /> {colorName(piece.colorId)}</div><div className="fine">Choosing a style or color pins the piece.</div></div></div>
        <div className="dlg-sec">Colors for {style.name.toLowerCase()}</div>
        <div className="dswatches">
          {colors.map((c) => (
            <button key={c} className={'dsw' + (c === piece.colorId ? ' sel' : '')} onClick={() => apply(piece.styleId, c)} aria-label={`${colorName(c)}${c === piece.colorId ? ', current' : ''}`} data-color={c} aria-pressed={c === piece.colorId}>
              <span className={'sw' + (isLight(colorHex(c)) ? ' light' : '')} style={{ background: colorHex(c) }} /><span className="pname">{colorName(c)}</span>
            </button>
          ))}
        </div>
        <div className="dlg-sec">Other styles</div>
        <div className="dstyles">
          {styles.map((x) => {
            const keep = colorsFor(x, cap.palette).includes(piece.colorId) ? piece.colorId : colorsFor(x, cap.palette)[0];
            return (
              <button key={x.id} className={'dst' + (x.id === piece.styleId ? ' sel' : '')} onClick={() => apply(x.id, keep)} aria-pressed={x.id === piece.styleId} data-style={x.id}>
                <Garment styleId={x.id} colorId={keep} /><span>{x.name}</span>
              </button>
            );
          })}
        </div>
        <button className="primary small" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

function PalettePicker({ role, from, onClose }: { role: 'neutrals' | 'bases' | 'accents'; from: string; onClose: () => void }) {
  const s = useStore(); const cap = s.capsules[s.season]!;
  const opts = swapOptions(cap.palette, role, from);
  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div className="dialog narrow" role="dialog" aria-label={`Swap ${colorName(from)}`} onClick={(e) => e.stopPropagation()} data-testid="palette-dialog">
        <div className="dialog-h"><b>Swap {colorName(from)}</b><button className="x" onClick={onClose} aria-label="Close">×</button></div>
        <p className="fine">Only colors that still match the rest of your palette are offered.</p>
        <div className="dswatches">
          {opts.map((c) => (
            <button key={c} className={'dsw' + (c === from ? ' sel' : '')} data-color={c} onClick={() => { if (c !== from) s.swapPaletteColor(role, from, c); onClose(); }} aria-label={`${colorName(c)}${c === from ? ', current' : ''}`}>
              <span className={'sw' + (isLight(colorHex(c)) ? ' light' : '')} style={{ background: colorHex(c) }} /><span className="pname">{colorName(c)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function OutfitCard({ o, pieces, saved, onSave }: { o: Outfit; pieces: CapsulePiece[]; saved: boolean; onSave: () => void }) {
  const ps = o.pieceIds.map((id) => pieces.find((p) => p.id === id)!).filter(Boolean);
  const by = (c: string) => ps.find((p) => STYLE_BY_ID[p.styleId].cat === c);
  const outer = by('outerwear'), sweater = by('sweaters'), top = by('tops'), bottom = by('bottoms'), shoe = by('shoes');
  const upper = sweater ?? top;
  const act = ACTIVITY_BY_ID[o.activityId];
  return (
    <article className="ocard" data-testid="outfit-card" data-activity={o.activityId}>
      <div className="flat">
        {outer && <Garment styleId={outer.styleId} colorId={outer.colorId} className="f-outer" />}
        {upper && <Garment styleId={upper.styleId} colorId={upper.colorId} className={'f-upper' + (outer ? ' withouter' : '')} />}
        {bottom && <Garment styleId={bottom.styleId} colorId={bottom.colorId} className="f-bottom" />}
        {shoe && <Garment styleId={shoe.styleId} colorId={shoe.colorId} className="f-shoe" />}
        <button className={'heart' + (saved ? ' on' : '')} onClick={onSave} aria-pressed={saved} aria-label={saved ? 'Remove from saved' : 'Save outfit'} data-testid="heart">{saved ? '♥' : '♡'}</button>
      </div>
      <div className="obody">
        <div className="otag">{act?.label}</div>
        <div className="olist">{ps.map((p) => <span key={p.id} className="opiece"><Dot id={p.colorId} size={10} />{colorName(p.colorId)} {STYLE_BY_ID[p.styleId].name.toLowerCase()}</span>)}</div>
      </div>
    </article>
  );
}

export function CapsuleScreen() {
  const s = useStore(); const cap = s.capsules[s.season]!;
  const [dlg, setDlg] = useState<string | null>(null);
  const [pal, setPal] = useState<{ role: 'neutrals' | 'bases' | 'accents'; id: string } | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [idx, setIdx] = useState(0);
  const summer = s.season === 'summer';
  const avail = useMemo(() => availableStyles(s.season, cap.palette), [s.season, cap.palette]);

  const interleave = (ids: string[]) => {
    const lists = ids.map((a) => cap.outfits.filter((o) => o.activityId === a));
    const out: Outfit[] = [];
    for (let r = 0; r < 12; r++) for (const l of lists) if (l[r]) out.push(l[r]);
    return out;
  };
  const pool = useMemo(() => {
    const dayIds = cap.activityIds.filter((id) => ACTIVITY_BY_ID[id].time === 'day'), nightIds = cap.activityIds.filter((id) => ACTIVITY_BY_ID[id].time === 'night');
    if (filter === 'all') return interleave(cap.activityIds);
    if (filter === 'day') return interleave(dayIds);
    if (filter === 'night') return interleave(nightIds);
    if (filter === 'saved') return cap.outfits.filter((o) => s.saved.includes(o.id));
    return cap.outfits.filter((o) => o.activityId === filter);
  }, [cap.outfits, cap.activityIds, filter, s.saved]); // eslint-disable-line react-hooks/exhaustive-deps
  const cur = pool.length ? Math.min(idx, pool.length - 1) : 0;
  const go = (d: number) => { if (pool.length) setIdx((cur + d + pool.length) % pool.length); };
  const touch = useRef<number | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (dlg || pal) return;
      const t = e.target as HTMLElement | null; if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  });

  const thin = cap.activityIds.filter((a) => cap.outfits.filter((o) => o.activityId === a).length < 6);
  const setF = (f: string) => { setFilter(f); setIdx(0); };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand"><span className="logo" aria-hidden>◐</span> Capsule</div>
        <button className="ghost" onClick={() => s.goChoose()} data-testid="edit-choices">← Edit choices</button>
        <div className="seasons" role="group" aria-label="Season">
          {SEASONS.map((x) => <button key={x} className={'seg' + (s.season === x ? ' on' : '')} aria-pressed={s.season === x} onClick={() => { s.selectSeasonOnCapsule(x); setF('all'); }} data-testid={`cap-season-${x}`}>{SEASON_LABEL[x]}</button>)}
        </div>
      </header>
      <main className="capsule">
        <section className="block">
          <h2>Your palette</h2>
          <PaletteStrip draft={cap.palette} onSwatch={(role, id) => setPal({ role, id })} />
          <p className="fine">Tap a color to swap it. Only matching colors are offered.</p>
        </section>

        <section className="block">
          <h2>Your {SEASON_LABEL[s.season].toLowerCase()} capsule <span className="count">{cap.pieces.length} pieces</span></h2>
          {CATEGORIES.map((cat) => {
            const items = cap.pieces.filter((p) => STYLE_BY_ID[p.styleId].cat === cat.id);
            const styles = avail.filter((x) => x.cat === cat.id);
            if (styles.length === 0 && items.length === 0) return (
              <div className="row-cat" key={cat.id}><div className="row-h"><b>{cat.label}</b><span className="count">0</span></div><p className="fine">No {cat.label.toLowerCase()} fit this season and palette.</p></div>
            );
            return (
              <div className="row-cat" key={cat.id} data-testid={`cat-${cat.id}`}>
                <div className="row-h"><b>{cat.label}</b><span className="count">{items.length}</span>
                  {summer && (cat.id === 'sweaters' || cat.id === 'outerwear') && <span className="note">Light layers only in summer.</span>}</div>
                <div className="chiprow">
                  {styles.map((x) => {
                    const on = !cap.excluded.includes(x.id);
                    return <button key={x.id} className={'tchip' + (on ? ' on' : '')} aria-pressed={on} onClick={() => s.toggleStyle(x.id)} data-testid={`chip-${x.id}`}>{x.name}</button>;
                  })}
                  {cap.excluded.filter((id) => STYLE_BY_ID[id].cat === cat.id && !styles.some((x) => x.id === id)).length > 0 && null}
                </div>
                <div className="strip">{items.map((p) => <PieceCard key={p.id} p={p} onOpen={() => setDlg(p.id)} />)}</div>
              </div>
            );
          })}
        </section>

        <section className="block" data-testid="outfits">
          <div className="oh">
            <h2>Outfits</h2>
            <button className="ghost" onClick={() => { s.shuffle(); setIdx(0); }} data-testid="shuffle">Shuffle</button>
          </div>
          {thin.length > 0 && <p className="notice" role="note">Fewer than 6 looks for {thin.map((a) => ACTIVITY_BY_ID[a].label).join(', ')}. Turning more styles on helps.</p>}
          <div className="filters" role="group" aria-label="Filter outfits">
            {[['all', 'All'], ['day', 'Day'], ['night', 'Night'], ...cap.activityIds.map((a) => [a, ACTIVITY_BY_ID[a].label]), ['saved', `Saved (${cap.outfits.filter((o) => s.saved.includes(o.id)).length})`]].map(([id, label]) => (
              <button key={id} className={'tchip' + (filter === id ? ' on' : '')} aria-pressed={filter === id} onClick={() => setF(id)} data-testid={`filter-${id}`}>{label}</button>
            ))}
          </div>
          {pool.length === 0 ? <p className="fine">{filter === 'saved' ? 'Tap the heart on an outfit to save it here.' : 'No outfits for this filter.'}</p> : (
            <div className="viewer" data-testid="outfit-grid"
              onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}>
              <button className="nav prev" onClick={() => go(-1)} aria-label="Previous outfit" data-testid="prev">‹</button>
              <OutfitCard key={pool[cur].id} o={pool[cur]} pieces={cap.pieces} saved={s.saved.includes(pool[cur].id)} onSave={() => s.toggleSaved(pool[cur].id)} />
              <button className="nav next" onClick={() => go(1)} aria-label="Next outfit" data-testid="next">›</button>
            </div>
          )}
          {pool.length > 0 && <div className="counter" aria-live="polite" data-testid="counter">{cur + 1} of {pool.length}</div>}
        </section>
      </main>
      {dlg && <PieceDialog pieceId={dlg} onClose={() => setDlg(null)} />}
      {pal && <PalettePicker role={pal.role} from={pal.id} onClose={() => setPal(null)} />}
    </div>
  );
}
void COLOR_BY_ID;
