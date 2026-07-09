import { useState } from 'react';
import ParticipantManager from './ParticipantManager.jsx';
import Configurator from './Configurator.jsx';
import ResultEntry from './ResultEntry.jsx';
import CrownBoard from './CrownBoard.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { getCurrentMatch, getNextMatch } from '../logic/engine.js';
import { MODES, SET_LENGTHS, calcMode, RATING_META } from '../logic/formats.js';

export default function AdminPanel({ state, dispatch, live, participantsById }) {
  const [confirm, setConfirm] = useState(null); // { type: 'resetBracket' | 'resetAll' }
  const hasTournament = Boolean(state.tournament);
  const champion = participantsById[live.champion];
  const current = getCurrentMatch(live.matches);
  const next = getNextMatch(live.matches, current?.id);
  const progress = live.progress;

  const runConfirm = () => {
    if (!confirm) return;
    if (confirm.type === 'resetBracket') dispatch({ type: 'RESET_BRACKET' });
    if (confirm.type === 'resetAll') dispatch({ type: 'RESET_ALL' });
    if (confirm.type === 'reopenCrowns') dispatch({ type: 'KOTB_REOPEN_CROWNS' });
    setConfirm(null);
  };

  const confirmConfig = {
    resetBracket: {
      title: 'Turnier zurücksetzen?',
      message: 'Alle Ergebnisse werden gelöscht und du kehrst zum Konfigurator zurück. Die Teilnehmer bleiben erhalten.',
      confirmLabel: 'Zurücksetzen',
      danger: true,
    },
    resetAll: {
      title: 'Komplett zurücksetzen?',
      message: 'Teilnehmer, Avatare, Konfiguration und Ergebnisse werden vollständig gelöscht.',
      confirmLabel: 'Alles löschen',
      danger: true,
    },
    reopenCrowns: {
      title: 'Zurück zur Kronenphase?',
      message: 'Das K.o. wird verworfen und ihr sammelt weiter Kronen. Bereits eingetragene K.o.-Ergebnisse gehen verloren.',
      confirmLabel: 'Zurück zur Kronenphase',
      danger: true,
    },
  };

  if (!hasTournament) {
    return (
      <div className="admin">
        <div className="admin-col">
          <ParticipantManager state={state} dispatch={dispatch} />
        </div>
        <div className="admin-col">
          <Configurator state={state} dispatch={dispatch} />
        </div>
        <ConfirmDialog
          open={Boolean(confirm)}
          {...(confirm ? confirmConfig[confirm.type] : {})}
          onConfirm={runConfirm}
          onCancel={() => setConfirm(null)}
        />
      </div>
    );
  }

  const P = state.participants.length;

  if (live.format === 'kotb') {
    const isCrowns = live.phase === 'crowns';
    const leader = live.crownStandings?.[0];
    const leaderP = participantsById[leader?.id];

    return (
      <div className="admin">
        <div className="admin-col">
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Turnier läuft</h2>
              <span className="phase-pill">{MODES.kotb.short}</span>
            </div>

            <div className="setup-recap">
              <div className="recap-cell"><span>Teilnehmer</span><strong>{P}</strong></div>
              <div className="recap-cell"><span>Phase</span><strong>{isCrowns ? 'Kronenphase' : 'K.o.-Phase'}</strong></div>
              <div className="recap-cell"><span>Kronen vergeben</span><strong>{live.crownCount}</strong></div>
              <div className="recap-cell"><span>Ins K.o.</span><strong>Top {live.advance}</strong></div>
              <div className="recap-cell"><span>Timer</span><strong>{live.useTimer ? `${live.durationMin} Min` : 'frei'}</strong></div>
              <div className="recap-cell">
                <span>Führung</span>
                <strong>{leader && leader.crowns > 0 ? `${leaderP?.name} · ${leader.crowns}👑` : '—'}</strong>
              </div>
            </div>

            {champion && (
              <p className="champion-note">
                🏆 <strong>{champion.name}</strong> ist Champion – der Gewinner-Screen läuft
                automatisch im Beamer-Modus.
              </p>
            )}

            <div className="control-row">
              <button
                type="button"
                className={`btn ${state.slushieBreak ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => dispatch({ type: 'TOGGLE_SLUSHIE' })}
              >
                🥤 Slushie-Break {state.slushieBreak ? 'beenden' : 'starten'}
              </button>
              <button
                type="button"
                className={`btn ${state.motivationBreak ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => dispatch({ type: 'TOGGLE_MOTIVATION' })}
              >
                ⚡ Motivation {state.motivationBreak ? 'beenden' : 'starten'}
              </button>
            </div>

            <div className="control-row danger-row">
              {!isCrowns && !champion && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setConfirm({ type: 'reopenCrowns' })}
                >
                  ↩ Zurück zur Kronenphase
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirm({ type: 'resetBracket' })}
              >
                Zurück zum Konfigurator
              </button>
              <button
                type="button"
                className="btn btn-danger-ghost"
                onClick={() => setConfirm({ type: 'resetAll' })}
              >
                Alles löschen
              </button>
            </div>
          </section>
        </div>

        <div className="admin-col">
          {isCrowns ? (
            <CrownBoard state={state} dispatch={dispatch} live={live} participantsById={participantsById} />
          ) : (
            <ResultEntry state={state} dispatch={dispatch} live={live} participantsById={participantsById} />
          )}
        </div>

        <ConfirmDialog
          open={Boolean(confirm)}
          {...(confirm ? confirmConfig[confirm.type] : {})}
          onConfirm={runConfirm}
          onCancel={() => setConfirm(null)}
        />
      </div>
    );
  }

  const { tables, minutes, setLength } = state.config;
  const calc = calcMode(live.format, P, tables, minutes, setLength);
  const nameOf = (id, fallback = 'Sieger') => participantsById[id]?.name ?? fallback;

  return (
    <div className="admin">
      <div className="admin-col">
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Turnier läuft</h2>
            <span className="phase-pill">{MODES[live.format].short}</span>
          </div>

          <div className="setup-recap">
            <div className="recap-cell"><span>Teilnehmer</span><strong>{P}</strong></div>
            <div className="recap-cell"><span>Platten</span><strong>{tables === 4 ? '4+' : tables}</strong></div>
            <div className="recap-cell"><span>Satzlänge</span><strong>{SET_LENGTHS[setLength].label}</strong></div>
            <div className="recap-cell"><span>Zeitfenster</span><strong>{minutes} Min</strong></div>
            <div className="recap-cell"><span>Geschätzt</span><strong>{calc.duration} Min</strong></div>
            <div className="recap-cell">
              <span>Bewertung</span>
              <strong>{RATING_META[calc.rating].icon} {RATING_META[calc.rating].label}</strong>
            </div>
          </div>

          <div className="status-grid">
            <div className="status-cell">
              <span className="status-label">Phase</span>
              <span className="status-value">
                {champion ? 'Beendet' : current ? current.roundName : '—'}
              </span>
            </div>
            <div className="status-cell">
              <span className="status-label">Fortschritt</span>
              <span className="status-value">
                {progress.played} / {progress.total}
              </span>
            </div>
            <div className="status-cell">
              <span className="status-label">Aktuell</span>
              <span className="status-value small">
                {current
                  ? `${nameOf(current.playerA)} vs ${nameOf(current.playerB)}`
                  : champion
                    ? '🏆 Champion steht fest'
                    : '—'}
              </span>
            </div>
            <div className="status-cell">
              <span className="status-label">Als Nächstes</span>
              <span className="status-value small">
                {next ? `${nameOf(next.playerA)} vs ${nameOf(next.playerB)}` : '—'}
              </span>
            </div>
          </div>

          <div className="control-row">
            <button
              type="button"
              className={`btn ${state.slushieBreak ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => dispatch({ type: 'TOGGLE_SLUSHIE' })}
            >
              🥤 Slushie-Break {state.slushieBreak ? 'beenden' : 'starten'}
            </button>
            <button
              type="button"
              className={`btn ${state.motivationBreak ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => dispatch({ type: 'TOGGLE_MOTIVATION' })}
            >
              ⚡ Motivation {state.motivationBreak ? 'beenden' : 'starten'}
            </button>
          </div>

          {champion && (
            <p className="champion-note">
              🏆 <strong>{champion.name}</strong> ist Champion – der Gewinner-Screen läuft
              automatisch im Beamer-Modus.
            </p>
          )}

          <div className="control-row danger-row">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setConfirm({ type: 'resetBracket' })}
            >
              Zurück zum Konfigurator
            </button>
            <button
              type="button"
              className="btn btn-danger-ghost"
              onClick={() => setConfirm({ type: 'resetAll' })}
            >
              Alles löschen
            </button>
          </div>
        </section>
      </div>

      <div className="admin-col">
        <ResultEntry
          state={state}
          dispatch={dispatch}
          live={live}
          participantsById={participantsById}
        />
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        {...(confirm ? confirmConfig[confirm.type] : {})}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
