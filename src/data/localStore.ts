import { DEFAULT_BLOCK_DAYS } from '../lib/blocks';
import { defaultSettings, withDefaults } from './defaults';
import type { CareState, DataStore } from './types';

const KEY = 'care-blocks-v1';
/**
 * Bump when saved data needs a one-time update.
 * 2: blocks changed from 2 weeks to 1 week. Data saved before then still says 14,
 *    which would override the new default, so it is moved to 7 once. Existing
 *    sign-ups stay attached because every 2-week start date is also a 1-week start date.
 */
const SCHEMA_VERSION = 2;

type Stored = Partial<CareState> & { schemaVersion?: number };

function load(): CareState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Stored;
      const state: CareState = {
        settings: withDefaults(parsed.settings),
        assignments: parsed.assignments ?? {},
        blockouts: parsed.blockouts ?? [],
      };
      if ((parsed.schemaVersion ?? 1) < 2) {
        if (state.settings.blockLengthDays === 14) state.settings.blockLengthDays = DEFAULT_BLOCK_DAYS;
        state.settings.careGuide.intro = state.settings.careGuide.intro.replace(
          'A care block is about 2 weeks of',
          'A care block is one week of',
        );
        save(state);
      }
      return state;
    }
  } catch {
    /* fall through to defaults */
  }
  const fresh: CareState = { settings: defaultSettings(), assignments: {}, blockouts: [] };
  save(fresh);
  return fresh;
}

function save(s: CareState) {
  try {
    const stored: Stored = { ...s, schemaVersion: SCHEMA_VERSION };
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    /* storage unavailable (private mode) – keep in memory */
  }
}

/** Browser-only store, used when Firebase isn't configured. Same interface as the Firebase one. */
export function createLocalStore(): DataStore {
  let state = load();
  const listeners = new Set<(s: CareState) => void>();
  const emit = () => listeners.forEach((l) => l(state));
  const commit = (next: CareState) => {
    state = next;
    save(state);
    emit();
  };

  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load();
      emit();
    }
  });

  return {
    mode: 'local',
    subscribe(onChange) {
      listeners.add(onChange);
      onChange(state);
      return () => listeners.delete(onChange);
    },
    async updateSettings(patch) {
      commit({ ...state, settings: { ...state.settings, ...patch } });
    },
    async setAssignment(blockStart, person, isOther) {
      commit({
        ...state,
        assignments: {
          ...state.assignments,
          [blockStart]: { blockStart, person, isOther, updatedAt: Date.now() },
        },
      });
    },
    async clearAssignment(blockStart) {
      const { [blockStart]: _removed, ...rest } = state.assignments;
      commit({ ...state, assignments: rest });
    },
    async addBlockout(b) {
      const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      commit({ ...state, blockouts: [...state.blockouts, { ...b, id, createdAt: Date.now() }] });
    },
    async deleteBlockout(id) {
      commit({ ...state, blockouts: state.blockouts.filter((b) => b.id !== id) });
    },
  };
}
