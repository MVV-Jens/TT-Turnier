import { useMemo } from 'react';
import Avatar from './Avatar.jsx';
import Confetti from './Confetti.jsx';
import { randomWinnerQuote } from '../data/content.js';

// Renders the champion card to an offscreen canvas and triggers a PNG download.
function exportImage(champion, quote, title) {
  const w = 1280;
  const h = 720;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Background gradient.
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0a0f24');
  grad.addColorStop(1, '#12173a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 40px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#22d3ee';
  ctx.fillText((title || 'VR Tischtennis Cup').toUpperCase(), w / 2, 90);

  ctx.font = '120px "Segoe UI Emoji", system-ui, sans-serif';
  ctx.fillText('🏆', w / 2, 210);

  ctx.font = '150px "Segoe UI Emoji", system-ui, sans-serif';
  ctx.fillText(champion.avatar?.emoji ?? '🏓', w / 2, 360);

  ctx.font = 'bold 90px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#facc15';
  ctx.fillText(champion.name, w / 2, 490);

  ctx.font = '38px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#e5ecff';
  ctx.fillText('Champion', w / 2, 560);

  ctx.font = 'italic 34px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#7dd3fc';
  ctx.fillText(quote, w / 2, 630);

  const link = document.createElement('a');
  link.download = `vr-tt-cup-champion-${champion.name}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

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
        <button
          type="button"
          className="btn btn-accent btn-lg winner-export"
          onClick={() => exportImage(champion, quote, title)}
        >
          📸 Als Bild speichern
        </button>
      </div>
    </div>
  );
}
