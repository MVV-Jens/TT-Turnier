// Fun winner one-liners shown on the champion screen.
export const WINNER_QUOTES = [
  'Heute offiziell unschlagbar.',
  'Eine Legende im Luisenring.',
  'Hat geliefert. Hat geschmettert. Hat gewonnen.',
  'Wurde nicht besiegt. Nur bewundert.',
  'Schmettert jetzt auch beruflich besser.',
];

export function randomWinnerQuote() {
  return WINNER_QUOTES[Math.floor(Math.random() * WINNER_QUOTES.length)];
}

// Motivational one-liners for the motivation break screen (MVV + table tennis).
// Easy to edit – swap in official slogans anytime.
export const MOTIVATION_QUOTES = [
  'Volle Energie am Tisch – wie bei MVV.',
  'Aufschlag mit Power. MVV-Power.',
  'Bleib am Ball – der nächste Punkt gehört dir.',
  'Gemeinsam schmettern wir jedes Ziel.',
  'Kein Punkt geht verloren – nur weitergegeben.',
  'Vorhand, Rückhand, Vollgas.',
  'Konzentration, Präzision, MVV-Vision.',
  'Jeder Aufschlag ist eine neue Chance.',
  'Topspin ins Wochenende!',
  'Energie liefert MVV – die Bälle lieferst du.',
  'Zusammen sind wir unschlagbar.',
  'Heute Tischtennis-Legende, morgen Energie-Held.',
  'Netzroller zählen auch. Glück gehört zum Spiel.',
  'Schmettern, lächeln, gewinnen.',
];


// Demo names for quick setup / testing.
export const DEMO_NAMES = [
  'Lena', 'Jonas', 'Marie', 'Tim', 'Sophie', 'Paul',
  'Hannah', 'Max', 'Emma', 'Leon', 'Mia', 'Finn',
  'Clara', 'Ben', 'Nele', 'Luca',
];
