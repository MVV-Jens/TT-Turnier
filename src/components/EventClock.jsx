import { useEffect, useState } from 'react';

function fmt(min) {
  const m = Math.max(0, Math.floor(min));
  return `${m}`;
}

// Small live event clock: elapsed vs. the configured time window.
export default function EventClock({ startedAt, minutes }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!startedAt || !minutes) return null;
  const elapsedMin = (now - startedAt) / 60000;
  const pct = Math.min(100, (elapsedMin / minutes) * 100);
  const over = elapsedMin > minutes;

  return (
    <div className={`event-clock ${over ? 'is-over' : ''}`} aria-hidden="true">
      <span className="event-clock-time">
        ⏱ {fmt(elapsedMin)}<span className="event-clock-sep"> / </span>{minutes}
        <span className="event-clock-unit"> Min</span>
      </span>
      <span className="event-clock-track">
        <span className="event-clock-fill" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}
