import Avatar from './Avatar.jsx';
import Confetti from './Confetti.jsx';

// Short celebration shown on the beamer whenever a match is won.
export default function MatchCelebration({ winner, scoreText, roundName }) {
  if (!winner) return null;
  return (
    <div className="beamer-screen celebration-screen" style={{ '--accent': winner.color }}>
      <Confetti active />
      <div className="celebration-content">
        <span className="celebration-kicker">{roundName} entschieden</span>
        <div className="celebration-emoji">🎉</div>
        <div className="celebration-avatar">
          <Avatar avatar={winner.avatar} color={winner.color} size={230} />
        </div>
        <h1 className="celebration-name">{winner.name}</h1>
        {scoreText && <p className="celebration-score">gewinnt {scoreText}</p>}
        <p className="celebration-advances">zieht in die nächste Runde ein</p>
      </div>
    </div>
  );
}
