import type { Calendar } from './calendar.js';

export type Locale = 'ps-AF' | 'fa-AF' | 'fa-IR' | 'en';
export type Numerals = 'latin' | 'persian';
export interface Dictionary {
  months: readonly string[];
  weekdays: readonly string[]; // Sunday = 0, Saturday = 6
  today: string;
  clear: string;
  previousMonth: string;
  nextMonth: string;
  chooseDate: string;
}

export const locales: Record<Locale, Dictionary> = {
  'ps-AF': {
    months: ['وری', 'غویی', 'غبرګولی', 'چنګاښ', 'زمری', 'وږی', 'تله', 'لړم', 'لیندۍ', 'مرغومی', 'سلواغه', 'کب'],
    weekdays: ['یکشنبه', 'دوشنبه', 'سې شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'],
    today: 'نن', clear: 'پاکول', previousMonth: 'تېره میاشت', nextMonth: 'راتلونکې میاشت',
    chooseDate: 'نېټه وټاکئ'
  },
  'fa-AF': {
    months: ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'],
    weekdays: ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'],
    today: 'امروز', clear: 'پاک کردن', previousMonth: 'ماه قبل', nextMonth: 'ماه بعد',
    chooseDate: 'تاریخ را انتخاب کنید'
  },
  'fa-IR': {
    months: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
    weekdays: ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'],
    today: 'امروز', clear: 'پاک کردن', previousMonth: 'ماه قبل', nextMonth: 'ماه بعد',
    chooseDate: 'تاریخ را انتخاب کنید'
  },
  en: {
    months: ['Hamal', 'Sawr', 'Jawza', 'Saratan', 'Asad', 'Sonbola', 'Mizan', 'Aqrab', 'Qaws', 'Jadi', 'Dalw', 'Hut'],
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    today: 'Today', clear: 'Clear', previousMonth: 'Previous month', nextMonth: 'Next month',
    chooseDate: 'Choose date'
  }
};

/** Convert ASCII digits for visual output; stored dates stay Gregorian ISO. */
export function digits(value: string | number, numerals: Numerals = 'latin'): string {
  const text = String(value);
  return numerals === 'persian'
    ? text.replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)])
    : text;
}

export function getMonthName(month: number, calendar: Calendar, locale: Locale): string {
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError('Invalid month');
  if (calendar === 'jalali') return locales[locale].months[month - 1];
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : locale, {
    month: 'long', calendar: 'gregory', timeZone: 'UTC'
  }).format(new Date(Date.UTC(2024, month - 1, 1)));
}
