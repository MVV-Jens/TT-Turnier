import Avatar from './Avatar.jsx';

// Brief "player vs player" intro shown when a new match starts (single table).
export default function MatchIntro({ match, participantsById }) {
  const a = participantsById[match.playerA];
  const b = participantsById[match.playerB];
  return (
    <div className="beamer-screen match-intro">
      <div className="intro-phase">{match.roundName}</div>
      <div className="intro-row">
        <div className="intro-player intro-left" style={{ '--accent': a?.color }}>
          <Avatar avatar={a?.avatar} color={a?.color} size="clamp(90px, 24vh, 260px)" />
          <span className="intro-name">{a?.name ?? 'TBD'}</span>
        </div>
        <div className="intro-vs">VS</div>
        <div className="intro-player intro-right" style={{ '--accent': b?.color }}>
          <Avatar avatar={b?.avatar} color={b?.color} size="clamp(90px, 24vh, 260px)" />
          <span className="intro-name">{b?.name ?? 'TBD'}</span>
        </div>
      </div>
      <div className="intro-sub">
        {match.bestOf === 3 ? 'Best of 3 · bis 11' : `bis ${match.target} Punkte`}
      </div>
    </div>
  );
}
