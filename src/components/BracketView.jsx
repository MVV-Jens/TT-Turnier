import Avatar from './Avatar.jsx';
import { getCurrentMatch, matchesByRound } from '../logic/tournament.js';

function BracketPlayer({ player, score, isWinner, isBye, placeholder }) {
  return (
    <div
      className={`bracket-player ${isWinner ? 'is-winner' : ''} ${isBye ? 'is-bye' : ''}`}
      style={{ '--accent': player?.color }}
    >
      {player ? (
        <Avatar avatar={player.avatar} color={player.color} size={34} />
      ) : (
        <span className="bracket-avatar-empty">{isBye ? '—' : '?'}</span>
      )}
      <span className="bracket-name">
        {player ? player.name : isBye ? 'Freilos' : placeholder}
      </span>
      <span className="bracket-score">{score != null ? score : ''}</span>
    </div>
  );
}

function BracketMatch({ match, participantsById, isCurrent, isJustWon }) {
  const a = participantsById[match.playerA];
  const b = participantsById[match.playerB];
  const done = Boolean(match.winner) && !match.bye;
  const isBye = match.bye;

  let statusClass = 'is-open';
  if (isBye) statusClass = 'is-bye-match';
  else if (done) statusClass = 'is-done';
  else if (isCurrent) statusClass = 'is-current';
  if (isJustWon) statusClass += ' is-just-won';

  return (
    <div className={`bracket-match ${statusClass}`}>
      <div className="bracket-match-status">
        {isJustWon ? '🎉 Sieg' : isBye ? 'Freilos' : done ? '✓' : isCurrent ? 'LIVE' : 'offen'}
      </div>
      <BracketPlayer
        player={a}
        score={match.scoreA}
        isWinner={match.winner && match.winner === match.playerA}
        isBye={isBye && !match.playerA}
        placeholder="Sieger"
      />
      <BracketPlayer
        player={b}
        score={match.scoreB}
        isWinner={match.winner && match.winner === match.playerB}
        isBye={isBye}
        placeholder="Sieger"
      />
    </div>
  );
}

export default function BracketView({ matches, participantsById, highlightId = null }) {
  const rounds = matchesByRound(matches);
  const current = getCurrentMatch(matches);

  return (
    <div className="beamer-screen bracket-screen">
      <header className="beamer-header compact">
        <h1 className="event-title">Turnierbaum</h1>
        <span className="event-meta">VR Tischtennis Cup · 16er K.o.</span>
      </header>

      <div className="bracket-grid">
        {rounds.map((round) => (
          <div key={round.key} className={`bracket-col col-${round.key}`}>
            <div className="bracket-col-title">{round.name}</div>
            <div className="bracket-col-matches">
              {round.matches.map((m) => (
                <BracketMatch
                  key={m.id}
                  match={m}
                  participantsById={participantsById}
                  isCurrent={current?.id === m.id}
                  isJustWon={highlightId === m.id}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
