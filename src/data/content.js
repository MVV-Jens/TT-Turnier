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

// Demo names for quick setup / testing.
export const DEMO_NAMES = [
  'Lena', 'Jonas', 'Marie', 'Tim', 'Sophie', 'Paul',
  'Hannah', 'Max', 'Emma', 'Leon', 'Mia', 'Finn',
  'Clara', 'Ben', 'Nele', 'Luca',
];
