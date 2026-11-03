import type { Blockout } from '../lib/blocks';
import type { ISODate } from '../lib/dates';

export type { Blockout };

export interface GuideSection {
  title: string;
  items: string[];
}

export interface Settings {
  patientName: string;
  startDate: ISODate;
  endDate: ISODate;
  blockLengthDays: number;
  banner: { message: string; active: boolean };
  careGuide: { intro: string; sections: GuideSection[] };
  /** Names that show up as quick choices. Kevin/Brian/Angie by default; "Other" names get added. */
  people: string[];
  /** SHA-256 hex of the settings passcode, or null before one is created. */
  passcodeHash: string | null;
}

export interface Assignment {
  /** Block start date; also the document id. */
  blockStart: ISODate;
  person: string;
  isOther: boolean;
  updatedAt: number;
}

export interface CareState {
  settings: Settings;
  assignments: Record<ISODate, Assignment>;
  blockouts: Blockout[];
}

export interface DataStore {
  mode: 'firebase' | 'local';
  subscribe(onChange: (s: CareState) => void, onError: (e: Error) => void): () => void;
  updateSettings(patch: Partial<Settings>): Promise<void>;
  setAssignment(blockStart: ISODate, person: string, isOther: boolean): Promise<void>;
  clearAssignment(blockStart: ISODate): Promise<void>;
  addBlockout(b: Omit<Blockout, 'id' | 'createdAt'>): Promise<void>;
  deleteBlockout(id: string): Promise<void>;
}
