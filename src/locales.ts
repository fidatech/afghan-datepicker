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
  chooseMonth: string;
  chooseYear: string;
  previousYear: string;
  nextYear: string;
  previousYears: string;
  nextYears: string;
  rangeStart: string;
  rangeEnd: string;
  rangeDone: string;
}

export const locales: Record<Locale, Dictionary> = {
  'ps-AF': {
    months: ['وری', 'غویی', 'غبرګولی', 'چنګاښ', 'زمری', 'وږی', 'تله', 'لړم', 'لیندۍ', 'مرغومی', 'سلواغه', 'کب'],
    weekdays: ['یونۍ', 'دونۍ', 'درېنۍ', 'څلورنۍ', 'پنځنۍ', 'جمعه', 'خالي'],
    today: 'نن', clear: 'پاکول', previousMonth: 'تېره میاشت', nextMonth: 'راتلونکې میاشت',
    chooseDate: 'نېټه وټاکئ',
    chooseMonth: 'میاشت وټاکئ', chooseYear: 'کال وټاکئ',
    previousYear: 'تېر کال', nextYear: 'راتلونکی کال',
    previousYears: 'تېر کلونه', nextYears: 'راتلونکي کلونه',
    rangeStart: 'د پیل نېټه وټاکئ', rangeEnd: 'د پای نېټه وټاکئ', rangeDone: 'د نېټو موده ټاکل شوې'
  },
  'fa-AF': {
    months: ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'],
    weekdays: ['یکشنبه', 'دوشنبه', 'سه شنبه', 'چهارشنبه', 'پنج شنبه', 'جمعه', 'شنبه'],
    today: 'امروز', clear: 'پاک کردن', previousMonth: 'ماه قبل', nextMonth: 'ماه بعد',
    chooseDate: 'تاریخ را انتخاب کنید',
    chooseMonth: 'انتخاب ماه', chooseYear: 'انتخاب سال',
    previousYear: 'سال قبل', nextYear: 'سال بعد',
    previousYears: 'سال‌های قبل', nextYears: 'سال‌های بعد',
    rangeStart: 'تاریخ شروع را انتخاب کنید', rangeEnd: 'تاریخ پایان را انتخاب کنید', rangeDone: 'محدوده تاریخ انتخاب شد'
  },
  'fa-IR': {
    months: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
    weekdays: ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'],
    today: 'امروز', clear: 'پاک کردن', previousMonth: 'ماه قبل', nextMonth: 'ماه بعد',
    chooseDate: 'تاریخ را انتخاب کنید',
    chooseMonth: 'انتخاب ماه', chooseYear: 'انتخاب سال',
    previousYear: 'سال قبل', nextYear: 'سال بعد',
    previousYears: 'سال‌های قبل', nextYears: 'سال‌های بعد',
    rangeStart: 'تاریخ شروع را انتخاب کنید', rangeEnd: 'تاریخ پایان را انتخاب کنید', rangeDone: 'بازه تاریخ انتخاب شد'
  },
  en: {
    months: ['Hamal', 'Sawr', 'Jawza', 'Saratan', 'Asad', 'Sonbola', 'Mizan', 'Aqrab', 'Qaws', 'Jadi', 'Dalw', 'Hut'],
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    today: 'Today', clear: 'Clear', previousMonth: 'Previous month', nextMonth: 'Next month',
    chooseDate: 'Choose date',
    chooseMonth: 'Choose month', chooseYear: 'Choose year',
    previousYear: 'Previous year', nextYear: 'Next year',
    previousYears: 'Previous years', nextYears: 'Next years',
    rangeStart: 'Select start date', rangeEnd: 'Select end date', rangeDone: 'Date range selected'
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
