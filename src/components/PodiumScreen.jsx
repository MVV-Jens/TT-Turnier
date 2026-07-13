import Avatar from './Avatar.jsx';
import Confetti from './Confetti.jsx';
import { getPodium } from '../logic/engine.js';

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

// Closing podium screen: top 3 (place 3 may be shared by both semifinalists).
export default function PodiumScreen({ live, participantsById, title }) {
  const podium = getPodium(live);
  if (podium.length < 2) return null;

  const byPlace = { 1: [], 2: [], 3: [] };
  podium.forEach((p) => {
    if (byPlace[p.place]) byPlace[p.place].push(participantsById[p.id]);
  });
  // Visual order: 2nd, 1st, 3rd (classic podium).
  const columns = [
    { place: 2, players: byPlace[2] },
    { place: 1, players: byPlace[1] },
    { place: 3, players: byPlace[3] },
  ].filter((c) => c.players.length > 0);

  return (
    <div className="beamer-screen podium-screen">
      <Confetti active />
      <header className="beamer-header compact">
        <h1 className="event-title">Endstand</h1>
        <span className="event-meta">{title}</span>
      </header>
      <div className="podium-row">
        {columns.map((col) => (
          <div key={col.place} className={`podium-col podium-${col.place}`}>
            <div className="podium-medal">{MEDALS[col.place]}</div>
            <div className="podium-players">
              {col.players.map((p) => (
                <div key={p?.id ?? Math.random()} className="podium-player" style={{ '--accent': p?.color }}>
                  <Avatar avatar={p?.avatar} color={p?.color} size="clamp(52px, 11vh, 130px)" />
                  <span className="podium-name">{p?.name ?? '—'}</span>
                </div>
              ))}
            </div>
            <div className="podium-block">
              <span className="podium-place">{col.place}.</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
