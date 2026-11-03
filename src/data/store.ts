import { useEffect, useMemo, useState } from 'react';
import { createFirebaseStore, hasFirebaseConfig } from './firebaseStore';
import { createLocalStore } from './localStore';
import type { CareState, DataStore } from './types';

let singleton: DataStore | null = null;
export function getStore(): DataStore {
  if (!singleton) singleton = hasFirebaseConfig ? createFirebaseStore() : createLocalStore();
  return singleton;
}

export function useCareData() {
  const store = useMemo(getStore, []);
  const [state, setState] = useState<CareState | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(
    () =>
      store.subscribe(
        (s) => {
          setState(s);
          setError(null);
        },
        (e) => setError(e),
      ),
    [store],
  );

  return { store, state, error };
}

/** SHA-256 hex of the passcode (salted with an app constant). Not real security — just an accident guard. */
export async function hashPasscode(code: string): Promise<string> {
  const input = `care-blocks:${code.trim()}`;
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Non-secure-context fallback (e.g. http on LAN): simple FNV-1a.
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 0x01000193);
  return 'fnv-' + (h >>> 0).toString(16);
}
