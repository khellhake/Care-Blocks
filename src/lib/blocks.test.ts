import { describe, expect, it } from 'vitest';
import {
  blockIndexForDate,
  blockoutsForBlock,
  computeBlocks,
  orphanedAssignmentKeys,
  overlapRange,
  rangesOverlap,
} from './blocks';
import { fmtRange } from './dates';

describe('computeBlocks', () => {
  it('splits an even window into 14-day blocks', () => {
    const b = computeBlocks('2026-11-01', '2026-11-28', 14);
    expect(b).toHaveLength(2);
    expect(b[0]).toMatchObject({ start: '2026-11-01', end: '2026-11-14', days: 14, isPartial: false });
    expect(b[1]).toMatchObject({ start: '2026-11-15', end: '2026-11-28', days: 14, isPartial: false });
  });

  it('shortens the final block', () => {
    const b = computeBlocks('2026-11-01', '2026-11-20', 14);
    expect(b).toHaveLength(2);
    expect(b[1]).toMatchObject({ start: '2026-11-15', end: '2026-11-20', days: 6, isPartial: true });
  });

  it('handles month/year rollovers and DST', () => {
    const b = computeBlocks('2026-12-20', '2027-03-31', 14);
    expect(b[1].start).toBe('2027-01-03');
    // US DST starts 2027-03-14 — no off-by-one
    expect(b.every((x, i) => i === 0 || x.start > b[i - 1].end)).toBe(true);
    expect(b.at(-1)!.end).toBe('2027-03-31');
  });

  it('defaults to 1-week blocks', () => {
    const b = computeBlocks('2026-11-02', '2026-11-29');
    expect(b).toHaveLength(4);
    expect(b.every((x) => x.days === 7)).toBe(true);
    expect(b[1].start).toBe('2026-11-09');
  });

  it('keeps 2-week sign-ups attached when switching to 1-week blocks', () => {
    const twoWeek = computeBlocks('2026-11-02', '2027-01-31', 14);
    const oneWeek = computeBlocks('2026-11-02', '2027-01-31', 7);
    expect(orphanedAssignmentKeys(oneWeek, twoWeek.map((b) => b.start))).toEqual([]);
  });

  it('returns no blocks for an inverted range', () => {
    expect(computeBlocks('2026-11-10', '2026-11-01')).toEqual([]);
  });

  it('extending the end date keeps earlier block starts stable', () => {
    const short = computeBlocks('2026-11-01', '2027-01-31', 14);
    const long = computeBlocks('2026-11-01', '2027-03-31', 14);
    short.forEach((b, i) => expect(long[i].start).toBe(b.start));
    expect(orphanedAssignmentKeys(long, short.map((b) => b.start))).toEqual([]);
  });

  it('flags orphaned assignments when the start date moves', () => {
    const moved = computeBlocks('2026-11-03', '2027-01-31', 14);
    expect(orphanedAssignmentKeys(moved, ['2026-11-01', '2026-11-17'])).toEqual(['2026-11-01']);
  });
});

describe('overlap helpers', () => {
  it('treats touching edges as overlapping (inclusive)', () => {
    expect(rangesOverlap('2026-11-01', '2026-11-14', '2026-11-14', '2026-11-20')).toBe(true);
    expect(rangesOverlap('2026-11-01', '2026-11-14', '2026-11-15', '2026-11-20')).toBe(false);
  });

  it('computes the intersection', () => {
    expect(overlapRange('2026-11-01', '2026-11-14', '2026-11-10', '2026-11-30')).toEqual({
      start: '2026-11-10',
      end: '2026-11-14',
    });
  });

  it('finds blockouts for a block and person (case-insensitive)', () => {
    const [block] = computeBlocks('2026-11-01', '2026-11-14', 14);
    const bos = [
      { id: '1', person: 'Brian', start: '2026-11-10', end: '2026-11-12' },
      { id: '2', person: 'Angie', start: '2026-11-20', end: '2026-11-22' },
      { id: '3', person: 'brian ', start: '2026-10-25', end: '2026-11-01' },
    ];
    expect(blockoutsForBlock(block, bos).map((b) => b.id)).toEqual(['1', '3']);
    expect(blockoutsForBlock(block, bos, 'Brian').map((b) => b.id)).toEqual(['1', '3']);
    expect(blockoutsForBlock(block, bos, 'Angie')).toEqual([]);
  });

  it('finds the block containing a date', () => {
    const b = computeBlocks('2026-11-01', '2026-12-31', 14);
    expect(blockIndexForDate(b, '2026-11-15')).toBe(1);
    expect(blockIndexForDate(b, '2027-01-01')).toBe(-1);
  });
});

describe('fmtRange', () => {
  it('formats compactly', () => {
    expect(fmtRange('2026-11-01', '2026-11-14')).toBe('Nov 1 – 14');
    expect(fmtRange('2026-11-29', '2026-12-12')).toBe('Nov 29 – Dec 12');
    expect(fmtRange('2026-12-27', '2027-01-09')).toBe('Dec 27, 2026 – Jan 9, 2027');
  });
});
