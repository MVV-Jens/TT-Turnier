import { useMemo } from 'react';
import Avatar from './Avatar.jsx';
import Confetti from './Confetti.jsx';
import { randomWinnerQuote } from '../data/content.js';

export default function WinnerScreen({ champion, title }) {
  const quote = useMemo(() => randomWinnerQuote(), [champion?.id]);

  if (!champion) return null;

  return (
    <div className="beamer-screen winner-screen" style={{ '--accent': champion.color }}>
      <Confetti active />
      <div className="winner-content">
        <div className="winner-trophy">🏆</div>
        <span className="winner-kicker">Champion · {title || 'VR Tischtennis Cup'}</span>
        <div className="winner-avatar">
          <Avatar avatar={champion.avatar} color={champion.color} size={260} />
        </div>
        <h1 className="winner-name">{champion.name}</h1>
        <p className="winner-quote">„{quote}“</p>
      </div>
    </div>
  );
}
