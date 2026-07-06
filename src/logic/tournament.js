// Pure tournament logic for a 16-player single-elimination bracket.
//
// The state we persist is intentionally minimal:
//   - participants: the players
//   - draw: the fixed round-of-16 slot assignment (16 slots, ids or null)
//   - scores: { [matchId]: { a, b } }
//
// Everything else (who plays whom in later rounds, winners, current match,
// progress) is DERIVED from that minimal state via `computeMatches`.
// This keeps editing results safe: re-computing always yields a consistent
// bracket without stale winners.

export const BRACKET_SIZE = 16;

export const ROUNDS = [
  { key: 'R16', name: 'Achtelfinale', matches: 8, target: 7 },
  { key: 'QF', name: 'Viertelfinale', matches: 4, target: 7 },
  { key: 'SF', name: 'Halbfinale', matches: 2, target: 7 },
  { key: 'F', name: 'Finale', matches: 1, target: 11 },
];

export const FINAL_MATCH_ID = `${ROUNDS.length - 1}-0`;

let idCounter = 0;
export function makeId(prefix = 'p') {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

export function shuffle(input) {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Builds the empty 15-match skeleton with wiring to the next round.
export function buildBracket() {
  const matches = [];
  ROUNDS.forEach((round, r) => {
    for (let i = 0; i < round.matches; i += 1) {
      const isLast = r === ROUNDS.length - 1;
      matches.push({
        id: `${r}-${i}`,
        round: r,
        roundKey: round.key,
        roundName: round.name,
        index: i,
        target: round.target,
        playerA: null,
        playerB: null,
        scoreA: null,
        scoreB: null,
        winner: null,
        bye: false,
        nextMatchId: isLast ? null : `${r + 1}-${Math.floor(i / 2)}`,
        nextSlot: isLast ? null : i % 2 === 0 ? 'A' : 'B',
      });
    }
  });
  return matches;
}

// Creates a fresh round-of-16 draw. Fewer than 16 players => byes (Freilos),
// spread across the bracket so no match has two byes.
export function createDraw(participantIds) {
  const players = shuffle(participantIds).slice(0, BRACKET_SIZE);
  const count = players.length;
  const byes = BRACKET_SIZE - count;

  // Which of the 8 first-round matches receive a bye (spread evenly).
  const byeMatches = new Set();
  if (byes > 0) {
    const step = 8 / byes;
    for (let i = 0; i < byes; i += 1) {
      byeMatches.add(Math.floor(i * step));
    }
  }

  const queue = [...players];
  const slots = new Array(BRACKET_SIZE).fill(null);
  for (let m = 0; m < 8; m += 1) {
    if (byeMatches.has(m)) {
      // Slot A gets a real player, slot B stays empty (Freilos).
      slots[m * 2] = queue.shift() ?? null;
      slots[m * 2 + 1] = null;
    } else {
      slots[m * 2] = queue.shift() ?? null;
      slots[m * 2 + 1] = queue.shift() ?? null;
    }
  }
  return { slots };
}

// Derives the full bracket (players, winners, byes) from draw + scores.
export function computeMatches(draw, scores = {}) {
  const matches = buildBracket();
  if (!draw) return matches;

  const byId = Object.fromEntries(matches.map((m) => [m.id, m]));

  // Seed round of 16 from the draw.
  for (let i = 0; i < 8; i += 1) {
    const m = byId[`0-${i}`];
    m.playerA = draw.slots[i * 2] ?? null;
    m.playerB = draw.slots[i * 2 + 1] ?? null;
  }

  // Resolve rounds in order so winners cascade forward.
  ROUNDS.forEach((round, r) => {
    for (let i = 0; i < round.matches; i += 1) {
      const m = byId[`${r}-${i}`];
      const hasA = m.playerA != null;
      const hasB = m.playerB != null;

      // Byes only exist in the round of 16 (the initial draw). In later rounds
      // a null slot means "opponent not decided yet" – NOT a free win.
      if (r === 0 && hasA && !hasB) {
        m.bye = true;
        m.winner = m.playerA;
      } else if (r === 0 && !hasA && hasB) {
        m.bye = true;
        m.winner = m.playerB;
      } else if (hasA && hasB) {
        const s = scores[m.id];
        if (s && s.a != null && s.b != null && s.a !== s.b) {
          m.scoreA = s.a;
          m.scoreB = s.b;
          m.winner = s.a > s.b ? m.playerA : m.playerB;
        }
      }

      if (m.winner && m.nextMatchId) {
        const next = byId[m.nextMatchId];
        next[m.nextSlot === 'A' ? 'playerA' : 'playerB'] = m.winner;
      }
    }
  });

  return matches;
}

// The match that should be played right now: first real (non-bye) match in
// play order with both players known and no result yet.
export function getCurrentMatch(matches) {
  return (
    matches.find((m) => !m.bye && m.playerA && m.playerB && !m.winner) || null
  );
}

// The next real match after the current one (players may still be TBD).
export function getNextMatch(matches, currentId) {
  const start = currentId ? matches.findIndex((m) => m.id === currentId) + 1 : 0;
  for (let i = start; i < matches.length; i += 1) {
    const m = matches[i];
    if (!m.bye && !m.winner) return m;
  }
  return null;
}

export function getChampion(matches) {
  const final = matches.find((m) => m.id === FINAL_MATCH_ID);
  return final ? final.winner : null;
}

export function isFinished(matches) {
  return Boolean(getChampion(matches));
}

// Progress across all real (playable) matches.
export function getProgress(matches) {
  const real = matches.filter((m) => !m.bye);
  const played = real.filter((m) => m.winner);
  return {
    played: played.length,
    total: real.length,
    percent: real.length ? Math.round((played.length / real.length) * 100) : 0,
  };
}

// Groups matches by round for bracket rendering.
export function matchesByRound(matches) {
  return ROUNDS.map((round, r) => ({
    ...round,
    round: r,
    matches: matches.filter((m) => m.round === r),
  }));
}

// Validates a score entry against the round target. Returns { ok, message }.
export function validateScore(a, b, target) {
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
  if (Math.max(na, nb) < target) {
    return {
      ok: false,
      message: `Der Sieger muss mindestens ${target} Punkte erreichen.`,
    };
  }
  return { ok: true, message: '' };
}
