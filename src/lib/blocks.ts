import { addDaysISO, daysBetween, type ISODate } from './dates';

export interface Block {
  index: number;
  start: ISODate;
  /** inclusive */
  end: ISODate;
  days: number;
  isPartial: boolean;
}

/**
 * Split [start, end] (both inclusive) into consecutive blocks of `len` days.
 * The final block is shortened if the window doesn't divide evenly.
 */
export function computeBlocks(start: ISODate, end: ISODate, len = 14): Block[] {
  if (!start || !end || len < 1) return [];
  const total = daysBetween(start, end) + 1;
  if (total < 1) return [];
  const blocks: Block[] = [];
  for (let offset = 0, i = 0; offset < total; offset += len, i++) {
    const days = Math.min(len, total - offset);
    const bStart = addDaysISO(start, offset);
    blocks.push({
      index: i,
      start: bStart,
      end: addDaysISO(bStart, days - 1),
      days,
      isPartial: days < len,
    });
  }
  return blocks;
}

/** Inclusive date-range overlap. ISO strings compare correctly lexically. */
export function rangesOverlap(aStart: ISODate, aEnd: ISODate, bStart: ISODate, bEnd: ISODate) {
  return aStart <= bEnd && bStart <= aEnd;
}

/** The intersecting part of two inclusive ranges, or null. */
export function overlapRange(
  aStart: ISODate,
  aEnd: ISODate,
  bStart: ISODate,
  bEnd: ISODate,
): { start: ISODate; end: ISODate } | null {
  if (!rangesOverlap(aStart, aEnd, bStart, bEnd)) return null;
  return { start: aStart > bStart ? aStart : bStart, end: aEnd < bEnd ? aEnd : bEnd };
}

export interface Blockout {
  id: string;
  person: string;
  start: ISODate;
  end: ISODate;
  note?: string;
  createdAt?: number;
}

/** Blockouts that overlap a block (optionally filtered to one person). */
export function blockoutsForBlock(block: Block, blockouts: Blockout[], person?: string) {
  return blockouts.filter(
    (b) =>
      (person === undefined || samePerson(b.person, person)) &&
      rangesOverlap(block.start, block.end, b.start, b.end),
  );
}

export const samePerson = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

/** Index of the block containing `date`, or -1. */
export function blockIndexForDate(blocks: Block[], date: ISODate) {
  return blocks.findIndex((b) => b.start <= date && date <= b.end);
}

/** Assignment keys (block start dates) that don't line up with any current block. */
export function orphanedAssignmentKeys(blocks: Block[], keys: string[]) {
  const starts = new Set(blocks.map((b) => b.start));
  return keys.filter((k) => !starts.has(k));
}
