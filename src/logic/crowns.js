// Logic for the "Kronen sammeln" (King of the Table) mode.
//
// Phase 1 (crowns): the physical game runs on its own – the app only tracks how
// many crowns each player has earned. Crowns are stored as an append-only log of
// player ids (kotb.crowns) so undo is trivial and everything derives purely.
//
// Phase 2 (ko): the top N crown collectors play a normal single-elimination
// bracket, reusing the generalized KO builder from engine.js.

import { buildKO, seedOrder } from './engine.js';

// Format a millisecond duration as m:ss (never negative).
export function formatClock(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Tally crowns per player from the append-only log.
export function crownTally(order, crownsLog = []) {
  const t = Object.fromEntries(order.map((id) => [id, 0]));
  crownsLog.forEach((id) => {
    if (id in t) t[id] += 1;
  });
  return t;
}

// Ranking: most crowns first, ties broken by the initial (random) draw order
// which acts as a deterministic "Los".
export function crownStandings(order, crownsLog = []) {
  const t = crownTally(order, crownsLog);
  const orderIndex = Object.fromEntries(order.map((id, i) => [id, i]));
  return order
    .map((id) => ({ id, crowns: t[id] }))
    .sort((a, b) => b.crowns - a.crowns || orderIndex[a.id] - orderIndex[b.id]);
}

// How many players advance to the final KO, adapted to the field size.
// >=8 -> quarterfinals (8), >=4 -> semifinals (4), else final (2).
export function adaptiveAdvance(players) {
  if (players >= 8) return 8;
  if (players >= 4) return 4;
  return 2;
}

// Plan the cut into the KO. Returns which players auto-qualify, which are tied
// on the qualification boundary, and whether the admin has to decide (Stechen).
export function planCrownKo(standings, advance) {
  const adv = Math.min(advance, standings.length);
  if (standings.length <= adv) {
    return {
      advance: adv,
      cutoffValue: null,
      autoQualifiers: standings.map((s) => s.id),
      tiedAtCutoff: [],
      slotsLeft: 0,
      needsDecision: false,
      defaultQualifiers: standings.map((s) => s.id),
    };
  }
  const cutoffValue = standings[adv - 1].crowns;
  const autoQualifiers = standings.filter((s) => s.crowns > cutoffValue).map((s) => s.id);
  const tiedAtCutoff = standings.filter((s) => s.crowns === cutoffValue).map((s) => s.id);
  const slotsLeft = adv - autoQualifiers.length;
  const needsDecision = tiedAtCutoff.length > slotsLeft;
  return {
    advance: adv,
    cutoffValue,
    autoQualifiers,
    tiedAtCutoff,
    slotsLeft,
    needsDecision,
    // Deterministic default (fills tied slots in Los order) when no decision needed.
    defaultQualifiers: autoQualifiers.concat(tiedAtCutoff.slice(0, slotsLeft)),
  };
}

// Turn a ranked qualifier list (seed order: best crowns first) into the slot
// array expected by buildKO, using standard bracket seeding.
export function finalizeCrownKo(rankedIds) {
  const size = rankedIds.length;
  return seedOrder(size).map((seed) => rankedIds[seed - 1] ?? null);
}

// Derive the full live state for the crowns mode (both phases), mirroring the
// shape returned by computeTournament so admin/beamer can consume it.
export function computeCrownsTournament(tournament, kotb, results = {}) {
  const { order, options } = tournament;
  const crownsLog = kotb?.crowns || [];
  const standings = crownStandings(order, crownsLog);
  const advance = adaptiveAdvance(order.length);

  const base = {
    format: 'kotb',
    phase: kotb?.phase || 'crowns',
    matches: [],
    groups: [],
    standings,
    crownStandings: standings,
    advance,
    lastCrownId: crownsLog.length ? crownsLog[crownsLog.length - 1] : null,
    crownCount: crownsLog.length,
    startedAt: kotb?.startedAt ?? null,
    endedAt: kotb?.endedAt ?? null,
    durationMin: options?.durationMin ?? null,
    useTimer: Boolean(options?.useTimer),
    handicaps: kotb?.handicaps || [],
    handicapThreshold: kotb?.handicapThreshold ?? 0,
    champion: null,
    phaseLabel: 'Kronen sammeln',
    progress: { played: 0, total: 0, percent: 0 },
  };

  if (kotb?.phase !== 'ko' || !kotb?.koOrder || kotb.koOrder.length < 2) {
    return base;
  }

  const opts = { target: options.target, bestOf: options.bestOf };
  const slots = finalizeCrownKo(kotb.koOrder);
  const { matches, totalRounds } = buildKO(slots, results, opts, 'ko');
  const final = matches.find((m) => m.round === totalRounds - 1);
  const champion = final ? final.winner : null;
  const real = matches.filter((m) => !m.bye);
  const played = real.filter((m) => m.winner);

  return {
    ...base,
    phase: 'ko',
    matches,
    champion,
    phaseLabel: 'K.o.-Phase',
    progress: {
      played: played.length,
      total: real.length,
      percent: real.length ? Math.round((played.length / real.length) * 100) : 0,
    },
  };
}
