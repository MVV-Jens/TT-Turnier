import { useEffect, useMemo, useReducer } from 'react';
import { makeId, createDraw, computeMatches } from '../logic/tournament.js';
import { randomAvatar, nextRandomAvatar, randomColor } from '../data/avatars.js';

const STORAGE_KEY = 'vr-tt-cup-2026';

const initialState = {
  participants: [], // { id, name, avatar, color }
  draw: null, // { slots: [16] }
  scores: {}, // { matchId: { a, b } }
  slushieBreak: false,
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

function makeParticipant(name) {
  return {
    id: makeId('p'),
    name: name.trim(),
    avatar: randomAvatar(),
    color: randomColor(),
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_PARTICIPANTS': {
      const names = action.names
        .map((n) => n.trim())
        .filter((n) => n.length > 0);
      const additions = names.map(makeParticipant);
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
      return {
        ...state,
        participants: state.participants.map((p) =>
          p.id === action.id ? { ...p, avatar: nextRandomAvatar(p.avatar) } : p,
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
      return {
        ...state,
        participants: state.participants.map((p) => ({
          ...p,
          avatar: nextRandomAvatar(p.avatar),
        })),
      };
    }
    case 'DRAW': {
      if (state.participants.length < 2) return state;
      return {
        ...state,
        draw: createDraw(state.participants.map((p) => p.id)),
        scores: {},
        slushieBreak: false,
      };
    }
    case 'SET_SCORE': {
      return {
        ...state,
        scores: {
          ...state.scores,
          [action.matchId]: { a: action.a, b: action.b },
        },
      };
    }
    case 'CLEAR_SCORE': {
      const next = { ...state.scores };
      delete next[action.matchId];
      return { ...state, scores: next };
    }
    case 'TOGGLE_SLUSHIE': {
      return { ...state, slushieBreak: !state.slushieBreak };
    }
    case 'SET_SLUSHIE': {
      return { ...state, slushieBreak: action.value };
    }
    case 'RESET_BRACKET': {
      // Keep participants, clear the tournament progress.
      return { ...state, draw: null, scores: {}, slushieBreak: false };
    }
    case 'RESET_ALL': {
      return { ...initialState };
    }
    case 'HYDRATE': {
      // Replace state with the version persisted by another browser window.
      return { ...initialState, ...action.state };
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

  const matches = useMemo(
    () => computeMatches(state.draw, state.scores),
    [state.draw, state.scores],
  );

  return { state, dispatch, matches, participantsById };
}
