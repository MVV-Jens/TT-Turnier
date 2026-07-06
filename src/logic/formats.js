// Tournament formats, time estimation and the recommendation engine.
// All time numbers are estimates and intentionally easy to tune.

// Minutes per single match (incl. changeover) by set length.
export const SET_LENGTHS = {
  short: { key: 'short', label: 'Kurz', desc: '1 Satz bis 7', target: 7, bestOf: 1, minutes: 5 },
  standard: { key: 'standard', label: 'Standard', desc: '1 Satz bis 11', target: 11, bestOf: 1, minutes: 7 },
  long: { key: 'long', label: 'Lang', desc: 'Best of 3 bis 11', target: 11, bestOf: 3, minutes: 13 },
};

export const TABLE_OPTIONS = [1, 2, 3, 4]; // 4 represents "4+"
export const TIME_PRESETS = [60, 90, 120];

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 32;

// Tournament modes with eligible field sizes and a short rationale.
export const MODES = {
  round_robin: {
    key: 'round_robin', name: 'Jeder gegen Jeden', short: 'Jeder gegen Jeden',
    min: 4, max: 8,
    traits: ['maximale Fairness', 'jeder spielt gegen jeden'],
    fitFor: 'Kleine Turniere (4–8)',
  },
  groups_final: {
    key: 'groups_final', name: 'Gruppenphase + Finale', short: 'Gruppen + Finale',
    min: 6, max: 12,
    traits: ['jeder hat mehrere Spiele', 'fairer als K.o.'],
    fitFor: '8–12 Spieler, 90+ Minuten',
  },
  groups_ko: {
    key: 'groups_ko', name: 'Gruppenphase + K.o.', short: 'Gruppen + K.o.',
    min: 8, max: 32,
    traits: ['hoher Spaßfaktor', 'viele Spiele'],
    fitFor: 'mehrere Platten, längere Zeitfenster',
  },
  swiss: {
    key: 'swiss', name: 'Schweizer System', short: 'Schweizer System',
    min: 8, max: 20,
    traits: ['feste Anzahl Runden', 'ähnliche Leistung trifft aufeinander'],
    fitFor: '8–20 Spieler, viele Spiele gewünscht',
  },
  ko: {
    key: 'ko', name: 'K.o.-Turnier', short: 'K.o.',
    min: 4, max: 32,
    traits: ['schnell', 'wenige Spiele', 'ideal bei Zeitdruck'],
    fitFor: '12–32 Spieler, kurze Zeitfenster',
  },
};

export const MODE_ORDER = ['ko', 'round_robin', 'groups_final', 'groups_ko', 'swiss'];

// ---- Structural planning helpers (shared with the engine) ----

export function nextPow2(n) {
  let p = 4;
  while (p < n) p *= 2;
  return Math.min(p, 32);
}

export function koBracketSize(players) {
  return nextPow2(Math.max(MIN_PLAYERS, players));
}

export function groupsFinalPlan() {
  return { groups: 2 };
}

export function groupsKoPlan(players) {
  const groups = players >= 12 ? 4 : 2;
  return { groups, advance: 2 };
}

export function swissRounds(players) {
  return Math.max(3, Math.ceil(Math.log2(Math.max(2, players))));
}

export function groupSizes(players, groups) {
  const base = Math.floor(players / groups);
  const rest = players % groups;
  return Array.from({ length: groups }, (_, i) => base + (i < rest ? 1 : 0));
}

function combos(n) {
  return (n * (n - 1)) / 2;
}

export function gamesFor(format, players) {
  const P = players;
  switch (format) {
    case 'ko':
      return Math.max(0, P - 1);
    case 'round_robin':
      return combos(P);
    case 'groups_final': {
      const { groups } = groupsFinalPlan(P);
      const sizes = groupSizes(P, groups);
      return sizes.reduce((s, n) => s + combos(n), 0) + 1;
    }
    case 'groups_ko': {
      const { groups, advance } = groupsKoPlan(P);
      const sizes = groupSizes(P, groups);
      const groupGames = sizes.reduce((s, n) => s + combos(n), 0);
      const koPlayers = groups * advance;
      return groupGames + Math.max(0, koPlayers - 1);
    }
    case 'swiss':
      return swissRounds(P) * Math.floor(P / 2);
    default:
      return 0;
  }
}

export function gamesPerPlayer(format, players) {
  const total = gamesFor(format, players);
  return players > 0 ? (2 * total) / players : 0;
}

function effectiveTables(tables, players) {
  return Math.max(1, Math.min(tables, Math.floor(players / 2)));
}

export function estimateDuration(format, players, tables, setLength) {
  const games = gamesFor(format, players);
  const per = SET_LENGTHS[setLength].minutes;
  const parallel = effectiveTables(tables, players);
  return Math.round((games * per) / parallel);
}

export function estimateAvgWait(format, players, tables, setLength) {
  const est = estimateDuration(format, players, tables, setLength);
  const per = SET_LENGTHS[setLength].minutes;
  const gpp = gamesPerPlayer(format, players);
  const active = gpp * per;
  return Math.max(0, Math.round((est - active) / Math.max(1, gpp)));
}

export function rate(estMinutes, availableMinutes) {
  if (availableMinutes <= 0) return 'over';
  if (estMinutes <= availableMinutes) return 'ok';
  if (estMinutes <= availableMinutes * 1.2) return 'tight';
  return 'over';
}

export const RATING_META = {
  ok: { key: 'ok', icon: '✅', label: 'Empfohlen', text: 'Passt sicher ins Zeitfenster.' },
  tight: { key: 'tight', icon: '⚠️', label: 'Knapp', text: 'Wahrscheinlich machbar, aber ohne große Verzögerungen.' },
  over: { key: 'over', icon: '❌', label: 'Nicht empfohlen', text: 'Überschreitet das Zeitfenster wahrscheinlich.' },
};

export function isEligible(format, players) {
  const m = MODES[format];
  return players >= m.min && players <= m.max;
}

export function calcMode(format, players, tables, availableMinutes, setLength) {
  const games = gamesFor(format, players);
  const duration = estimateDuration(format, players, tables, setLength);
  const avgWait = estimateAvgWait(format, players, tables, setLength);
  const rating = rate(duration, availableMinutes);
  return {
    format, name: MODES[format].name, eligible: isEligible(format, players),
    games, duration, avgWait, rating, over: Math.max(0, duration - availableMinutes),
  };
}

function suitability(format, players, tables, availableMinutes) {
  const P = players;
  let s = 0;
  switch (format) {
    case 'round_robin':
      s = P <= 6 ? 100 : 80;
      break;
    case 'groups_final':
      s = P >= 8 && P <= 12 ? 90 : 70;
      if (tables <= 2) s += 8;
      break;
    case 'groups_ko':
      s = 74;
      if (tables >= 2) s += 16;
      if (availableMinutes >= 120) s += 8;
      break;
    case 'swiss':
      s = 72;
      if (availableMinutes >= 120) s += 10;
      if (Math.log2(P) % 1 !== 0) s += 6;
      break;
    case 'ko':
      s = 60;
      if (P >= 16) s += 14;
      if (availableMinutes <= 75) s += 12;
      if (tables === 1) s += 4;
      break;
    default:
      s = 0;
  }
  return s;
}

export function recommend(players, tables, availableMinutes, setLength) {
  const modes = MODE_ORDER.map((format) => {
    const calc = calcMode(format, players, tables, availableMinutes, setLength);
    const score = calc.eligible
      ? suitability(format, players, tables, availableMinutes) +
        (calc.rating === 'ok' ? 40 : calc.rating === 'tight' ? 10 : -1000)
      : -Infinity;
    return { ...calc, score };
  });

  const eligible = modes.filter((m) => m.eligible);
  const fitting = eligible.filter((m) => m.rating !== 'over');

  let best;
  if (fitting.length > 0) {
    best = fitting.reduce((a, b) => (b.score > a.score ? b : a));
  } else if (eligible.length > 0) {
    best = eligible.reduce((a, b) => (b.over < a.over ? b : a));
  } else {
    best = modes.find((m) => m.format === 'ko');
  }

  const reasons = buildReasons(best);
  const alternatives = modes
    .filter((m) => m.eligible && m.format !== best.format)
    .sort((a, b) => b.score - a.score);

  return { recommended: best.format, best, reasons, alternatives, all: modes };
}

function buildReasons(best) {
  const reasons = [...MODES[best.format].traits];
  if (best.rating === 'ok') reasons.push('sicher im Zeitfenster');
  else if (best.rating === 'tight') reasons.push('zeitlich knapp, aber machbar');
  else reasons.push(`überschreitet die Zeit um ca. ${best.over} Min.`);
  return reasons;
}
