import { useEffect, useRef, useState } from 'react';
import { MOTIVATION_QUOTES } from '../data/content.js';

const ROTATE_MS = 6000;

// Synced to the shared wall clock so every beamer window shows the same quote.
function quoteIndexForNow() {
  return Math.floor(Date.now() / ROTATE_MS) % MOTIVATION_QUOTES.length;
}

// Energetic bouncing table-tennis balls in the background.
function BouncingBalls() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const count = Math.max(9, Math.floor(width / 130));
    const balls = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 8 + Math.random() * 16,
      vx: (-1 + Math.random() * 2) * 2.6,
      vy: (-1 + Math.random() * 2) * 2.6,
    }));

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      balls.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < b.r || b.x > width - b.r) b.vx *= -1;
        if (b.y < b.r || b.y > height - b.r) b.vy *= -1;
        b.x = Math.max(b.r, Math.min(width - b.r, b.x));
        b.y = Math.max(b.r, Math.min(height - b.r, b.y));
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.92)';
        ctx.shadowColor = 'rgba(250, 204, 21, 0.6)';
        ctx.shadowBlur = 22;
        ctx.fill();
        ctx.shadowBlur = 0;
        // little shine
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fill();
      });
      rafRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />;
}

export default function MotivationBreak() {
  const [idx, setIdx] = useState(quoteIndexForNow);

  // Advance to the next quote aligned to the shared 6s boundaries.
  useEffect(() => {
    let timeoutId;
    const scheduleNext = () => {
      const msToBoundary = ROTATE_MS - (Date.now() % ROTATE_MS);
      timeoutId = setTimeout(() => {
        setIdx(quoteIndexForNow());
        scheduleNext();
      }, msToBoundary);
    };
    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="beamer-screen motivation-screen">
      <BouncingBalls />
      <div className="motivation-content">
        <div className="motivation-emoji">🏓⚡🔥</div>
        <span className="motivation-kicker">MVV Motivation</span>
        <p className="motivation-quote" key={idx}>
          {MOTIVATION_QUOTES[idx]}
        </p>
      </div>
    </div>
  );
}
