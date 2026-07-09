import { useEffect, useMemo, useState } from 'react';
import Avatar from './Avatar.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import CrownTiebreakDialog from './CrownTiebreakDialog.jsx';
import { planCrownKo, formatClock } from '../logic/crowns.js';

function useTicker(active) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

export default function CrownBoard({ state, dispatch, live, participantsById }) {
  const [tiebreak, setTiebreak] = useState(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const now = useTicker(true);

  const { startedAt, durationMin, useTimer, advance } = live;
  const crownsLog = state.kotb?.crowns || [];

  const tally = useMemo(() => {
    const t = {};
    crownsLog.forEach((id) => {
      t[id] = (t[id] || 0) + 1;
    });
    return t;
  }, [crownsLog]);

  const lastCrown = participantsById[live.lastCrownId];
  const remainingMs = useTimer && startedAt ? startedAt + durationMin * 60000 - now : null;
  const elapsedMs = startedAt ? now - startedAt : 0;
  const overtime = remainingMs != null && remainingMs <= 0;

  const startKo = () => {
    const plan = planCrownKo(live.crownStandings, advance);
    if (plan.needsDecision) {
      setTiebreak(plan);
    } else {
      dispatch({ type: 'KOTB_START_KO', koOrder: plan.defaultQualifiers });
    }
    setConfirmEnd(false);
  };

  const resolveTiebreak = (chosen) => {
    const koOrder = tiebreak.autoQualifiers.concat(chosen);
    dispatch({ type: 'KOTB_START_KO', koOrder });
    setTiebreak(null);
  };

  return (
    <section className="panel crown-board">
      <div className="panel-head">
        <h2 className="panel-title">Kronen vergeben</h2>
        <span className={`crown-timer ${overtime ? 'is-over' : ''}`}>
          {useTimer
            ? overtime
              ? '⏱ Zeit um!'
              : `⏱ ${formatClock(remainingMs)}`
            : `⏱ ${formatClock(elapsedMs)}`}
        </span>
      </div>

      <p className="hint">
        Tippe <strong>+1 👑</strong>, sobald jemand 2 Punkte in Folge gemacht hat.
        {lastCrown && (
          <>
            {' '}Zuletzt gekrönt: <strong>👑 {lastCrown.name}</strong>
          </>
        )}
      </p>

      <div className="crown-award-grid">
        {state.participants.map((p) => (
          <div className="crown-award-row" key={p.id} style={{ '--accent': p.color }}>
            <Avatar avatar={p.avatar} color={p.color} size={44} />
            <span className="crown-award-name">{p.name}</span>
            <span className="crown-award-count">👑 {tally[p.id] || 0}</span>
            <button
              type="button"
              className="crown-minus"
              aria-label={`Krone von ${p.name} entfernen`}
              disabled={!tally[p.id]}
              onClick={() => dispatch({ type: 'KOTB_REMOVE', playerId: p.id })}
            >
              −
            </button>
            <button
              type="button"
              className="crown-plus"
              onClick={() => dispatch({ type: 'KOTB_AWARD', playerId: p.id })}
            >
              +1 👑
            </button>
          </div>
        ))}
      </div>

      <div className="control-row">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={crownsLog.length === 0}
          onClick={() => dispatch({ type: 'KOTB_UNDO' })}
        >
          ↶ Letzte Krone rückgängig
        </button>
        <button
          type="button"
          className="btn btn-accent"
          onClick={() => setConfirmEnd(true)}
        >
          🏁 Kronenphase beenden → K.o.
        </button>
      </div>

      <ConfirmDialog
        open={confirmEnd}
        title="Kronenphase beenden?"
        message={`Die besten ${advance} Kronen-Sammler ziehen ins K.o. ein. Danach werden keine Kronen mehr vergeben.`}
        confirmLabel="K.o. starten"
        cancelLabel="Weiter sammeln"
        onConfirm={startKo}
        onCancel={() => setConfirmEnd(false)}
      />

      <CrownTiebreakDialog
        open={Boolean(tiebreak)}
        plan={tiebreak}
        participantsById={participantsById}
        onConfirm={resolveTiebreak}
        onCancel={() => setTiebreak(null)}
      />
    </section>
  );
}
