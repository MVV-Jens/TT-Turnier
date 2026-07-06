import { useCallback, useEffect, useState } from 'react';
import { useTournament } from './hooks/useTournament.js';
import AdminPanel from './components/AdminPanel.jsx';
import BeamerView from './components/BeamerView.jsx';

export default function App() {
  const { state, dispatch, live, participantsById } = useTournament();
  const [mode, setMode] = useState('admin'); // 'admin' | 'beamer'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

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

  // In beamer mode the controls auto-hide (with the cursor) after a few seconds
  // of inactivity and reappear on any mouse move / key press.
  useEffect(() => {
    if (mode !== 'beamer') {
      setControlsVisible(true);
      return undefined;
    }
    let hideTimer;
    const reveal = () => {
      setControlsVisible(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setControlsVisible(false), 3000);
    };
    reveal();
    window.addEventListener('mousemove', reveal);
    window.addEventListener('keydown', reveal);
    window.addEventListener('touchstart', reveal);
    return () => {
      clearTimeout(hideTimer);
      window.removeEventListener('mousemove', reveal);
      window.removeEventListener('keydown', reveal);
      window.removeEventListener('touchstart', reveal);
    };
  }, [mode]);

  const idle = mode === 'beamer' && !controlsVisible;

  return (
    <div className={`app app-${mode} ${idle ? 'is-idle' : ''}`}>
      {mode === 'admin' ? (
        <div className="topbar">
          <div className="topbar-brand">
            <span className="brand-mark">🏓</span>
            <span className="brand-text">VR Tischtennis Cup 2026</span>
          </div>
          <div className="topbar-actions">
            <div className="mode-switch">
              <button type="button" className="active" onClick={() => setMode('admin')}>
                Admin
              </button>
              <button type="button" onClick={() => setMode('beamer')}>Beamer</button>
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
      ) : (
        <div className={`beamer-controls ${controlsVisible ? 'is-visible' : ''}`}>
          <button
            type="button"
            className="beamer-exit"
            title="Zurück zum Admin (Taste B)"
            onClick={() => setMode('admin')}
          >
            ⚙ Admin
          </button>
          <button
            type="button"
            className="beamer-fs"
            title={isFullscreen ? 'Vollbild beenden (F)' : 'Vollbild (F)'}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? '🗗 Fenster' : '⛶ Vollbild'}
          </button>
          <span className="beamer-controls-hint">Taste B · F</span>
        </div>
      )}

      <main className="app-main">
        {mode === 'admin' ? (
          <AdminPanel
            state={state}
            dispatch={dispatch}
            live={live}
            participantsById={participantsById}
          />
        ) : (
          <BeamerView
            state={state}
            live={live}
            participantsById={participantsById}
          />
        )}
      </main>
    </div>
  );
}
