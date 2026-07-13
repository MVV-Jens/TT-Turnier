import { useEffect, useRef, useState } from 'react';
import MatchDashboard from './MatchDashboard.jsx';
import BracketView from './BracketView.jsx';
import StandingsView from './StandingsView.jsx';
import GroupsView from './GroupsView.jsx';
import SlushieBreak from './SlushieBreak.jsx';
import MotivationBreak from './MotivationBreak.jsx';
import WinnerScreen from './WinnerScreen.jsx';
import MatchCelebration from './MatchCelebration.jsx';
import CrownBeamer from './CrownBeamer.jsx';
import EventClock from './EventClock.jsx';
import MatchIntro from './MatchIntro.jsx';
import PodiumScreen from './PodiumScreen.jsx';
import { MODES } from '../logic/formats.js';
import { getPodium } from '../logic/engine.js';
import { playDing, playFanfare, playWhoosh } from '../logic/sound.js';

const SWITCH_INTERVAL = 20000; // 20 seconds
const CELEBRATE_MS = 5000; // confetti celebration screen
const HIGHLIGHT_MS = 7000; // animated highlight afterwards
const INTRO_MS = 3600; // match intro overlay

// Derive the current view from the shared wall clock so that every beamer
// window flips at the exact same moment – no cross-window messaging needed.
function viewForNow() {
  return Math.floor(Date.now() / SWITCH_INTERVAL) % 2 === 0 ? 'dashboard' : 'overview';
}

function Overview({ live, participantsById, highlightId, currentId, title }) {
  const { format, matches, groups, standings } = live;
  const koMatches = matches.filter((m) => m.phase === 'ko');
  const currentIds = currentId
    ? [matches.find((m) => m.id === currentId)?.playerA, matches.find((m) => m.id === currentId)?.playerB]
    : [];

  switch (format) {
    case 'ko':
      return (
        <BracketView
          matches={matches}
          participantsById={participantsById}
          highlightId={highlightId}
          subtitle={`${title} · K.o.`}
        />
      );
    case 'kotb':
      return (
        <BracketView
          matches={matches}
          participantsById={participantsById}
          highlightId={highlightId}
          subtitle="K.o. der Kronen-Besten"
        />
      );
    case 'round_robin':
      return (
        <StandingsView
          standings={standings}
          participantsById={participantsById}
          currentIds={currentIds}
          title="Tabelle"
          subtitle="Jeder gegen Jeden"
        />
      );
    case 'swiss':
      return (
        <StandingsView
          standings={standings}
          participantsById={participantsById}
          currentIds={currentIds}
          title="Tabelle"
          subtitle="Schweizer System"
        />
      );
    case 'groups_final':
      return (
        <GroupsView
          groups={groups}
          participantsById={participantsById}
          currentIds={currentIds}
          qualifyCount={1}
          title="Gruppen"
          subtitle="Gruppensieger ins Finale"
        />
      );
    case 'groups_ko':
      if (koMatches.length > 0) {
        return (
          <BracketView
            matches={matches}
            participantsById={participantsById}
            highlightId={highlightId}
            subtitle="K.o.-Phase"
          />
        );
      }
      return (
        <GroupsView
          groups={groups}
          participantsById={participantsById}
          currentIds={currentIds}
          qualifyCount={2}
          title="Gruppen"
          subtitle="Top 2 kommen weiter"
        />
      );
    default:
      return null;
  }
}

export default function BeamerView({ state, live, participantsById }) {
  const [view, setView] = useState(viewForNow);
  const [celebration, setCelebration] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const seenRef = useRef(null);

  const champion = participantsById[live.champion];
  const matches = live.matches;
  const title = state.config?.title || 'VR Tischtennis Cup';
  const tables = state.config?.tables || 1;
  const soundOn = state.config?.soundOn;
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;
  const current =
    matches.find((m) => !m.bye && m.playerA && m.playerB && !m.winner) || null;

  const [introMatch, setIntroMatch] = useState(null);
  const [finishView, setFinishView] = useState('winner');
  const introSeenRef = useRef(null);
  const championSoundedRef = useRef(false);

  // Reset transient beamer state whenever a tournament starts / is reset.
  useEffect(() => {
    seenRef.current = null;
    introSeenRef.current = null;
    championSoundedRef.current = false;
    setCelebration(null);
    setHighlightId(null);
    setIntroMatch(null);
  }, [state.tournament]);

  // Detect a newly won match and kick off the celebration – but not the match
  // that crowns the champion (that shows the big WinnerScreen instead).
  useEffect(() => {
    const finished = matches.filter((m) => !m.bye && m.winner);
    const finishedIds = new Set(finished.map((m) => m.id));
    if (seenRef.current === null) {
      seenRef.current = finishedIds;
      return;
    }
    const newlyWon = finished.filter((m) => !seenRef.current.has(m.id));
    seenRef.current = finishedIds;
    if (live.champion) return;
    const latest = newlyWon[newlyWon.length - 1];
    const winner = latest && participantsById[latest.winner];
    if (winner) {
      const scoreText =
        latest.winner === latest.playerA
          ? `${latest.scoreA}:${latest.scoreB}`
          : `${latest.scoreB}:${latest.scoreA}`;
      setHighlightId(null);
      setCelebration({ matchId: latest.id, winner, scoreText, roundName: latest.roundName });
      if (soundOnRef.current) playDing();
    }
  }, [matches, participantsById, live.champion]);

  useEffect(() => {
    if (!celebration) return undefined;
    const id = setTimeout(() => {
      setHighlightId(celebration.matchId);
      setView('overview');
      setCelebration(null);
    }, CELEBRATE_MS);
    return () => clearTimeout(id);
  }, [celebration]);

  useEffect(() => {
    if (!highlightId) return undefined;
    const id = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
    return () => clearTimeout(id);
  }, [highlightId]);

  // Champion fanfare (once) + alternate winner / podium screen.
  useEffect(() => {
    if (champion && !championSoundedRef.current) {
      championSoundedRef.current = true;
      if (soundOnRef.current) playFanfare();
    }
  }, [champion]);

  useEffect(() => {
    if (!champion) return undefined;
    setFinishView('winner');
    const id = setInterval(
      () => setFinishView((v) => (v === 'winner' ? 'podium' : 'winner')),
      15000,
    );
    return () => clearInterval(id);
  }, [champion]);

  const showLoop =
    Boolean(state.tournament) &&
    !champion &&
    !state.slushieBreak &&
    !state.motivationBreak &&
    !celebration &&
    !highlightId;

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

  // Single-table match intro when a new current match appears.
  useEffect(() => {
    if (tables > 1 || !showLoop) return;
    if (current && current.id !== introSeenRef.current) {
      introSeenRef.current = current.id;
      setIntroMatch(current);
      if (soundOnRef.current) playWhoosh();
    }
  }, [showLoop, current, tables]);

  useEffect(() => {
    if (!introMatch) return undefined;
    const id = setTimeout(() => setIntroMatch(null), INTRO_MS);
    return () => clearTimeout(id);
  }, [introMatch]);

  if (champion) {
    const showPodium = finishView === 'podium' && getPodium(live).length >= 2;
    return showPodium ? (
      <PodiumScreen live={live} participantsById={participantsById} title={title} />
    ) : (
      <WinnerScreen champion={champion} title={title} />
    );
  }

  if (celebration) {
    return <MatchCelebration {...celebration} />;
  }

  if (state.slushieBreak) {
    return <SlushieBreak />;
  }

  if (state.motivationBreak) {
    return <MotivationBreak />;
  }

  if (live.format === 'kotb' && live.phase !== 'ko') {
    return <CrownBeamer live={live} participantsById={participantsById} title={title} />;
  }

  if (!state.tournament) {
    return (
      <div className="beamer-screen dashboard">
        <header className="beamer-header">
          <h1 className="event-title">{title}</h1>
        </header>
        <div className="dash-idle">
          <p className="dash-idle-text">Turnier wird vorbereitet …</p>
          <p className="dash-idle-sub">
            Im Admin-Bereich Teilnehmer erfassen und Modus starten.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="beamer-wrap">
      <div
        className="beamer-fade"
        key={introMatch ? `intro-${introMatch.id}` : `${view}-${highlightId ?? ''}`}
      >
        {introMatch ? (
          <MatchIntro match={introMatch} participantsById={participantsById} />
        ) : view === 'dashboard' ? (
          <MatchDashboard
            live={live}
            participantsById={participantsById}
            title={title}
            tables={tables}
          />
        ) : (
          <Overview
            live={live}
            participantsById={participantsById}
            highlightId={highlightId}
            currentId={current?.id}
            title={title}
          />
        )}
      </div>
      {!introMatch && (
        <div className="view-dots" aria-hidden="true">
          <span className={view === 'dashboard' ? 'dot active' : 'dot'} />
          <span className={view === 'overview' ? 'dot active' : 'dot'} />
        </div>
      )}
      <EventClock startedAt={state.startedAt} minutes={state.config?.minutes} />
      <div className="beamer-mode-tag">{MODES[live.format]?.short}</div>
    </div>
  );
}
