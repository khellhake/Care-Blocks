import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

/** All dates in the app are date-only strings: "YYYY-MM-DD". */
export type ISODate = string;

export const toDate = (d: ISODate): Date => parseISO(d); // parseISO on date-only → local midnight
export const toISO = (d: Date): ISODate => format(d, 'yyyy-MM-dd');
export const addDaysISO = (d: ISODate, n: number): ISODate => toISO(addDays(toDate(d), n));
export const daysBetween = (a: ISODate, b: ISODate): number =>
  differenceInCalendarDays(toDate(b), toDate(a));
export const todayISO = (): ISODate => toISO(new Date());

export const isValidISO = (d: unknown): d is ISODate =>
  typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(toDate(d).getTime());

/** "Mon, Nov 10" */
export const fmtLong = (d: ISODate) => format(toDate(d), 'EEE, MMM d');
/** "Nov 10" */
export const fmtShort = (d: ISODate) => format(toDate(d), 'MMM d');

/** "Nov 10 – 23" or "Nov 24 – Dec 7" or across years "Dec 29, 2026 – Jan 4, 2027" */
export function fmtRange(start: ISODate, end: ISODate): string {
  const s = toDate(start);
  const e = toDate(end);
  if (start === end) return format(s, 'MMM d');
  if (s.getFullYear() !== e.getFullYear()) {
    return `${format(s, 'MMM d, yyyy')} – ${format(e, 'MMM d, yyyy')}`;
  }
  if (s.getMonth() === e.getMonth()) return `${format(s, 'MMM d')} – ${format(e, 'd')}`;
  return `${format(s, 'MMM d')} – ${format(e, 'MMM d')}`;
}
