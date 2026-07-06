import { useEffect, useRef } from 'react';

const COLORS = ['#22d3ee', '#facc15', '#7dd3fc', '#f472b6', '#2dd4bf', '#a78bfa', '#fb923c'];

// Lightweight, dependency-free confetti rendered on a full-screen canvas.
export default function Confetti({ active = true }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!active) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const count = Math.min(220, Math.floor(width / 8));
    const pieces = Array.from({ length: count }, () => spawn(width, height, true));

    function spawn(w, h, initial) {
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h - h : -20,
        r: 4 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: -1.5 + Math.random() * 3,
        vy: 2 + Math.random() * 3.5,
        angle: Math.random() * Math.PI * 2,
        spin: -0.2 + Math.random() * 0.4,
      };
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        if (p.y > height + 20) Object.assign(p, spawn(width, height, false));
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
        ctx.restore();
      });
      rafRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />;
}
