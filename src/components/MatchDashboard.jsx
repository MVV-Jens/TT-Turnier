import Avatar from './Avatar.jsx';
import { getCurrentMatches, getNextMatch } from '../logic/engine.js';

function BigPlayer({ player, align }) {
  return (
    <div className={`dash-player dash-player-${align}`} style={{ '--accent': player?.color }}>
      <Avatar avatar={player?.avatar} color={player?.color} size="clamp(88px, 22vh, 240px)" />
      <span className="dash-player-name">{player?.name ?? 'TBD'}</span>
    </div>
  );
}

function TableCard({ match, index, participantsById }) {
  const a = participantsById[match.playerA];
  const b = participantsById[match.playerB];
  return (
    <div className="table-card">
      <div className="table-card-head">Platte {index + 1}</div>
      <div className="table-card-body">
        <div className="table-player" style={{ '--accent': a?.color }}>
          <Avatar avatar={a?.avatar} color={a?.color} size="clamp(48px, 12vh, 130px)" />
          <span className="table-name">{a?.name ?? 'TBD'}</span>
        </div>
        <span className="table-vs">VS</span>
        <div className="table-player" style={{ '--accent': b?.color }}>
          <Avatar avatar={b?.avatar} color={b?.color} size="clamp(48px, 12vh, 130px)" />
          <span className="table-name">{b?.name ?? 'TBD'}</span>
        </div>
      </div>
      <div className="table-card-foot">{match.roundName}</div>
    </div>
  );
}

export default function MatchDashboard({ live, participantsById, title = 'VR Tischtennis Cup', tables = 1 }) {
  const { matches, champion: championId, progress } = live;
  const champion = participantsById[championId];
  const currents = getCurrentMatches(matches, Math.max(1, tables));
  const multi = tables > 1 && currents.length > 1;
  const current = currents[0] || null;
  const currentIds = new Set(currents.map((m) => m.id));
  const next =
    matches.find(
      (m) => !m.bye && !m.winner && m.playerA && m.playerB && !currentIds.has(m.id),
    ) || getNextMatch(matches, current?.id);

  const nextA = participantsById[next?.playerA];
  const nextB = participantsById[next?.playerB];

  return (
    <div className="beamer-screen dashboard">
      <header className="beamer-header">
        <h1 className="event-title">{title}</h1>
      </header>

      {multi ? (
        <div className="dash-tables">
          <div className="phase-banner">{current.roundName}</div>
          <div className={`tables-grid tables-${Math.min(currents.length, 4)}`}>
            {currents.map((m, i) => (
              <TableCard key={m.id} match={m} index={i} participantsById={participantsById} />
            ))}
          </div>
        </div>
      ) : current ? (
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
