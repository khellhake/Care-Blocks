import { initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { defaultSettings, withDefaults } from './defaults';
import type { Assignment, Blockout, CareState, DataStore, Settings } from './types';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export function createFirebaseStore(): DataStore {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const settingsRef = doc(db, 'settings', 'main');
  const assignmentsCol = collection(db, 'assignments');
  const blockoutsCol = collection(db, 'blockouts');

  return {
    mode: 'firebase',
    subscribe(onChange, onError) {
      let settings: Settings | null = null;
      let assignments: CareState['assignments'] | null = null;
      let blockouts: Blockout[] | null = null;
      const push = () => {
        if (settings && assignments && blockouts) onChange({ settings, assignments, blockouts });
      };
      const err = (e: Error) => onError(e);

      const unsubs = [
        onSnapshot(
          settingsRef,
          (snap) => {
            if (!snap.exists()) {
              // First ever load: write defaults so everyone sees the same window.
              const d = defaultSettings();
              settings = d;
              setDoc(settingsRef, d).catch(err);
            } else {
              settings = withDefaults(snap.data() as Partial<Settings>);
            }
            push();
          },
          err,
        ),
        onSnapshot(
          assignmentsCol,
          (snap) => {
            const a: CareState['assignments'] = {};
            snap.forEach((d) => {
              a[d.id] = { ...(d.data() as Omit<Assignment, 'blockStart'>), blockStart: d.id };
            });
            assignments = a;
            push();
          },
          err,
        ),
        onSnapshot(
          blockoutsCol,
          (snap) => {
            blockouts = snap.docs.map((d) => ({ ...(d.data() as Omit<Blockout, 'id'>), id: d.id }));
            push();
          },
          err,
        ),
      ];
      return () => unsubs.forEach((u) => u());
    },
    async updateSettings(patch) {
      await setDoc(settingsRef, patch, { merge: true });
    },
    async setAssignment(blockStart, person, isOther) {
      await setDoc(doc(assignmentsCol, blockStart), { person, isOther, updatedAt: Date.now() });
    },
    async clearAssignment(blockStart) {
      await deleteDoc(doc(assignmentsCol, blockStart));
    },
    async addBlockout(b) {
      const clean: Record<string, unknown> = { person: b.person, start: b.start, end: b.end, createdAt: Date.now() };
      if (b.note) clean.note = b.note;
      await addDoc(blockoutsCol, clean);
    },
    async deleteBlockout(id) {
      await deleteDoc(doc(blockoutsCol, id));
    },
  };
}
