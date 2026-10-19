import { isValidJalaaliDate, jalaaliMonthLength, toGregorian, toJalaali } from 'jalaali-js';

export type Calendar = 'jalali' | 'gregorian';
export interface CalendarDate { year: number; month: number; day: number }
export type YearMonth = Pick<CalendarDate, 'year' | 'month'>;

function makeUTCDate(year: number, month: number, day: number): Date {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date;
}

export function isoDate(year: number, month: number, day: number): string {
  if (!Number.isInteger(year) || year < 1 || year > 9999 ||
      !Number.isInteger(month) || month < 1 || month > 12 ||
      !Number.isInteger(day) || day < 1 || day > 31) {
    throw new RangeError('Invalid Gregorian date');
  }
  const date = makeUTCDate(year, month, day);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month ||
      date.getUTCDate() !== day) {
    throw new RangeError('Invalid Gregorian date');
  }
  return String(year).padStart(4, '0') + '-' +
    String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}

/** Parse a strict Gregorian YYYY-MM-DD string without timezone conversion. */
export function parseISO(value: string): CalendarDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new RangeError('Date must be Gregorian YYYY-MM-DD');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  isoDate(year, month, day);
  return { year, month, day };
}

/** The input and returned values are always Gregorian ISO dates. */
export function toCalendar(iso: string, calendar: Calendar = 'jalali'): CalendarDate {
  const { year, month, day } = parseISO(iso);
  if (calendar === 'gregorian') return { year, month, day };
  const result = toJalaali(year, month, day);
  return { year: result.jy, month: result.jm, day: result.jd };
}

/** Convert displayed calendar parts into a Gregorian YYYY-MM-DD string. */
export function fromCalendar(parts: CalendarDate, calendar: Calendar = 'jalali'): string {
  const { year, month, day } = parts;
  if (calendar === 'gregorian') return isoDate(year, month, day);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) ||
      !isValidJalaaliDate(year, month, day)) {
    throw new RangeError('Invalid Jalali date');
  }
  const result = toGregorian(year, month, day);
  return isoDate(result.gy, result.gm, result.gd);
}

export function monthLength(year: number, month: number, calendar: Calendar = 'jalali'): number {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError('Invalid year or month');
  }
  if (calendar === 'jalali') return jalaaliMonthLength(year, month);
  return makeUTCDate(year, month + 1, 0).getUTCDate();
}

export function shiftMonth(parts: YearMonth, offset: number): YearMonth {
  if (!Number.isInteger(offset) || !Number.isInteger(parts.year) ||
      !Number.isInteger(parts.month) || parts.month < 1 || parts.month > 12) {
    throw new RangeError('Invalid month shift');
  }
  const index = parts.year * 12 + parts.month - 1 + offset;
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 + 1 };
}

/** Sunday = 0, Saturday = 6. Computed in UTC for timezone stability. */
export function weekday(iso: string): number {
  const { year, month, day } = parseISO(iso);
  return makeUTCDate(year, month, day).getUTCDay();
}

export function addDays(iso: string, amount: number): string {
  if (!Number.isInteger(amount)) throw new RangeError('Day offset must be an integer');
  const { year, month, day } = parseISO(iso);
  const date = makeUTCDate(year, month, day + amount);
  return isoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function todayISO(now: Date = new Date()): string {
  return isoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
