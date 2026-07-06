import { useMemo, useState } from 'react';
import {
  recommend,
  MODES,
  MODE_ORDER,
  SET_LENGTHS,
  RATING_META,
  TABLE_OPTIONS,
  TIME_PRESETS,
  MIN_PLAYERS,
  MAX_PLAYERS,
} from '../logic/formats.js';

function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={value === opt.value ? 'active' : ''}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function RatingBadge({ rating }) {
  const meta = RATING_META[rating];
  return <span className={`rating rating-${rating}`}>{meta.icon} {meta.label}</span>;
}

export default function Configurator({ state, dispatch, onStart }) {
  const [selected, setSelected] = useState(null);
  const P = state.participants.length;
  const { tables, minutes, setLength } = state.config;
  const [customMinutes, setCustomMinutes] = useState(String(minutes));
  const [timeMode, setTimeMode] = useState(
    TIME_PRESETS.includes(minutes) ? 'preset' : 'custom',
  );

  const rec = useMemo(
    () => (P >= MIN_PLAYERS ? recommend(P, tables, minutes, setLength) : null),
    [P, tables, minutes, setLength],
  );

  const chosen = selected || rec?.recommended || null;
  const chosenCalc = rec?.all.find((m) => m.format === chosen) || null;
  const setConfig = (patch) => dispatch({ type: 'SET_CONFIG', config: patch });

  const tooFew = P < MIN_PLAYERS;
  const tooMany = P > MAX_PLAYERS;
  const canStart = !tooFew && !tooMany && chosenCalc && chosenCalc.eligible;
  const isOverride = selected && rec && selected !== rec.recommended;

  return (
    <section className="panel configurator">
      <div className="panel-head">
        <h2 className="panel-title">Turnier-Konfigurator</h2>
        <span className={`count-badge ${tooFew || tooMany ? 'is-over' : 'is-ok'}`}>
          {P} {P === 1 ? 'Spieler' : 'Spieler'}
        </span>
      </div>
      <p className="hint">
        Sag mir wie viele Leute, wie viele Platten und wie viel Zeit – ich schlage den
        sinnvollsten Modus vor.
      </p>

      <label className="config-field config-title-field">
        <span className="field-label">Turniername</span>
        <input
          className="title-input"
          type="text"
          maxLength={40}
          value={state.config.title ?? ''}
          placeholder="VR Tischtennis Cup"
          onChange={(e) => setConfig({ title: e.target.value })}
        />
      </label>

      <div className="config-grid">
        <div className="config-field">
          <span className="field-label">Platten</span>
          <Segmented
            value={tables}
            onChange={(v) => setConfig({ tables: v })}
            options={TABLE_OPTIONS.map((t) => ({ value: t, label: t === 4 ? '4+' : String(t) }))}
          />
        </div>

        <div className="config-field">
          <span className="field-label">Verfügbare Zeit</span>
          <Segmented
            value={timeMode === 'custom' ? 'custom' : minutes}
            onChange={(v) => {
              if (v === 'custom') {
                setTimeMode('custom');
                setConfig({ minutes: Number(customMinutes) || 90 });
              } else {
                setTimeMode('preset');
                setConfig({ minutes: v });
              }
            }}
            options={[
              ...TIME_PRESETS.map((m) => ({ value: m, label: `${m} Min` })),
              { value: 'custom', label: 'Custom' },
            ]}
          />
          {timeMode === 'custom' && (
            <input
              className="custom-minutes"
              type="number"
              min="15"
              max="600"
              value={customMinutes}
              placeholder="Minuten"
              onChange={(e) => {
                setCustomMinutes(e.target.value);
                const n = Number(e.target.value);
                if (n >= 15) setConfig({ minutes: n });
              }}
            />
          )}
        </div>

        <div className="config-field config-field-wide">
          <span className="field-label">Satzlänge</span>
          <Segmented
            value={setLength}
            onChange={(v) => setConfig({ setLength: v })}
            options={Object.values(SET_LENGTHS).map((s) => ({
              value: s.key,
              label: `${s.label} · ${s.desc}`,
            }))}
          />
        </div>
      </div>

      {tooFew && (
        <p className="hint hint-warn">
          Mindestens {MIN_PLAYERS} Teilnehmer nötig – aktuell {P}.
        </p>
      )}
      {tooMany && (
        <p className="hint hint-warn">
          Maximal {MAX_PLAYERS} Teilnehmer – aktuell {P}.
        </p>
      )}

      {rec && chosenCalc && (
        <>
          <div className={`recommendation rating-border-${chosenCalc.rating}`}>
            <div className="rec-top">
              <span className="rec-kicker">
                {isOverride ? 'Gewählter Modus' : 'Empfohlener Modus'}
              </span>
              <RatingBadge rating={chosenCalc.rating} />
            </div>
            <h3 className="rec-mode">{MODES[chosen].name}</h3>
            <div className="rec-stats">
              <div className="rec-stat">
                <span className="rec-stat-label">Geschätzte Dauer</span>
                <span className="rec-stat-value">{chosenCalc.duration} Min</span>
              </div>
              <div className="rec-stat">
                <span className="rec-stat-label">Anzahl Spiele</span>
                <span className="rec-stat-value">{chosenCalc.games}</span>
              </div>
              <div className="rec-stat">
                <span className="rec-stat-label">Ø Wartezeit</span>
                <span className="rec-stat-value">{chosenCalc.avgWait} Min</span>
              </div>
              <div className="rec-stat">
                <span className="rec-stat-label">Zeitfenster</span>
                <span className="rec-stat-value">{minutes} Min</span>
              </div>
            </div>
            <ul className="rec-reasons">
              {(isOverride ? MODES[chosen].traits : rec.reasons).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            {isOverride && (
              <p className="rec-override-note">
                Empfohlen wäre: <strong>{MODES[rec.recommended].name}</strong>
              </p>
            )}
            {chosenCalc.rating === 'over' && (
              <div className="rec-warning">
                ⚠️ Achtung: Die gewählte Turnierform überschreitet die verfügbare Zeit
                voraussichtlich um ca. <strong>{chosenCalc.over} Minuten</strong>.
              </div>
            )}
          </div>

          <div className="mode-list">
            <span className="field-label">Alle Modi</span>
            {MODE_ORDER.map((format) => {
              const m = rec.all.find((x) => x.format === format);
              const isRec = rec.recommended === format;
              const isSel = chosen === format;
              return (
                <button
                  key={format}
                  type="button"
                  disabled={!m.eligible}
                  className={`mode-card ${isSel ? 'is-selected' : ''} ${!m.eligible ? 'is-disabled' : ''}`}
                  onClick={() => setSelected(format)}
                >
                  <div className="mode-card-main">
                    <span className="mode-card-name">
                      {MODES[format].name}
                      {isRec && <span className="mode-tag">Empfehlung</span>}
                    </span>
                    <span className="mode-card-fit">
                      {m.eligible ? MODES[format].fitFor : `nur ${MODES[format].min}–${MODES[format].max} Spieler`}
                    </span>
                  </div>
                  <div className="mode-card-side">
                    {m.eligible ? (
                      <>
                        <span className="mode-card-dur">{m.duration} Min · {m.games} Spiele</span>
                        <RatingBadge rating={m.rating} />
                      </>
                    ) : (
                      <span className="mode-card-dur muted">nicht passend</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="config-actions">
            {selected && (
              <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>
                Empfehlung übernehmen
              </button>
            )}
            <button
              type="button"
              className="btn btn-accent btn-lg"
              disabled={!canStart}
              onClick={() => {
                dispatch({ type: 'START_TOURNAMENT', format: chosen });
                onStart?.();
              }}
            >
              🎯 Turnier starten – {MODES[chosen].name}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
