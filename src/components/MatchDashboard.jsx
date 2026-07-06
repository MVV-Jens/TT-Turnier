import Avatar from './Avatar.jsx';
import { getCurrentMatch, getNextMatch } from '../logic/engine.js';

const EVENT_LABEL = '13.07.2026 · 16:30 Uhr';

function BigPlayer({ player, align }) {
  return (
    <div className={`dash-player dash-player-${align}`} style={{ '--accent': player?.color }}>
      <Avatar avatar={player?.avatar} color={player?.color} size="clamp(88px, 22vh, 240px)" />
      <span className="dash-player-name">{player?.name ?? 'TBD'}</span>
    </div>
  );
}

export default function MatchDashboard({ live, participantsById }) {
  const { matches, champion: championId, progress } = live;
  const champion = participantsById[championId];
  const current = getCurrentMatch(matches);
  const next = getNextMatch(matches, current?.id);

  const nextA = participantsById[next?.playerA];
  const nextB = participantsById[next?.playerB];

  return (
    <div className="beamer-screen dashboard">
      <header className="beamer-header">
        <h1 className="event-title">VR Tischtennis Cup</h1>
        <span className="event-meta">{EVENT_LABEL}</span>
      </header>

      {current ? (
        <>
          <div className="phase-banner">{current.roundName}</div>
          <div className="dash-match">
            <BigPlayer player={participantsById[current.playerA]} align="left" />
            <div className="dash-versus">
              <span className="dash-vs-text">VS</span>
              <span className="dash-target">
                {current.bestOf === 3 ? 'Best of 3 · bis 11' : `bis ${current.target} Punkte`}
              </span>
            </div>
            <BigPlayer player={participantsById[current.playerB]} align="right" />
          </div>
        </>
      ) : champion ? (
        <div className="dash-idle">
          <div className="phase-banner">Turnier beendet</div>
          <p className="dash-idle-text">🏆 {champion.name} ist Champion</p>
        </div>
      ) : (
        <div className="dash-idle">
          <p className="dash-idle-text">Bereit für den ersten Aufschlag …</p>
        </div>
      )}

      <footer className="dash-footer">
        <div className="next-match">
          <span className="next-label">Als Nächstes</span>
          {next ? (
            <div className="next-players">
              <Avatar avatar={nextA?.avatar} color={nextA?.color} size="clamp(38px, 6vh, 56px)" />
              <span className="next-name">{nextA?.name ?? 'Sieger'}</span>
              <span className="next-vs">vs</span>
              <span className="next-name">{nextB?.name ?? 'Sieger'}</span>
              <Avatar avatar={nextB?.avatar} color={nextB?.color} size="clamp(38px, 6vh, 56px)" />
              <span className="next-round">{next.roundName}</span>
            </div>
          ) : (
            <span className="next-name muted">—</span>
          )}
        </div>

        <div className="progress-block">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
          </div>
          <span className="progress-text">
            {progress.played} / {progress.total} Spiele · {progress.percent}%
          </span>
        </div>
      </footer>
    </div>
  );
}
