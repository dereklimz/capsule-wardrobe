import { useEffect, useMemo, useRef, useState } from 'react';
import { ACTIVITIES, activitiesFor } from '../data/activities';
import { ACCENTS, BASES, COLOR_BY_ID, Color, NEUTRALS, SEASONS, Season } from '../data/colors';
import { presetsFor } from '../data/presets';
import { Draft, Gate, accentGate, accentWarn, baseGate, neutralGate, paletteProblem, suggestAccents } from '../logic/gating';
import { useStore } from '../store';
import { PaletteStrip, isLight } from './ui';

type Section = 'season' | 'neutrals' | 'bases' | 'accents' | 'occasions';
const SEASON_LABEL: Record<Season, string> = { spring: 'Spring', summer: 'Summer', fall: 'Fall', winter: 'Winter' };

function SectionCard({ id, title, hint, open, onToggle, summary, children, done }: {
  id: Section; title: string; hint: string; open: boolean; onToggle: () => void; summary: React.ReactNode; children: React.ReactNode; done: boolean;
}) {
  return (
    <section className={'card' + (open ? ' open' : '')} data-testid={`section-${id}`}>
      <button className="card-head" onClick={onToggle} aria-expanded={open}>
        <span className={'step' + (done ? ' done' : '')} aria-hidden>{done ? '✓' : ''}</span>
        <span className="card-title">{title}<small>{hint}</small></span>
        {!open && <span className="card-summary">{summary}</span>}
        <span className="chev" aria-hidden>{open ? '–' : 'Edit'}</span>
      </button>
      {open && <div className="card-body">{children}</div>}
    </section>
  );
}

function ColorPicker({ colors, draftKey, draft, gateFn, onPick, warn }: {
  colors: Color[]; draftKey: keyof Draft; draft: Draft; gateFn: (id: string, d: Draft) => Gate; onPick: (id: string) => void; warn?: (id: string, d: Draft) => string | null;
}) {
  const [msg, setMsg] = useState('');
  return (
    <div>
      <div className="swatches" role="group">
        {colors.map((c) => {
          const selected = draft[draftKey].includes(c.id);
          const g = gateFn(c.id, draft);
          const full = !g.enabled && !!g.reason?.startsWith('You already have');
          const w = !selected && g.enabled && warn ? warn(c.id, draft) : null;
          return (
            <button key={c.id} className={'pick' + (selected ? ' sel' : '') + (!g.enabled ? (full ? ' full' : ' dim') : '')} data-color={c.id}
              aria-pressed={selected} aria-disabled={!g.enabled}
              aria-label={`${c.name} ${c.hex}${selected ? ', selected' : ''}${!g.enabled ? `, unavailable. ${g.reason}` : ''}${w ? `. ${w}` : ''}`}
              title={!g.enabled ? g.reason : w ?? c.name}
              onClick={() => { if (!g.enabled) { setMsg(`${c.name}: ${g.reason}`); return; } setMsg(w ? `${c.name}: ${w}` : ''); onPick(c.id); }}>
              <span className={'sw' + (isLight(c.hex) ? ' light' : '')} style={{ background: c.hex }}>
                {selected && <span className="tick" aria-hidden>✓</span>}
                {!g.enabled && !full && <span className="ban" aria-hidden>⦸</span>}
                {w && <span className="warnmark" aria-hidden>~</span>}
              </span>
              <span className="pname">{c.name}</span>
            </button>
          );
        })}
      </div>
      <p className="gate-msg" role="status" aria-live="polite" data-testid="gate-msg">{msg}</p>
    </div>
  );
}

export function Choose() {
  const s = useStore();
  const [open, setOpen] = useState<Section>('season');
  const quota = { neutrals: 2, bases: 3, accents: 4 } as const;
  const prev = useRef({ n: s.draft.neutrals.length, b: s.draft.bases.length, a: s.draft.accents.length, act: s.activityIds.length });
  const season = s.season;
  const acts = activitiesFor(season);
  const day = acts.filter((a) => a.time === 'day'), night = acts.filter((a) => a.time === 'night');
  const dayN = s.activityIds.filter((id) => day.some((a) => a.id === id)).length, nightN = s.activityIds.filter((id) => night.some((a) => a.id === id)).length;
  const cap = s.capsules[season];

  // Auto-advance: when a picker's quota is met, open the next after ~400 ms, with an undo toast.
  useEffect(() => {
    const p = prev.current; const d = s.draft;
    const next: { key: 'n' | 'b' | 'a'; to: Section; msg: string; list: keyof Draft }[] = [
      { key: 'n', to: 'bases', msg: 'Neutrals set.', list: 'neutrals' },
      { key: 'b', to: 'accents', msg: 'Base colors set.', list: 'bases' },
      { key: 'a', to: 'occasions', msg: 'Accents set.', list: 'accents' },
    ];
    for (const n of next) {
      const len = d[n.list].length; const before = p[n.key];
      if (before < quota[n.list] && len === quota[n.list] && open === (n.list as Section)) {
        const t = setTimeout(() => {
          setOpen(n.to);
          if (n.list === 'bases' && d.accents.length === 0) {
            const acc = suggestAccents(d.neutrals, d.bases, season);
            prev.current = { ...prev.current, a: 4 }; // suggestions should be seen, not skipped past
            s.setDraft({ ...d, accents: acc });
            s.showToast('We picked 4 accents to start. Change any of them.', () => { s.setDraft({ ...useStore.getState().draft, accents: [] }); setOpen('accents'); });
          } else {
            s.showToast(n.msg, () => { const cur = useStore.getState().draft; s.setDraft({ ...cur, [n.list]: cur[n.list].slice(0, -1) }); setOpen(n.list as Section); });
          }
        }, 400);
        prev.current = { n: d.neutrals.length, b: d.bases.length, a: d.accents.length, act: s.activityIds.length };
        return () => clearTimeout(t);
      }
    }
    prev.current = { n: d.neutrals.length, b: d.bases.length, a: d.accents.length, act: s.activityIds.length };
  }, [s.draft, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleIn = (key: keyof Draft) => (id: string) => {
    const cur = s.draft[key];
    s.setDraft({ ...s.draft, [key]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  };
  const complete = s.draft.neutrals.length === 2 && s.draft.bases.length === 3 && s.draft.accents.length === 4;
  const reason = !s.wardrobe ? 'Choose a wardrobe.' : s.wardrobe !== 'men' ? 'Only menswear is available right now.'
    : s.draft.neutrals.length < 2 ? `Pick ${2 - s.draft.neutrals.length} more neutral${s.draft.neutrals.length === 0 ? 's' : ''}.`
    : s.draft.bases.length < 3 ? `Pick ${3 - s.draft.bases.length} more base color${3 - s.draft.bases.length > 1 ? 's' : ''}.`
    : s.draft.accents.length < 4 ? `Pick ${4 - s.draft.accents.length} more accent${4 - s.draft.accents.length > 1 ? 's' : ''}.`
    : s.activityIds.length < 2 ? `Pick ${2 - s.activityIds.length} more occasion${s.activityIds.length === 0 ? 's' : ''}.` : '';
  const canGo = reason === '' && complete && paletteProblem({ ...s.draft }) === null;
  const same = cap && JSON.stringify(cap.palette) === JSON.stringify(s.draft) && [...cap.activityIds].sort().join() === [...s.activityIds].sort().join();
  const label = cap ? (same ? 'View capsule' : 'Update capsule') : 'Generate capsule';

  const toggleAct = (id: string, group: 'day' | 'night') => {
    const inGroup = group === 'day' ? dayN : nightN;
    if (!s.activityIds.includes(id) && (inGroup >= 3 || s.activityIds.length >= 6)) { s.showToast(inGroup >= 3 ? 'Up to 3 occasions per group. Tap one to swap.' : 'Up to 6 occasions in total.'); return; }
    s.toggleActivity(id);
  };

  const presets = useMemo(() => presetsFor(season), [season]);
  const chips = (ids: string[]) => <span className="chips">{ids.map((id) => <span key={id} className="chip-c"><i style={{ background: COLOR_BY_ID[id].hex }} />{COLOR_BY_ID[id].name}</span>)}</span>;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand"><span className="logo" aria-hidden>◐</span> Capsule</div>
        <div className="tb-note">Build a nine-color palette, get a capsule wardrobe and outfits</div>
        {cap && <button className="ghost" onClick={() => useStore.setState({ screen: 'capsule' })}>Back to capsule</button>}
      </header>
      <main className="choose">
        <div className="col-main">
          <h1>Let’s build your capsule</h1>
          <p className="lede">A few choices. Colors that don’t match are dimmed, so you can’t pick a clash.</p>

          <SectionCard id="season" title="Season and wardrobe" hint="Defaults to today’s date" open={open === 'season'} onToggle={() => setOpen(open === 'season' ? 'neutrals' : 'season')}
            done={!!s.wardrobe} summary={<>{SEASON_LABEL[season]} · {s.wardrobe === 'men' ? 'Menswear' : 'Choose wardrobe'}</>}>
            <div className="row" role="group" aria-label="Season">
              {SEASONS.map((x) => <button key={x} className={'seg' + (season === x ? ' on' : '')} aria-pressed={season === x} onClick={() => s.setSeason(x)} data-testid={`season-${x}`}>{SEASON_LABEL[x]}</button>)}
              <label className="hemi">Southern hemisphere
                <input type="checkbox" checked={s.hemisphere === 'south'} onChange={(e) => s.setHemisphere(e.target.checked ? 'south' : 'north')} />
              </label>
            </div>
            <div className="row" role="group" aria-label="Wardrobe">
              <button className={'seg' + (s.wardrobe === 'men' ? ' on' : '')} aria-pressed={s.wardrobe === 'men'} onClick={() => s.setWardrobe('men')} data-testid="wardrobe-men">Menswear</button>
              <button className="seg" disabled title="Womenswear is not built yet">Womenswear <em>soon</em></button>
              <button className="seg" disabled title="Both is not built yet">Both <em>soon</em></button>
            </div>
          </SectionCard>

          <div className="presets">
            <div className="presets-h">Start from a palette</div>
            <div className="preset-row">
              {presets.map((p) => (
                <button key={p.id} className="preset" data-testid={`preset-${p.id}`} onClick={() => { s.applyPalette(p.palette); setOpen('occasions'); prev.current = { n: 2, b: 3, a: 4, act: s.activityIds.length }; s.showToast(`${p.name} palette applied.`); }}>
                  <span className="pdots">{[...p.palette.neutrals, ...p.palette.bases, ...p.palette.accents].map((id) => <i key={id} style={{ background: COLOR_BY_ID[id].hex }} />)}</span>
                  <span className="pn">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <SectionCard id="neutrals" title="Neutrals" hint="Pick 2. They go with every shade" open={open === 'neutrals'} onToggle={() => setOpen(open === 'neutrals' ? 'bases' : 'neutrals')}
            done={s.draft.neutrals.length === 2} summary={s.draft.neutrals.length ? chips(s.draft.neutrals) : <>Pick 2</>}>
            <ColorPicker colors={NEUTRALS} draftKey="neutrals" draft={s.draft} gateFn={neutralGate} onPick={toggleIn('neutrals')} />
          </SectionCard>
          <SectionCard id="bases" title="Base colors" hint={s.draft.neutrals.length < 2 ? 'Pick 2 neutrals first' : 'Pick 3 for jackets, trousers and shoes'} open={open === 'bases'} onToggle={() => setOpen(open === 'bases' ? 'accents' : 'bases')}
            done={s.draft.bases.length === 3} summary={s.draft.bases.length ? chips(s.draft.bases) : <>Pick 3</>}>
            <ColorPicker colors={BASES} draftKey="bases" draft={s.draft} gateFn={baseGate} onPick={toggleIn('bases')} />
          </SectionCard>
          <SectionCard id="accents" title="Accents" hint={s.draft.bases.length < 3 ? 'Pick 3 base colors first' : 'Pick 4 for pops of color. We suggest a set'} open={open === 'accents'} onToggle={() => setOpen(open === 'accents' ? 'occasions' : 'accents')}
            done={s.draft.accents.length === 4} summary={s.draft.accents.length ? chips(s.draft.accents) : <>Pick 4</>}>
            <ColorPicker colors={ACCENTS} draftKey="accents" draft={s.draft} gateFn={accentGate} onPick={toggleIn('accents')} warn={accentWarn} />
            <p className="fine">Accents are single standout pieces, so each outfit uses at most one.</p>
            {s.draft.accents.length === 4 && <button className="ghost" style={{ marginTop: 10 }} data-testid="accents-ok" onClick={() => setOpen('occasions')}>Looks good</button>}
          </SectionCard>
          <SectionCard id="occasions" title="Occasions" hint="Pick 2 to 6. Up to 3 in each group" open={open === 'occasions'} onToggle={() => setOpen(open === 'occasions' ? 'season' : 'occasions')}
            done={s.activityIds.length >= 2} summary={s.activityIds.length ? <span className="chips">{s.activityIds.map((id) => <span className="chip-c" key={id}>{ACTIVITIES.find((a) => a.id === id)!.label}</span>)}</span> : <>Pick 2 or more</>}>
            {([['Daytime', day, 'day'], ['Night', night, 'night']] as const).map(([name, list, g]) => (
              <div key={name} className="agroup">
                <div className="agroup-h">{name}</div>
                <div className="agrid">
                  {list.map((a) => {
                    const on = s.activityIds.includes(a.id);
                    return (
                      <button key={a.id} className={'acard' + (on ? ' on' : '')} aria-pressed={on} data-testid={`act-${a.id}`} onClick={() => toggleAct(a.id, g)}>
                        <b>{a.label}</b><span>{a.vibe}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </SectionCard>
        </div>

        <aside className="col-side">
          <div className="side-card">
            <div className="side-h">Your palette</div>
            <PaletteStrip draft={s.draft} />
            <div className="side-meta">{SEASON_LABEL[season]} · {s.wardrobe === 'men' ? 'Menswear' : 'No wardrobe yet'} · {s.activityIds.length} occasion{s.activityIds.length === 1 ? '' : 's'}</div>
            <button className="primary" disabled={!canGo} onClick={() => { s.generate(); }} data-testid="generate">{label}</button>
            <p className="reason" data-testid="reason">{canGo ? 'Ready.' : reason}</p>
          </div>
        </aside>
      </main>
      <div className="mobile-bar">
        <div className="mb-pal">{[...s.draft.neutrals, ...s.draft.bases, ...s.draft.accents].map((id) => <i key={id} style={{ background: COLOR_BY_ID[id].hex }} />)}</div>
        <button className="primary" disabled={!canGo} onClick={() => s.generate()} data-testid="generate-mobile">{label}</button>
        <div className="reason">{canGo ? 'Ready.' : reason}</div>
      </div>
    </div>
  );
}
