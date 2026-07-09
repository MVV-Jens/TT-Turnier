import { useEffect, useState } from 'react';
import Avatar from './Avatar.jsx';
import { formatClock } from '../logic/crowns.js';
import { CROWN_QUOTES } from '../data/crownQuotes.js';

const QUOTE_CYCLE_MS = 30000; // a new quote appears every 30 seconds
const QUOTE_SHOW_MS = 10000; // ...and stays visible for 10 seconds

function useTicker(active) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

export default function CrownBeamer({ live, participantsById, title = 'VR Tischtennis Cup' }) {
  const now = useTicker(true);
  const [bumpId, setBumpId] = useState(null);

  const { startedAt, durationMin, useTimer, advance } = live;
  const standings = live.crownStandings || [];

  // Pulse the row that just earned a crown (re-triggers on every award via count).
  useEffect(() => {
    if (!live.lastCrownId) return undefined;
    setBumpId(live.lastCrownId);
    const t = setTimeout(() => setBumpId(null), 1400);
    return () => clearTimeout(t);
  }, [live.crownCount, live.lastCrownId]);

  const remainingMs = useTimer && startedAt ? startedAt + durationMin * 60000 - now : null;
  const elapsedMs = startedAt ? now - startedAt : 0;
  const overtime = remainingMs != null && remainingMs <= 0;
  const showCutoff = advance < standings.length;

  // Motivational quote ticker: every 30s a new quote shows for 10s, derived from
  // the wall clock so all beamer windows stay in sync. Edit src/data/crownQuotes.js.
  const hasQuotes = CROWN_QUOTES.length > 0;
  const quoteVisible = hasQuotes && now % QUOTE_CYCLE_MS < QUOTE_SHOW_MS;
  const quote = hasQuotes
    ? CROWN_QUOTES[Math.floor(now / QUOTE_CYCLE_MS) % CROWN_QUOTES.length]
    : '';

  return (
    <div className="beamer-screen crown-beamer">
      <div className="crown-side crown-clock-side">
        <header className="beamer-header compact">
          <h1 className="event-title">{title}</h1>
          <span className="event-meta">👑 Kronen sammeln</span>
        </header>

        <div className={`crown-clock ${overtime ? 'is-over' : ''}`}>
          {useTimer ? (
            overtime ? (
              <>
                <span className="crown-clock-time">Zeit um!</span>
                <span className="crown-clock-label">Letzte Punkte – dann K.o.</span>
              </>
            ) : (
              <>
                <span className="crown-clock-time">{formatClock(remainingMs)}</span>
                <span className="crown-clock-label">verbleibend</span>
              </>
            )
          ) : (
            <>
              <span className="crown-clock-time">{formatClock(elapsedMs)}</span>
              <span className="crown-clock-label">gespielt</span>
            </>
          )}
          <div className={`crown-quote ${quoteVisible ? 'is-visible' : ''}`} aria-live="polite">
            „{quote}“
          </div>
        </div>

        <div className="crown-clock-foot">
          <p className="crown-rule">2 Punkte in Folge = 1 👑</p>
          <p className="crown-count-note">
            {live.crownCount} {live.crownCount === 1 ? 'Krone' : 'Kronen'} vergeben · Top {advance} kommen ins K.o.
          </p>
        </div>
      </div>

      <div className="crown-side crown-rank-side">
        <h2 className="crown-rank-title">👑 Kronen-Ranking</h2>
        <div className="crown-rank-list" style={{ '--rows': standings.length || 1 }}>
          {showCutoff && (
            <div
              className="crown-cutoff-line"
              style={{ '--cut': advance }}
              aria-hidden="true"
            >
              <span>K.o.-Grenze</span>
            </div>
          )}
          {standings.map((row, i) => {
            const p = participantsById[row.id];
            const qualified = i < advance;
            return (
              <div
                key={row.id}
                className={`crown-rank-row ${qualified ? 'is-qualified' : ''} ${i === 0 && row.crowns > 0 ? 'is-leader' : ''} ${bumpId === row.id ? 'is-bumped' : ''}`}
                style={{ '--i': i, '--accent': p?.color }}
              >
                <span className="crown-rank-num">{i + 1}</span>
                <Avatar avatar={p?.avatar} color={p?.color} size="clamp(26px, 4vh, 46px)" />
                <span className="crown-rank-name">{p?.name ?? '—'}</span>
                <span className="crown-rank-crowns">
                  <span className="crown-rank-emoji">👑</span>
                  {row.crowns}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
