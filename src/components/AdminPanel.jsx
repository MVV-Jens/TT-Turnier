import { useState } from 'react';
import ParticipantManager from './ParticipantManager.jsx';
import ResultEntry from './ResultEntry.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import {
  getChampion,
  getCurrentMatch,
  getNextMatch,
  getProgress,
} from '../logic/tournament.js';

export default function AdminPanel({ state, dispatch, matches, participantsById }) {
  const [confirm, setConfirm] = useState(null); // { type: 'draw' | 'resetBracket' | 'resetAll' }

  const hasDraw = Boolean(state.draw);
  const champion = participantsById[getChampion(matches)];
  const current = getCurrentMatch(matches);
  const next = getNextMatch(matches, current?.id);
  const progress = getProgress(matches);
  const canDraw = state.participants.length >= 2;

  const runConfirm = () => {
    if (!confirm) return;
    if (confirm.type === 'draw') dispatch({ type: 'DRAW' });
    if (confirm.type === 'resetBracket') dispatch({ type: 'RESET_BRACKET' });
    if (confirm.type === 'resetAll') dispatch({ type: 'RESET_ALL' });
    setConfirm(null);
  };

  const confirmConfig = {
    draw: {
      title: 'Neu auslosen?',
      message: 'Der Turnierbaum wird zufällig neu erstellt. Bereits eingetragene Ergebnisse gehen verloren.',
      confirmLabel: 'Auslosen',
      danger: false,
    },
    resetBracket: {
      title: 'Turnier zurücksetzen?',
      message: 'Alle Ergebnisse und die Auslosung werden gelöscht. Die Teilnehmer bleiben erhalten.',
      confirmLabel: 'Zurücksetzen',
      danger: true,
    },
    resetAll: {
      title: 'Komplett zurücksetzen?',
      message: 'Teilnehmer, Avatare, Auslosung und Ergebnisse werden vollständig gelöscht.',
      confirmLabel: 'Alles löschen',
      danger: true,
    },
  };

  return (
    <div className="admin">
      <div className="admin-col">
        <ParticipantManager state={state} dispatch={dispatch} />

        <section className="panel">
          <h2 className="panel-title">Turniersteuerung</h2>

          <button
            type="button"
            className="btn btn-accent btn-block btn-lg"
            disabled={!canDraw}
            onClick={() => (hasDraw ? setConfirm({ type: 'draw' }) : dispatch({ type: 'DRAW' }))}
          >
            🎯 {hasDraw ? 'Neu auslosen' : 'Turnier auslosen'}
          </button>
          {!canDraw && (
            <p className="hint">Mindestens 2 Teilnehmer nötig, um auszulosen.</p>
          )}

          {hasDraw && (
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
                    ? `${participantsById[current.playerA]?.name} vs ${participantsById[current.playerB]?.name}`
                    : champion
                      ? '🏆 Champion steht fest'
                      : '—'}
                </span>
              </div>
              <div className="status-cell">
                <span className="status-label">Als Nächstes</span>
                <span className="status-value small">
                  {next
                    ? `${participantsById[next.playerA]?.name ?? 'Sieger'} vs ${participantsById[next.playerB]?.name ?? 'Sieger'}`
                    : '—'}
                </span>
              </div>
            </div>
          )}

          <div className="control-row">
            <button
              type="button"
              className={`btn ${state.slushieBreak ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => dispatch({ type: 'TOGGLE_SLUSHIE' })}
            >
              🥤 Slushie-Break {state.slushieBreak ? 'beenden' : 'starten'}
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
              disabled={!hasDraw}
              onClick={() => setConfirm({ type: 'resetBracket' })}
            >
              Turnier zurücksetzen
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
          matches={matches}
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
