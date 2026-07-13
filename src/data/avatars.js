// Avatar system for the VR Tischtennis Cup.
// Emoji based so the app stays fully offline and dependency free.

export const AVATAR_SETS = {
  Tiere: [
    { key: 'panda', emoji: '🐼', label: 'Panda' },
    { key: 'fuchs', emoji: '🦊', label: 'Fuchs' },
    { key: 'pinguin', emoji: '🐧', label: 'Pinguin' },
    { key: 'tiger', emoji: '🐯', label: 'Tiger' },
    { key: 'dino', emoji: '🦖', label: 'Dino' },
    { key: 'eule', emoji: '🦉', label: 'Eule' },
  ],
  Tischtennis: [
    { key: 'schlaeger', emoji: '🏓', label: 'Schläger' },
    { key: 'ball', emoji: '🎾', label: 'Ball' },
    { key: 'champion', emoji: '🏆', label: 'Champion' },
  ],
  Fun: [
    { key: 'einhorn', emoji: '🦄', label: 'Einhorn' },
    { key: 'rakete', emoji: '🚀', label: 'Rakete' },
    { key: 'oktopus', emoji: '🐙', label: 'Oktopus' },
  ],
  Slushie: [
    { key: 'becher', emoji: '🥤', label: 'Slushie-Becher' },
    { key: 'eiswuerfel', emoji: '🧊', label: 'Eiswürfel' },
    { key: 'schneeflocke', emoji: '❄️', label: 'Schneeflocke' },
  ],
};

// Accent colors used to give every player a recognizable token color.
export const ACCENT_COLORS = [
  '#22d3ee', // cyan
  '#facc15', // gelb
  '#7dd3fc', // eisblau
  '#f472b6', // pink
  '#2dd4bf', // türkis
  '#a78bfa', // violett
  '#fb923c', // orange
  '#4ade80', // grün
];

// Flat list of every avatar with its set name attached.
export const ALL_AVATARS = Object.entries(AVATAR_SETS).flatMap(([set, items]) =>
  items.map((item) => ({ set, ...item })),
);

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function randomAvatar() {
  return pick(ALL_AVATARS);
}

export function randomColor() {
  return pick(ACCENT_COLORS);
}

// Returns a random avatar different from the current one (if possible).
export function nextRandomAvatar(current) {
  if (ALL_AVATARS.length <= 1) return ALL_AVATARS[0];
  let candidate = randomAvatar();
  let guard = 0;
  while (current && candidate.set === current.set && candidate.key === current.key && guard < 20) {
    candidate = randomAvatar();
    guard += 1;
  }
  return candidate;
}

function countBy(list, keyFn) {
  const m = new Map();
  list.filter(Boolean).forEach((x) => {
    const k = keyFn(x);
    m.set(k, (m.get(k) || 0) + 1);
  });
  return m;
}

// Picks the avatar currently least represented among `used` – keeps a field of
// participants visually distinct instead of repeating the same emoji.
export function leastUsedAvatar(used = []) {
  const counts = countBy(used, (a) => `${a.set}:${a.key}`);
  let min = Infinity;
  ALL_AVATARS.forEach((a) => {
    const c = counts.get(`${a.set}:${a.key}`) || 0;
    if (c < min) min = c;
  });
  const candidates = ALL_AVATARS.filter((a) => (counts.get(`${a.set}:${a.key}`) || 0) === min);
  return pick(candidates);
}

// Picks the accent color currently least used among `used`.
export function leastUsedColor(used = []) {
  const counts = countBy(used, (c) => c);
  let min = Infinity;
  ACCENT_COLORS.forEach((c) => {
    const n = counts.get(c) || 0;
    if (n < min) min = n;
  });
  const candidates = ACCENT_COLORS.filter((c) => (counts.get(c) || 0) === min);
  return pick(candidates);
}
