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
      // Keep balls out of the actual text area (measured live + padded).
      const content =
        canvas.parentElement && canvas.parentElement.querySelector('.motivation-content');
      const rect = content ? content.getBoundingClientRect() : null;
      const pad = 30;

      balls.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < b.r || b.x > width - b.r) b.vx *= -1;
        if (b.y < b.r || b.y > height - b.r) b.vy *= -1;
        b.x = Math.max(b.r, Math.min(width - b.r, b.x));
        b.y = Math.max(b.r, Math.min(height - b.r, b.y));

        // Bounce off the text zone (treated as a solid obstacle).
        if (rect) {
          const exL = rect.left - pad;
          const exR = rect.right + pad;
          const exT = rect.top - pad;
          const exB = rect.bottom + pad;
          if (b.x + b.r > exL && b.x - b.r < exR && b.y + b.r > exT && b.y - b.r < exB) {
            const dl = b.x + b.r - exL;
            const dr = exR - (b.x - b.r);
            const dt = b.y + b.r - exT;
            const db = exB - (b.y - b.r);
            const min = Math.min(dl, dr, dt, db);
            if (min === dl) {
              b.x = exL - b.r;
              b.vx = -Math.abs(b.vx);
            } else if (min === dr) {
              b.x = exR + b.r;
              b.vx = Math.abs(b.vx);
            } else if (min === dt) {
              b.y = exT - b.r;
              b.vy = -Math.abs(b.vy);
            } else {
              b.y = exB + b.r;
              b.vy = Math.abs(b.vy);
            }
          }
        }

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
