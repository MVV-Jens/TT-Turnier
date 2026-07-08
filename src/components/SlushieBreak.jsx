import { useEffect, useRef } from 'react';

// Falling snowflakes / slushie sparkle animation.
function Snow() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const flakes = Array.from({ length: 120 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1.5 + Math.random() * 4,
      vy: 0.5 + Math.random() * 1.8,
      vx: -0.4 + Math.random() * 0.8,
      o: 0.4 + Math.random() * 0.6,
    }));

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      flakes.forEach((f) => {
        f.y += f.vy;
        f.x += f.vx;
        if (f.y > height + 5) {
          f.y = -5;
          f.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186, 230, 253, ${f.o})`;
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

export default function SlushieBreak() {
  return (
    <div className="beamer-screen slushie-screen">
      <Snow />
      <div className="slushie-content">
        <div className="slushie-emoji">🥤❄️🧊</div>
        <h1 className="slushie-title">Slushie Break</h1>
        <p className="slushie-text">Gleich geht's weiter. Zeit für Nachschub.</p>
      </div>
    </div>
  );
}
