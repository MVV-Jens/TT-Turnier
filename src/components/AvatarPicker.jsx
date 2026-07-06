import { useState } from 'react';
import Avatar from './Avatar.jsx';
import { AVATAR_SETS } from '../data/avatars.js';

// Small popover to manually pick an avatar for a participant.
export default function AvatarPicker({ current, onSelect, onClose }) {
  return (
    <div className="avatar-picker" onClick={(e) => e.stopPropagation()}>
      {Object.entries(AVATAR_SETS).map(([set, items]) => (
        <div key={set} className="avatar-picker-group">
          <span className="avatar-picker-label">{set}</span>
          <div className="avatar-picker-grid">
            {items.map((item) => {
              const active =
                current && current.set === set && current.key === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`avatar-picker-item ${active ? 'is-active' : ''}`}
                  title={item.label}
                  onClick={() => {
                    onSelect({ set, ...item });
                    onClose();
                  }}
                >
                  <Avatar avatar={{ set, ...item }} size={40} ring={false} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ParticipantRow({ participant, index, dispatch }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <li className="participant-row" style={{ '--accent': participant.color }}>
      <span className="participant-index">{index + 1}</span>
      <div className="participant-avatar-wrap">
        <button
          type="button"
          className="participant-avatar-btn"
          title="Avatar manuell wählen"
          onClick={() => setPickerOpen((v) => !v)}
        >
          <Avatar avatar={participant.avatar} color={participant.color} size={46} />
        </button>
        {pickerOpen && (
          <>
            <div className="avatar-picker-backdrop" onClick={() => setPickerOpen(false)} />
            <AvatarPicker
              current={participant.avatar}
              onSelect={(avatar) =>
                dispatch({ type: 'SET_AVATAR', id: participant.id, avatar })
              }
              onClose={() => setPickerOpen(false)}
            />
          </>
        )}
      </div>
      <input
        className="participant-name-input"
        value={participant.name}
        placeholder="Name"
        onChange={(e) =>
          dispatch({ type: 'RENAME_PARTICIPANT', id: participant.id, name: e.target.value })
        }
      />
      <button
        type="button"
        className="icon-btn"
        title="Zufälliger Avatar"
        onClick={() => dispatch({ type: 'SHUFFLE_AVATAR', id: participant.id })}
      >
        🎲
      </button>
      <button
        type="button"
        className="icon-btn icon-btn-danger"
        title="Teilnehmer entfernen"
        onClick={() => dispatch({ type: 'REMOVE_PARTICIPANT', id: participant.id })}
      >
        ✕
      </button>
    </li>
  );
}
