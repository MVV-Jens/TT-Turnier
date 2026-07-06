import { useEffect, useMemo, useState } from 'react';
import Avatar from './Avatar.jsx';
import { getCurrentMatch, playableMatches, validateScore } from '../logic/engine.js';

function PlayerLine({ player, score, onScore, side }) {
  return (
    <div className="result-player" style={{ '--accent': player?.color }}>
      <Avatar avatar={player?.avatar} color={player?.color} size={52} />
      <span className="result-player-name">{player?.name ?? '—'}</span>
      <input
        className="score-input"
        type="number"
        min="0"
        inputMode="numeric"
        aria-label={`Ergebnis ${side}`}
        value={score}
        onChange={(e) => onScore(e.target.value)}
      />
    </div>
  );
}

export default function ResultEntry({ state, dispatch, live, participantsById }) {
  const openMatches = useMemo(() => playableMatches(live.matches), [live.matches]);
  const current = getCurrentMatch(live.matches);
  const [selectedId, setSelectedId] = useState(current?.id ?? null);

  // Follow the live "current match" unless the user picked a still-open one.
  useEffect(() => {
    const stillValid = openMatches.some((m) => m.id === selectedId && !m.winner);
    if (!stillValid) setSelectedId(current?.id ?? null);
  }, [current?.id, openMatches, selectedId]);

  const selected = openMatches.find((m) => m.id === selectedId) || current || null;
  const stored = selected ? state.results[selected.id] : null;
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');

  useEffect(() => {
    setScoreA(stored?.a != null ? String(stored.a) : '');
    setScoreB(stored?.b != null ? String(stored.b) : '');
  }, [selected?.id, stored?.a, stored?.b]);

  if (!state.tournament) {
    return (
      <section className="panel">
        <h2 className="panel-title">Ergebniserfassung</h2>
        <p className="hint">Erst ein Turnier starten – dann können Ergebnisse eingetragen werden.</p>
      </section>
    );
  }

  if (!selected) {
    return (
      <section className="panel">
        <h2 className="panel-title">Ergebniserfassung</h2>
        <p className="hint">Aktuell kein offenes Match – Turnier läuft weiter oder ist beendet.</p>
      </section>
    );
  }

  const playerA = participantsById[selected.playerA];
  const playerB = participantsById[selected.playerB];
  const isBo3 = selected.bestOf === 3;
  const validation = validateScore(scoreA, scoreB, selected);
  const winnerName =
    validation.ok && scoreA !== '' && scoreB !== ''
      ? Number(scoreA) > Number(scoreB)
        ? playerA?.name
        : playerB?.name
      : null;

  const save = () => {
    if (!validation.ok) return;
    dispatch({ type: 'SET_RESULT', matchId: selected.id, a: Number(scoreA), b: Number(scoreB) });
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Ergebniserfassung</h2>
        <span className="phase-pill">{selected.roundName}</span>
      </div>

      {openMatches.length > 1 && (
        <label className="field">
          <span className="field-label">Match auswählen</span>
          <select
            className="select"
            value={selected.id}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {openMatches.map((m) => {
              const a = participantsById[m.playerA]?.name ?? '—';
              const b = participantsById[m.playerB]?.name ?? '—';
              const done = m.winner ? ' ✓' : m.id === current?.id ? ' • jetzt' : '';
              return (
                <option key={m.id} value={m.id}>
                  {m.roundName}: {a} vs {b}{done}
                </option>
              );
            })}
          </select>
        </label>
      )}

      <p className="target-hint">
        {isBo3 ? (
          <>
            <strong>Best of 3</strong> · Sätze eintragen (2 gewinnt, z. B. 2:1)
          </>
        ) : (
          <>
            Spiel bis <strong>{selected.target}</strong> Punkte
          </>
        )}
      </p>

      <div className="result-grid">
        <PlayerLine player={playerA} score={scoreA} onScore={setScoreA} side="A" />
        <span className="result-vs">:</span>
        <PlayerLine player={playerB} score={scoreB} onScore={setScoreB} side="B" />
      </div>

      {!validation.ok && (scoreA !== '' || scoreB !== '') && (
        <p className="hint hint-warn">{validation.message}</p>
      )}
      {winnerName && (
        <p className="winner-preview">
          Erkannter Sieger: <strong>{winnerName}</strong>
        </p>
      )}

      <div className="result-actions">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          disabled={!validation.ok}
          onClick={save}
        >
          {selected.winner ? 'Ergebnis aktualisieren' : 'Match abschließen'}
        </button>
        {selected.winner && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => dispatch({ type: 'CLEAR_RESULT', matchId: selected.id })}
          >
            Ergebnis löschen
          </button>
        )}
      </div>
    </section>
  );
}
