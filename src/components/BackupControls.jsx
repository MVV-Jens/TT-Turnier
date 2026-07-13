import { useRef } from 'react';

// Full-event backup: download the whole state as JSON, or restore it from a file.
export default function BackupControls({ state, dispatch }) {
  const fileRef = useRef(null);

  const exportState = () => {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
      a.href = url;
      a.download = `turnier-backup-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const importState = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed && Array.isArray(parsed.participants)) {
          dispatch({ type: 'HYDRATE', state: parsed });
        } else {
          window.alert('Ungültige Backup-Datei.');
        }
      } catch {
        window.alert('Backup konnte nicht gelesen werden.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="backup-controls">
      <span className="backup-label">Sicherung</span>
      <div className="backup-buttons">
        <button type="button" className="btn btn-ghost btn-sm" onClick={exportState}>
          ⭳ Exportieren
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => fileRef.current?.click()}
        >
          ⭱ Importieren
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={importState}
        />
      </div>
    </div>
  );
}
