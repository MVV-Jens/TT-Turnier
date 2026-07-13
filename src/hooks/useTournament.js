import { useEffect, useMemo, useReducer } from 'react';
import { makeId, buildTournament, computeTournament } from '../logic/engine.js';
import { computeCrownsTournament } from '../logic/crowns.js';
import { leastUsedAvatar, leastUsedColor } from '../data/avatars.js';

const STORAGE_KEY = 'vr-tt-cup-2026';

const initialState = {
  participants: [], // { id, name, avatar, color }
  config: { tables: 1, minutes: 90, setLength: 'short', title: 'VR Tischtennis Cup', soundOn: false },
  tournament: null, // { format, order, options }
  results: {}, // { matchId: { a, b } }
  startedAt: null, // ms timestamp when the tournament was started
  kotb: null, // { crowns:[playerId], startedAt, endedAt, phase:'crowns'|'ko', koOrder }
  slushieBreak: false,
  motivationBreak: false,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return { ...initialState, ...parsed };
  } catch {
    return initialState;
  }
}

function makeParticipant(name, usedAvatars = [], usedColors = []) {
  return {
    id: makeId('p'),
    name: name.trim(),
    avatar: leastUsedAvatar(usedAvatars),
    color: leastUsedColor(usedColors),
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_PARTICIPANTS': {
      const names = action.names
        .map((n) => n.trim())
        .filter((n) => n.length > 0);
      const usedAvatars = state.participants.map((p) => p.avatar);
      const usedColors = state.participants.map((p) => p.color);
      const additions = [];
      names.forEach((name) => {
        const p = makeParticipant(name, usedAvatars, usedColors);
        additions.push(p);
        usedAvatars.push(p.avatar);
        usedColors.push(p.color);
      });
      return { ...state, participants: [...state.participants, ...additions] };
    }
    case 'RENAME_PARTICIPANT': {
      return {
        ...state,
        participants: state.participants.map((p) =>
          p.id === action.id ? { ...p, name: action.name } : p,
        ),
      };
    }
    case 'REMOVE_PARTICIPANT': {
      return {
        ...state,
        participants: state.participants.filter((p) => p.id !== action.id),
      };
    }
    case 'SHUFFLE_AVATAR': {
      const others = state.participants
        .filter((p) => p.id !== action.id)
        .map((p) => p.avatar);
      return {
        ...state,
        participants: state.participants.map((p) =>
          p.id === action.id ? { ...p, avatar: leastUsedAvatar(others) } : p,
        ),
      };
    }
    case 'SET_AVATAR': {
      return {
        ...state,
        participants: state.participants.map((p) =>
          p.id === action.id ? { ...p, avatar: action.avatar } : p,
        ),
      };
    }
    case 'RANDOMIZE_ALL_AVATARS': {
      const used = [];
      return {
        ...state,
        participants: state.participants.map((p) => {
          const avatar = leastUsedAvatar(used);
          used.push(avatar);
          return { ...p, avatar };
        }),
      };
    }
    case 'SET_CONFIG': {
      return { ...state, config: { ...state.config, ...action.config } };
    }
    case 'START_TOURNAMENT': {
      if (state.participants.length < 4) return state;
      const ids = state.participants.map((p) => p.id);
      const tournament = buildTournament(
        action.format,
        ids,
        state.config.setLength,
        action.kotbOptions || {},
      );
      const kotb =
        action.format === 'kotb'
          ? {
              crowns: [],
              startedAt: Date.now(),
              endedAt: null,
              phase: 'crowns',
              koOrder: null,
              handicaps: [],
              handicapThreshold: Math.max(0, Math.floor(action.kotbOptions?.handicapThreshold) || 0),
            }
          : null;
      return {
        ...state,
        tournament,
        results: {},
        startedAt: Date.now(),
        kotb,
        slushieBreak: false,
        motivationBreak: false,
      };
    }
    case 'SET_RESULT': {
      return {
        ...state,
        results: {
          ...state.results,
          [action.matchId]: { a: action.a, b: action.b },
        },
      };
    }
    case 'CLEAR_RESULT': {
      const next = { ...state.results };
      delete next[action.matchId];
      return { ...state, results: next };
    }
    case 'KOTB_AWARD': {
      if (!state.kotb || state.kotb.phase !== 'crowns') return state;
      const crowns = [...state.kotb.crowns, action.playerId];
      let handicaps = state.kotb.handicaps || [];
      const threshold = state.kotb.handicapThreshold || 0;
      // Auto-mark a handicap once a player reaches the crown threshold. Sticky:
      // it is never auto-removed (stays even if crowns drop via undo).
      if (threshold > 0 && !handicaps.includes(action.playerId)) {
        const count = crowns.reduce((n, id) => (id === action.playerId ? n + 1 : n), 0);
        if (count >= threshold) handicaps = [...handicaps, action.playerId];
      }
      return { ...state, kotb: { ...state.kotb, crowns, handicaps } };
    }
    case 'KOTB_UNDO': {
      if (!state.kotb || state.kotb.crowns.length === 0) return state;
      return {
        ...state,
        kotb: { ...state.kotb, crowns: state.kotb.crowns.slice(0, -1) },
      };
    }
    case 'KOTB_REMOVE': {
      if (!state.kotb || state.kotb.phase !== 'crowns') return state;
      const idx = state.kotb.crowns.lastIndexOf(action.playerId);
      if (idx === -1) return state;
      const crowns = state.kotb.crowns.slice();
      crowns.splice(idx, 1);
      return { ...state, kotb: { ...state.kotb, crowns } };
    }
    case 'KOTB_TOGGLE_HANDICAP': {
      if (!state.kotb) return state;
      const current = state.kotb.handicaps || [];
      const handicaps = current.includes(action.playerId)
        ? current.filter((id) => id !== action.playerId)
        : [...current, action.playerId];
      return { ...state, kotb: { ...state.kotb, handicaps } };
    }
    case 'KOTB_SET_HANDICAP_THRESHOLD': {
      if (!state.kotb) return state;
      const value = Math.max(0, Math.floor(action.value) || 0);
      let handicaps = state.kotb.handicaps || [];
      if (value > 0) {
        // Retroactively mark everyone already at/above the new threshold.
        const counts = {};
        state.kotb.crowns.forEach((id) => {
          counts[id] = (counts[id] || 0) + 1;
        });
        const toAdd = Object.keys(counts).filter(
          (id) => counts[id] >= value && !handicaps.includes(id),
        );
        if (toAdd.length) handicaps = [...handicaps, ...toAdd];
      }
      return { ...state, kotb: { ...state.kotb, handicapThreshold: value, handicaps } };
    }
    case 'KOTB_START_KO': {
      if (!state.kotb || !action.koOrder || action.koOrder.length < 2) return state;
      return {
        ...state,
        results: {},
        kotb: { ...state.kotb, phase: 'ko', koOrder: action.koOrder, endedAt: Date.now() },
      };
    }
    case 'KOTB_REOPEN_CROWNS': {
      if (!state.kotb) return state;
      return {
        ...state,
        results: {},
        kotb: { ...state.kotb, phase: 'crowns', koOrder: null, endedAt: null },
      };
    }
    case 'TOGGLE_SLUSHIE': {
      return { ...state, slushieBreak: !state.slushieBreak, motivationBreak: false };
    }
    case 'SET_SLUSHIE': {
      return { ...state, slushieBreak: action.value };
    }
    case 'TOGGLE_MOTIVATION': {
      return { ...state, motivationBreak: !state.motivationBreak, slushieBreak: false };
    }
    case 'RESET_BRACKET': {
      // Keep participants + config, clear the running tournament.
      return { ...state, tournament: null, results: {}, startedAt: null, kotb: null, slushieBreak: false, motivationBreak: false };
    }
    case 'RESET_ALL': {
      return { ...initialState };
    }
    case 'HYDRATE': {
      // Replace state with the version persisted by another browser window.
      return {
        ...initialState,
        ...action.state,
        config: { ...initialState.config, ...(action.state.config || {}) },
      };
    }
    default:
      return state;
  }
}

export function useTournament() {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  // Persist to localStorage. Only write when the serialized value actually
  // changed – this prevents a save/hydrate ping-pong between windows.
  useEffect(() => {
    try {
      const serialized = JSON.stringify(state);
      if (localStorage.getItem(STORAGE_KEY) !== serialized) {
        localStorage.setItem(STORAGE_KEY, serialized);
      }
    } catch {
      // Ignore storage quota / private mode errors – app still works in memory.
    }
  }, [state]);

  // Live sync across browser windows/tabs of the same origin. The `storage`
  // event fires in every OTHER window when localStorage is updated, so admin
  // changes appear on the beamer window instantly (and vice versa).
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        const incoming = e.newValue ? JSON.parse(e.newValue) : initialState;
        dispatch({ type: 'HYDRATE', state: incoming });
      } catch {
        // Ignore malformed payloads.
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const participantsById = useMemo(
    () => Object.fromEntries(state.participants.map((p) => [p.id, p])),
    [state.participants],
  );

  const live = useMemo(
    () =>
      state.tournament?.format === 'kotb'
        ? computeCrownsTournament(state.tournament, state.kotb, state.results)
        : computeTournament(state.tournament, state.results),
    [state.tournament, state.kotb, state.results],
  );

  return { state, dispatch, live, participantsById };
}
