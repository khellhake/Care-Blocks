import { defaultSettings, withDefaults } from './defaults';
import type { CareState, DataStore } from './types';

const KEY = 'care-blocks-v1';

function load(): CareState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CareState>;
      return {
        settings: withDefaults(parsed.settings),
        assignments: parsed.assignments ?? {},
        blockouts: parsed.blockouts ?? [],
      };
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
    localStorage.setItem(KEY, JSON.stringify(s));
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
