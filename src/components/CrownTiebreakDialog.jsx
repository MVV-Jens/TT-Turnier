import { useState } from 'react';
import Avatar from './Avatar.jsx';

// Shown when several players are tied on the KO qualification boundary and the
// admin has to pick who advances (after a physical "Stechen").
export default function CrownTiebreakDialog({ open, plan, participantsById, onConfirm, onCancel }) {
  const [chosen, setChosen] = useState([]);

  if (!open || !plan) return null;

  const { tiedAtCutoff, slotsLeft, cutoffValue } = plan;
  const toggle = (id) => {
    setChosen((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= slotsLeft) return prev; // cannot exceed open slots
      return [...prev, id];
    });
  };

  const ready = chosen.length === slotsLeft;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal crown-tiebreak" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Stechen um die letzten Plätze</h3>
        <p className="modal-message">
          Diese Spieler haben je <strong>{cutoffValue} 👑</strong> und konkurrieren um die
          letzten <strong>{slotsLeft}</strong> {slotsLeft === 1 ? 'Platz' : 'Plätze'} im K.o.
          Wählt es aus (z. B. per Stechen) und markiere die Qualifikanten.
        </p>

        <div className="crown-tiebreak-list">
          {tiedAtCutoff.map((id) => {
            const p = participantsById[id];
            const sel = chosen.includes(id);
            return (
              <button
                type="button"
                key={id}
                className={`crown-tiebreak-item ${sel ? 'is-selected' : ''}`}
                style={{ '--accent': p?.color }}
                onClick={() => toggle(id)}
              >
                <Avatar avatar={p?.avatar} color={p?.color} size={40} />
                <span className="crown-tiebreak-name">{p?.name ?? '—'}</span>
                <span className="crown-tiebreak-mark">{sel ? '✅' : '＋'}</span>
              </button>
            );
          })}
        </div>

        <p className={`crown-tiebreak-count ${ready ? 'is-ready' : ''}`}>
          {chosen.length} / {slotsLeft} gewählt
        </p>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Abbrechen
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!ready}
            onClick={() => onConfirm(chosen)}
          >
            K.o. starten
          </button>
        </div>
      </div>
    </div>
  );
}
