# VR Tischtennis Cup 2026 – Turnier-App

Kleine, lokal nutzbare Turnier- und Beamer-App für den internen VR Tischtennis Cup.
Browserbasiert, ohne Login, ohne Backend – Daten werden im Browser (Local Storage) gespeichert.

## Schnellstart

```powershell
npm install
npm run dev
```

Dann die angezeigte URL (z. B. http://localhost:5173) im Browser öffnen.

### Für den Event-Tag (empfohlen)

```powershell
npm run build
npm run preview
```

`npm run build` erzeugt einen statischen Ordner `dist/`. Die App läuft danach voll
offline – der `dist/`-Ordner kann sogar direkt per Doppelklick auf `index.html`
geöffnet werden.

## Bedienung

- **Admin / Beamer umschalten:** oben rechts oder Taste `B`.
- **Vollbild:** Button oben rechts oder Taste `F`.
- **Ablauf:** Teilnehmer erfassen → Avatare (automatisch, änderbar) → *Turnier auslosen*
  → Ergebnisse konkret eintragen (z. B. 7:4) → App berechnet Sieger, nächste Runde und
  Champion automatisch.
- **Slushie-Break:** im Admin-Bereich manuell starten/beenden (z. B. vor dem Finale).
- **Gewinner-Screen:** erscheint automatisch nach dem Finale, inkl. Konfetti, Fun-Spruch
  und Bild-Export.

## Modus

- 16er-Speed-K.o. (Achtel-, Viertel-, Halbfinale je 1 Satz bis 7, Finale bis 11).
- 10–16 Teilnehmer möglich; freie Plätze werden automatisch als Freilos vergeben.
- Beamer-Modus wechselt automatisch alle 20 Sekunden zwischen Match-Dashboard und
  Turnierbaum.

## Technik

- React + Vite (Single-Page-App), reines CSS, keine Laufzeit-Abhängigkeiten.
- Persistenz über Local Storage (`vr-tt-cup-2026`).
