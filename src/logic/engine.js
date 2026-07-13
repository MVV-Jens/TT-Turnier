// Generalized, pure tournament engine for all supported formats.
// computeTournament({ format, order, options }, results) derives the full
// live state (matches, groups, standings, current/next match, champion,
// progress) deterministically – exactly like the original KO computeMatches,
// so cross-window sync and result editing keep working.

import {
  SET_LENGTHS,
  koBracketSize,
  groupsFinalPlan,
  groupsKoPlan,
  swissRounds,
  gamesFor,
} from './formats.js';

let idc = 0;
export function makeId(prefix = 'id') {
  idc += 1;
  return `${prefix}_${Date.now().toString(36)}_${idc}`;
}

export function shuffle(input) {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Builds the persistent tournament descriptor from a chosen format + field.
export function buildTournament(format, participantIds, setLengthKey, extra = {}) {
  const order = shuffle(participantIds);
  const P = order.length;
  const sl = SET_LENGTHS[setLengthKey] || SET_LENGTHS.short;
  const options = {
    setLength: sl.key,
    target: sl.target,
    bestOf: sl.bestOf,
  };
  if (format === 'ko') options.size = koBracketSize(P);
  if (format === 'groups_final') options.groups = groupsFinalPlan(P).groups;
  if (format === 'groups_ko') {
    const plan = groupsKoPlan(P);
    options.groups = plan.groups;
    options.advance = plan.advance;
  }
  if (format === 'swiss') options.rounds = swissRounds(P);
  if (format === 'kotb') {
    options.durationMin = extra.durationMin ?? null;
    options.useTimer = Boolean(extra.useTimer);
  }
  return { format, order, options };
}

const KO_NAMES = {
  0: 'Finale',
  1: 'Halbfinale',
  2: 'Viertelfinale',
  3: 'Achtelfinale',
  4: 'Sechzehntelfinale',
};
function koRoundName(totalRounds, r) {
  const fromFinal = totalRounds - 1 - r;
  return KO_NAMES[fromFinal] || `Runde ${r + 1}`;
}

function pairKey(a, b) {
  return [a, b].sort().join('|');
}

// Round-robin schedule via the circle method -> array of rounds of [a,b].
function rrSchedule(playerIds) {
  const arr = [...playerIds];
  if (arr.length % 2) arr.push(null);
  const n = arr.length;
  const rounds = [];
  for (let r = 0; r < n - 1; r += 1) {
    const pairs = [];
    for (let i = 0; i < n / 2; i += 1) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a != null && b != null) pairs.push([a, b]);
    }
    rounds.push(pairs);
    arr.splice(1, 0, arr.pop());
  }
  return rounds;
}

function applyResult(m, results) {
  const r = results[m.id];
  if (m.playerA && m.playerB && r && r.a != null && r.b != null && r.a !== r.b) {
    m.scoreA = r.a;
    m.scoreB = r.b;
    m.winner = r.a > r.b ? m.playerA : m.playerB;
  }
  return m;
}

function computeStandings(playerIds, matches, orderIndex) {
  const t = {};
  playerIds.forEach((id) => {
    t[id] = { id, played: 0, wins: 0, losses: 0, pf: 0, pa: 0, pts: 0 };
  });
  matches.forEach((m) => {
    if (!m.playerA || !m.playerB || !m.winner) return;
    const A = t[m.playerA];
    const B = t[m.playerB];
    if (!A || !B) return;
    A.played += 1;
    B.played += 1;
    A.pf += m.scoreA;
    A.pa += m.scoreB;
    B.pf += m.scoreB;
    B.pa += m.scoreA;
    if (m.winner === m.playerA) {
      A.wins += 1;
      A.pts += 2;
      B.losses += 1;
    } else {
      B.wins += 1;
      B.pts += 2;
      A.losses += 1;
    }
  });
  return Object.values(t)
    .map((x) => ({ ...x, diff: x.pf - x.pa }))
    .sort(
      (x, y) =>
        y.pts - x.pts ||
        y.diff - x.diff ||
        y.pf - x.pf ||
        (orderIndex[x.id] ?? 0) - (orderIndex[y.id] ?? 0),
    );
}

// ---- KO builder (flexible size 4/8/16/32) ----

function koSlots(order, size) {
  const players = order.slice(0, size);
  const count = players.length;
  const byes = size - count;
  const byeMatches = new Set();
  if (byes > 0) {
    const step = size / 2 / byes;
    for (let i = 0; i < byes; i += 1) byeMatches.add(Math.floor(i * step));
  }
  const queue = [...players];
  const slots = new Array(size).fill(null);
  for (let m = 0; m < size / 2; m += 1) {
    if (byeMatches.has(m)) {
      slots[m * 2] = queue.shift() ?? null;
      slots[m * 2 + 1] = null;
    } else {
      slots[m * 2] = queue.shift() ?? null;
      slots[m * 2 + 1] = queue.shift() ?? null;
    }
  }
  return slots;
}

// Standard single-elimination seeding order: returns, for a bracket of `size`,
// the 1-indexed seed sitting in each slot (so seed 1 and seed 2 land on opposite
// ends and byes for surplus seeds spread to the top seeds).
export function seedOrder(size) {
  let seeds = [1, 2];
  while (seeds.length < size) {
    const sum = seeds.length * 2 + 1;
    const next = [];
    for (const s of seeds) {
      next.push(s);
      next.push(sum - s);
    }
    seeds = next;
  }
  return seeds;
}

export function buildKO(slots, results, opts, prefix = 'ko') {
  const size = slots.length;
  const totalRounds = Math.log2(size);
  const matches = [];
  const byId = {};
  for (let r = 0; r < totalRounds; r += 1) {
    const count = size / 2 ** (r + 1);
    for (let i = 0; i < count; i += 1) {
      const id = `${prefix}-${r}-${i}`;
      const m = {
        id,
        phase: 'ko',
        round: r,
        index: i,
        roundName: koRoundName(totalRounds, r),
        playerA: null,
        playerB: null,
        scoreA: null,
        scoreB: null,
        winner: null,
        bye: false,
        target: opts.target,
        bestOf: opts.bestOf,
        nextId: r < totalRounds - 1 ? `${prefix}-${r + 1}-${Math.floor(i / 2)}` : null,
        nextSlot: i % 2 === 0 ? 'A' : 'B',
      };
      matches.push(m);
      byId[id] = m;
    }
  }
  for (let i = 0; i < size / 2; i += 1) {
    const m = byId[`${prefix}-0-${i}`];
    m.playerA = slots[i * 2] ?? null;
    m.playerB = slots[i * 2 + 1] ?? null;
  }
  for (let r = 0; r < totalRounds; r += 1) {
    const count = size / 2 ** (r + 1);
    for (let i = 0; i < count; i += 1) {
      const m = byId[`${prefix}-${r}-${i}`];
      const hasA = m.playerA != null;
      const hasB = m.playerB != null;
      if (r === 0 && hasA && !hasB) {
        m.bye = true;
        m.winner = m.playerA;
      } else if (r === 0 && !hasA && hasB) {
        m.bye = true;
        m.winner = m.playerB;
      } else if (hasA && hasB) {
        applyResult(m, results);
      }
      if (m.winner && m.nextId) {
        byId[m.nextId][m.nextSlot === 'A' ? 'playerA' : 'playerB'] = m.winner;
      }
    }
  }
  return { matches, totalRounds };
}

// ---- Group stage builder (round robin within groups) ----

function buildGroups(order, groupCount, opts, results) {
  const groups = Array.from({ length: groupCount }, (_, i) => ({
    id: i,
    name: `Gruppe ${String.fromCharCode(65 + i)}`,
    playerIds: [],
  }));
  order.forEach((id, i) => {
    groups[i % groupCount].playerIds.push(id);
  });
  const matches = [];
  groups.forEach((g) => {
    const sched = rrSchedule(g.playerIds);
    sched.forEach((pairs, r) => {
      pairs.forEach(([a, b], i) => {
        const m = {
          id: `g${g.id}-${r}-${i}`,
          phase: 'group',
          groupId: g.id,
          groupName: g.name,
          round: r,
          index: i,
          roundName: `${g.name} · Runde ${r + 1}`,
          playerA: a,
          playerB: b,
          scoreA: null,
          scoreB: null,
          winner: null,
          bye: false,
          target: opts.target,
          bestOf: opts.bestOf,
        };
        applyResult(m, results);
        matches.push(m);
      });
    });
  });
  return { groups, matches };
}

// ---- Swiss builder (dynamic pairings) ----

function buildSwiss(order, rounds, results, opts) {
  const orderIndex = Object.fromEntries(order.map((id, i) => [id, i]));
  const matches = [];
  const played = new Set();
  for (let r = 0; r < rounds; r += 1) {
    const prevResolved =
      r === 0 ||
      matches.filter((m) => m.round < r).every((m) => m.winner);
    if (!prevResolved) break;
    const standings = computeStandings(order, matches, orderIndex);
    const pool = standings.map((s) => s.id);
    const roundPairs = [];
    while (pool.length >= 2) {
      const a = pool.shift();
      let idx = pool.findIndex((b) => !played.has(pairKey(a, b)));
      if (idx === -1) idx = 0;
      const b = pool.splice(idx, 1)[0];
      played.add(pairKey(a, b));
      roundPairs.push([a, b]);
    }
    roundPairs.forEach(([a, b], i) => {
      const m = {
        id: `sw-${r}-${i}`,
        phase: 'swiss',
        round: r,
        index: i,
        roundName: `Runde ${r + 1}`,
        playerA: a,
        playerB: b,
        scoreA: null,
        scoreB: null,
        winner: null,
        bye: false,
        target: opts.target,
        bestOf: opts.bestOf,
      };
      applyResult(m, results);
      matches.push(m);
    });
  }
  return matches;
}

function allResolved(matches) {
  return matches.length > 0 && matches.every((m) => m.winner);
}

// ---- Main entry point ----

export function computeTournament(tournament, results = {}) {
  const base = {
    format: null,
    matches: [],
    groups: [],
    standings: [],
    phaseLabel: '',
    champion: null,
    progress: { played: 0, total: 0, percent: 0 },
  };
  if (!tournament) return base;

  const { format, order, options } = tournament;
  const opts = { target: options.target, bestOf: options.bestOf };
  const orderIndex = Object.fromEntries(order.map((id, i) => [id, i]));
  const P = order.length;

  let matches = [];
  let groups = [];
  let standings = [];
  let champion = null;
  let phaseLabel = '';

  if (format === 'ko') {
    const slots = koSlots(order, options.size);
    const { matches: km, totalRounds } = buildKO(slots, results, opts);
    matches = km;
    const final = matches.find((m) => m.round === totalRounds - 1);
    champion = final ? final.winner : null;
    phaseLabel = 'K.o.';
  } else if (format === 'round_robin') {
    const sched = rrSchedule(order);
    sched.forEach((pairs, r) => {
      pairs.forEach(([a, b], i) => {
        const m = {
          id: `rr-${r}-${i}`,
          phase: 'rr',
          round: r,
          index: i,
          roundName: `Runde ${r + 1}`,
          playerA: a,
          playerB: b,
          scoreA: null,
          scoreB: null,
          winner: null,
          bye: false,
          target: opts.target,
          bestOf: opts.bestOf,
        };
        applyResult(m, results);
        matches.push(m);
      });
    });
    standings = computeStandings(order, matches, orderIndex);
    if (allResolved(matches)) champion = standings[0]?.id ?? null;
    phaseLabel = 'Jeder gegen Jeden';
  } else if (format === 'groups_final') {
    const built = buildGroups(order, options.groups, opts, results);
    groups = built.groups;
    matches = built.matches;
    groups = groups.map((g) => ({
      ...g,
      standings: computeStandings(
        g.playerIds,
        matches.filter((m) => m.groupId === g.id),
        orderIndex,
      ),
    }));
    const groupsDone = groups.every((g) =>
      allResolved(matches.filter((m) => m.groupId === g.id)),
    );
    if (groupsDone) {
      const finalists = groups.map((g) => g.standings[0]?.id ?? null);
      const fm = {
        id: 'final-0',
        phase: 'final',
        round: 0,
        index: 0,
        roundName: 'Finale',
        playerA: finalists[0] ?? null,
        playerB: finalists[1] ?? null,
        scoreA: null,
        scoreB: null,
        winner: null,
        bye: false,
        target: opts.target,
        bestOf: opts.bestOf,
      };
      applyResult(fm, results);
      matches.push(fm);
      champion = fm.winner;
    }
    phaseLabel = groups.length && matches.some((m) => m.phase === 'final') ? 'Finale' : 'Gruppenphase';
  } else if (format === 'groups_ko') {
    const built = buildGroups(order, options.groups, opts, results);
    groups = built.groups.map((g) => ({
      ...g,
      standings: computeStandings(
        g.playerIds,
        built.matches.filter((m) => m.groupId === g.id),
        orderIndex,
      ),
    }));
    matches = built.matches;
    const groupsDone = groups.every((g) =>
      allResolved(built.matches.filter((m) => m.groupId === g.id)),
    );
    if (groupsDone) {
      const winners = groups.map((g) => g.standings[0]?.id ?? null);
      const runners = groups.map((g) => g.standings[1]?.id ?? null);
      // Group winners are the top seeds, runners-up the lower seeds. The bracket
      // is sized to the next power of two so any number of qualifiers works –
      // surplus slots become byes for the highest-seeded winners.
      const advancers = [...winners, ...runners];
      const bracketSize = koBracketSize(advancers.length);
      const slots = seedOrder(bracketSize).map((seed) => advancers[seed - 1] ?? null);
      const { matches: km, totalRounds } = buildKO(slots, results, opts, 'ko');
      matches = built.matches.concat(km);
      const final = km.find((m) => m.round === totalRounds - 1);
      champion = final ? final.winner : null;
      phaseLabel = 'K.o.-Phase';
    } else {
      phaseLabel = 'Gruppenphase';
    }
  } else if (format === 'swiss') {
    matches = buildSwiss(order, options.rounds, results, opts);
    standings = computeStandings(order, matches, orderIndex);
    const complete =
      matches.filter((m) => m.round === options.rounds - 1).length > 0 &&
      allResolved(matches);
    if (complete) champion = standings[0]?.id ?? null;
    phaseLabel = 'Schweizer System';
  }

  const real = matches.filter((m) => !m.bye);
  const played = real.filter((m) => m.winner);
  const total = gamesFor(format, P);
  const progress = {
    played: played.length,
    total,
    percent: total ? Math.round((played.length / total) * 100) : 0,
  };

  return { format, matches, groups, standings, phaseLabel, champion, progress };
}

// The next real match to play (both players known, not a bye, no winner yet).
export function getCurrentMatch(matches) {
  return (
    matches.find((m) => !m.bye && m.playerA && m.playerB && !m.winner) || null
  );
}

// Up to `n` matches that could run in parallel (one per table): playable,
// unplayed, and with no shared players.
export function getCurrentMatches(matches, n = 1) {
  const result = [];
  const busy = new Set();
  for (const m of matches) {
    if (result.length >= n) break;
    if (m.bye || !m.playerA || !m.playerB || m.winner) continue;
    if (busy.has(m.playerA) || busy.has(m.playerB)) continue;
    result.push(m);
    busy.add(m.playerA);
    busy.add(m.playerB);
  }
  return result;
}

export function getNextMatch(matches, currentId) {
  const start = currentId ? matches.findIndex((m) => m.id === currentId) + 1 : 0;
  for (let i = start; i < matches.length; i += 1) {
    const m = matches[i];
    if (!m.bye && !m.winner && m.playerA && m.playerB) return m;
  }
  return null;
}

// All matches that can currently be edited (ready or already decided).
export function playableMatches(matches) {
  return matches.filter((m) => !m.bye && m.playerA && m.playerB);
}

// Final podium (up to places 1–3) derived per format for the closing screen.
export function getPodium(live) {
  const { format, standings, matches, groups } = live;
  if ((format === 'round_robin' || format === 'swiss') && standings?.length) {
    return standings.slice(0, 3).map((s, i) => ({ id: s.id, place: i + 1 }));
  }
  const ko = matches.filter((m) => m.phase === 'ko');
  if (ko.length) {
    const maxRound = Math.max(...ko.map((m) => m.round));
    const final = ko.find((m) => m.round === maxRound);
    const res = [];
    if (final?.winner) {
      res.push({ id: final.winner, place: 1 });
      const runnerUp = final.winner === final.playerA ? final.playerB : final.playerA;
      if (runnerUp) res.push({ id: runnerUp, place: 2 });
      ko.filter((m) => m.round === maxRound - 1 && m.winner).forEach((m) => {
        const loser = m.winner === m.playerA ? m.playerB : m.playerA;
        if (loser) res.push({ id: loser, place: 3 });
      });
    }
    return res.slice(0, 4);
  }
  const fin = matches.find((m) => m.id === 'final-0');
  if (fin?.winner) {
    const runnerUp = fin.winner === fin.playerA ? fin.playerB : fin.playerA;
    const res = [{ id: fin.winner, place: 1 }];
    if (runnerUp) res.push({ id: runnerUp, place: 2 });
    if (groups?.length) {
      const seconds = groups.map((g) => g.standings[1]).filter(Boolean);
      seconds.sort((a, b) => b.pts - a.pts || b.diff - a.diff);
      seconds.slice(0, 2).forEach((s) => res.push({ id: s.id, place: 3 }));
    }
    return res.slice(0, 4);
  }
  return [];
}

export function validateScore(a, b, match) {
  const target = match?.target ?? 7;
  const bestOf = match?.bestOf ?? 1;
  if (a === '' || b === '' || a == null || b == null) {
    return { ok: false, message: 'Bitte beide Ergebnisse eintragen.' };
  }
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isInteger(na) || !Number.isInteger(nb) || na < 0 || nb < 0) {
    return { ok: false, message: 'Nur ganze, positive Zahlen erlaubt.' };
  }
  if (na === nb) {
    return { ok: false, message: 'Unentschieden ist nicht möglich – es braucht einen Sieger.' };
  }
  if (bestOf === 3) {
    const need = 2;
    if (Math.max(na, nb) !== need) {
      return { ok: false, message: 'Best of 3: Sieger braucht genau 2 Sätze.' };
    }
    if (Math.min(na, nb) > 1) {
      return { ok: false, message: 'Best of 3: maximal 2:1.' };
    }
  } else if (Math.max(na, nb) < target) {
    return { ok: false, message: `Der Sieger muss mindestens ${target} Punkte erreichen.` };
  }
  return { ok: true, message: '' };
}
