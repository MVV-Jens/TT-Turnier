import { useState } from 'react';
import { ParticipantRow } from './AvatarPicker.jsx';
import { DEMO_NAMES } from '../data/content.js';
import { BRACKET_SIZE } from '../logic/tournament.js';

export default function ParticipantManager({ state, dispatch }) {
  const [bulk, setBulk] = useState('');
  const participants = state.participants;
  const count = participants.length;

  const addFromInput = () => {
    const names = bulk
      .split(/[\n,;]+/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    dispatch({ type: 'ADD_PARTICIPANTS', names });
    setBulk('');
  };

  const loadDemo = () => {
    const remaining = DEMO_NAMES.slice(0, Math.max(0, BRACKET_SIZE - count));
    if (remaining.length === 0) return;
    dispatch({ type: 'ADD_PARTICIPANTS', names: remaining });
  };

  const statusClass = count > BRACKET_SIZE ? 'is-over' : count >= 2 ? 'is-ok' : 'is-low';

  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">Teilnehmer</h2>
        <span className={`count-badge ${statusClass}`}>
          {count} / {BRACKET_SIZE}
        </span>
      </div>

      <div className="bulk-add">
        <textarea
          className="bulk-input"
          placeholder="Namen eingeben – einer pro Zeile (oder mit Komma getrennt)"
          rows={3}
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addFromInput();
          }}
        />
        <div className="bulk-actions">
          <button type="button" className="btn btn-primary" onClick={addFromInput}>
            + Hinzufügen
          </button>
          <button type="button" className="btn btn-ghost" onClick={loadDemo}>
            Demo-Namen laden
          </button>
        </div>
      </div>

      {count > BRACKET_SIZE && (
        <p className="hint hint-warn">
          Mehr als {BRACKET_SIZE} Teilnehmer – bei der Auslosung werden die ersten{' '}
          {BRACKET_SIZE} zufällig gesetzt.
        </p>
      )}
      {count > 0 && count < BRACKET_SIZE && (
        <p className="hint">
          {BRACKET_SIZE - count} freie {BRACKET_SIZE - count === 1 ? 'Platz' : 'Plätze'} –
          werden als Freilos vergeben.
        </p>
      )}

      {count > 0 && (
        <div className="participant-toolbar">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => dispatch({ type: 'RANDOMIZE_ALL_AVATARS' })}
          >
            🎲 Alle Avatare neu
          </button>
        </div>
      )}

      <ul className="participant-list">
        {participants.map((p, i) => (
          <ParticipantRow key={p.id} participant={p} index={i} dispatch={dispatch} />
        ))}
        {count === 0 && (
          <li className="participant-empty">
            Noch keine Teilnehmer. Namen oben eintragen oder Demo-Namen laden.
          </li>
        )}
      </ul>
    </section>
  );
}
