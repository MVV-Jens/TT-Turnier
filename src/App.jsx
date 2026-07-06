import { useCallback, useEffect, useState } from 'react';
import { useTournament } from './hooks/useTournament.js';
import AdminPanel from './components/AdminPanel.jsx';
import BeamerView from './components/BeamerView.jsx';

export default function App() {
  const { state, dispatch, matches, participantsById } = useTournament();
  const [mode, setMode] = useState('admin'); // 'admin' | 'beamer'
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Keyboard shortcuts: B = beamer/admin toggle, F = fullscreen, Esc handled by browser.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }
      if (e.key === 'b' || e.key === 'B') setMode((m) => (m === 'admin' ? 'beamer' : 'admin'));
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleFullscreen]);

  return (
    <div className={`app app-${mode}`}>
      <div className={`topbar ${mode === 'beamer' ? 'topbar-floating' : ''}`}>
        {mode === 'admin' && (
          <div className="topbar-brand">
            <span className="brand-mark">🏓</span>
            <span className="brand-text">VR Tischtennis Cup 2026</span>
          </div>
        )}
        <div className="topbar-actions">
          <div className="mode-switch">
            <button
              type="button"
              className={mode === 'admin' ? 'active' : ''}
              onClick={() => setMode('admin')}
            >
              Admin
            </button>
            <button
              type="button"
              className={mode === 'beamer' ? 'active' : ''}
              onClick={() => setMode('beamer')}
            >
              Beamer
            </button>
          </div>
          <button
            type="button"
            className="icon-btn topbar-fs"
            title={isFullscreen ? 'Vollbild beenden (F)' : 'Vollbild (F)'}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? '🗗' : '⛶'}
          </button>
        </div>
      </div>

      <main className="app-main">
        {mode === 'admin' ? (
          <AdminPanel
            state={state}
            dispatch={dispatch}
            matches={matches}
            participantsById={participantsById}
          />
        ) : (
          <BeamerView
            state={state}
            matches={matches}
            participantsById={participantsById}
          />
        )}
      </main>
    </div>
  );
}
