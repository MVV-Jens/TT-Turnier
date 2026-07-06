import { useEffect, useState } from 'react';
import MatchDashboard from './MatchDashboard.jsx';
import BracketView from './BracketView.jsx';
import SlushieBreak from './SlushieBreak.jsx';
import WinnerScreen from './WinnerScreen.jsx';
import { getChampion } from '../logic/tournament.js';

const SWITCH_INTERVAL = 20000; // 20 seconds

export default function BeamerView({ state, matches, participantsById }) {
  const [view, setView] = useState('dashboard');
  const champion = participantsById[getChampion(matches)];
  const showLoop = !champion && !state.slushieBreak;

  // Auto-switch dashboard <-> bracket every 20s while the loop is active.
  useEffect(() => {
    if (!showLoop) return undefined;
    const id = setInterval(() => {
      setView((v) => (v === 'dashboard' ? 'bracket' : 'dashboard'));
    }, SWITCH_INTERVAL);
    return () => clearInterval(id);
  }, [showLoop]);

  if (champion) {
    return <WinnerScreen champion={champion} />;
  }

  if (state.slushieBreak) {
    return <SlushieBreak />;
  }

  if (!state.draw) {
    return (
      <div className="beamer-screen dashboard">
        <header className="beamer-header">
          <h1 className="event-title">VR Tischtennis Cup</h1>
          <span className="event-meta">13.07.2026 · 16:30 Uhr</span>
        </header>
        <div className="dash-idle">
          <p className="dash-idle-text">Turnier wird vorbereitet …</p>
          <p className="dash-idle-sub">Teilnehmer erfassen und auslosen im Admin-Bereich.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="beamer-wrap">
      <div className="beamer-fade" key={view}>
        {view === 'dashboard' ? (
          <MatchDashboard matches={matches} participantsById={participantsById} />
        ) : (
          <BracketView matches={matches} participantsById={participantsById} />
        )}
      </div>
      <div className="view-dots" aria-hidden="true">
        <span className={view === 'dashboard' ? 'dot active' : 'dot'} />
        <span className={view === 'bracket' ? 'dot active' : 'dot'} />
      </div>
    </div>
  );
}
