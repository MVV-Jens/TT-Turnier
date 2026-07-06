import { useEffect, useRef, useState } from 'react';
import MatchDashboard from './MatchDashboard.jsx';
import BracketView from './BracketView.jsx';
import SlushieBreak from './SlushieBreak.jsx';
import WinnerScreen from './WinnerScreen.jsx';
import MatchCelebration from './MatchCelebration.jsx';
import { getChampion, FINAL_MATCH_ID } from '../logic/tournament.js';

const SWITCH_INTERVAL = 20000; // 20 seconds
const CELEBRATE_MS = 5000; // confetti celebration screen
const HIGHLIGHT_MS = 7000; // animated bracket highlight afterwards

// Derive the current view from the shared wall clock so that every beamer
// window flips at the exact same moment – no cross-window messaging needed.
function viewForNow() {
  return Math.floor(Date.now() / SWITCH_INTERVAL) % 2 === 0 ? 'dashboard' : 'bracket';
}

export default function BeamerView({ state, matches, participantsById }) {
  const [view, setView] = useState(viewForNow);
  const [celebration, setCelebration] = useState(null); // { matchId, winner, scoreText, roundName }
  const [highlightId, setHighlightId] = useState(null);
  const seenRef = useRef(null);

  const champion = participantsById[getChampion(matches)];

  // Detect a newly won match (excluding the final – that triggers the big
  // WinnerScreen instead) and kick off the celebration sequence.
  useEffect(() => {
    const finished = matches.filter((m) => !m.bye && m.winner);
    const finishedIds = new Set(finished.map((m) => m.id));

    if (seenRef.current === null) {
      // First render: remember what's already done without celebrating.
      seenRef.current = finishedIds;
      return;
    }

    const newlyWon = finished.filter(
      (m) => !seenRef.current.has(m.id) && m.id !== FINAL_MATCH_ID,
    );
    seenRef.current = finishedIds;

    const latest = newlyWon[newlyWon.length - 1];
    const winner = latest && participantsById[latest.winner];
    if (winner) {
      const scoreText =
        latest.winner === latest.playerA
          ? `${latest.scoreA}:${latest.scoreB}`
          : `${latest.scoreB}:${latest.scoreA}`;
      setHighlightId(null);
      setCelebration({ matchId: latest.id, winner, scoreText, roundName: latest.roundName });
    }
  }, [matches, participantsById]);

  // Celebration → animated bracket highlight → back to normal loop.
  useEffect(() => {
    if (!celebration) return undefined;
    const id = setTimeout(() => {
      setHighlightId(celebration.matchId);
      setView('bracket');
      setCelebration(null);
    }, CELEBRATE_MS);
    return () => clearTimeout(id);
  }, [celebration]);

  useEffect(() => {
    if (!highlightId) return undefined;
    const id = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
    return () => clearTimeout(id);
  }, [highlightId]);

  // Clear any celebration when the bracket is reset/redrawn.
  useEffect(() => {
    if (!state.draw) {
      setCelebration(null);
      setHighlightId(null);
    }
  }, [state.draw]);

  const showLoop =
    !champion && !state.slushieBreak && !celebration && !highlightId;

  // Auto-switch dashboard <-> bracket, aligned to 20s wall-clock boundaries.
  useEffect(() => {
    if (!showLoop) return undefined;
    setView(viewForNow());
    let timeoutId;
    const scheduleNext = () => {
      const msToBoundary = SWITCH_INTERVAL - (Date.now() % SWITCH_INTERVAL);
      timeoutId = setTimeout(() => {
        setView(viewForNow());
        scheduleNext();
      }, msToBoundary);
    };
    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, [showLoop]);

  if (champion) {
    return <WinnerScreen champion={champion} />;
  }

  if (celebration) {
    return <MatchCelebration {...celebration} />;
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
      <div className="beamer-fade" key={`${view}-${highlightId ?? ''}`}>
        {view === 'dashboard' ? (
          <MatchDashboard matches={matches} participantsById={participantsById} />
        ) : (
          <BracketView
            matches={matches}
            participantsById={participantsById}
            highlightId={highlightId}
          />
        )}
      </div>
      <div className="view-dots" aria-hidden="true">
        <span className={view === 'dashboard' ? 'dot active' : 'dot'} />
        <span className={view === 'bracket' ? 'dot active' : 'dot'} />
      </div>
    </div>
  );
}
