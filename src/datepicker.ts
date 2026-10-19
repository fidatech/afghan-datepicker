import {
  addDays, fromCalendar, monthLength, parseISO, shiftMonth, toCalendar, todayISO, weekday
} from './calendar.js';
import type { Calendar, CalendarDate, YearMonth } from './calendar.js';
import { digits, getMonthName, locales } from './locales.js';
import type { Locale, Numerals } from './locales.js';

export interface DatepickerOptions {
  locale?: Locale;
  calendar?: Calendar;
  /** Selected date as Gregorian YYYY-MM-DD, even when displaying Jalali. */
  value?: string | null;
  /** Inclusive Gregorian YYYY-MM-DD limits. */
  min?: string;
  max?: string;
  /** Weekday index: Sunday = 0 ... Saturday = 6; default Saturday. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  numerals?: Numerals;
  theme?: 'light' | 'dark' | 'auto';
  onChange?: (iso: string | null) => void;
}

/**
 * Framework-independent datepicker.
 * - Visible input: localized human-readable date.
 * - Hidden input: Gregorian ISO date under the original form field name.
 */
export class AfghanDatepicker {
  readonly input: HTMLInputElement;
  private host: HTMLSpanElement;
  private popup: HTMLDivElement;
  private formInput: HTMLInputElement | null = null;
  private originalName: string | null;
  private originalPlaceholder: string;
  private originalReadonly: boolean;
  private originalAria: string | null;
  private selected: string | null;
  private view: YearMonth;
  private locale: Locale;
  private calendar: Calendar;
  private numerals: Numerals;
  private weekStartsOn: number;
  private min?: string;
  private max?: string;
  private onChange?: (iso: string | null) => void;
  private disposed = false;
  private suppressFocusOpen = false;

  constructor(target: string | HTMLInputElement, options: DatepickerOptions = {}) {
    const input = typeof target === 'string' ? document.querySelector(target) : target;
    if (!(input instanceof HTMLInputElement)) {
      throw new TypeError('AfghanDatepicker requires an existing input element');
    }
    if (!input.parentNode) throw new Error('Date input must be attached to the DOM');
    this.input = input;
    this.locale = options.locale ?? 'ps-AF';
    this.calendar = options.calendar ?? 'jalali';
    this.numerals = options.numerals ?? (this.locale === 'en' ? 'latin' : 'persian');
    this.weekStartsOn = options.weekStartsOn ?? 6;
    this.min = options.min;
    this.max = options.max;
    this.onChange = options.onChange;
    if (!locales[this.locale]) throw new RangeError('Unknown locale');
    if (this.calendar !== 'jalali' && this.calendar !== 'gregorian') {
      throw new RangeError('Unknown calendar');
    }
    if (!Number.isInteger(this.weekStartsOn) || this.weekStartsOn < 0 || this.weekStartsOn > 6) {
      throw new RangeError('weekStartsOn must be 0 through 6');
    }
    if (this.min) parseISO(this.min);
    if (this.max) parseISO(this.max);
    if (this.min && this.max && this.min > this.max) {
      throw new RangeError('min cannot be after max');
    }

    const supplied = options.value === undefined
      ? (input.dataset.iso || (/^\d{4}-\d{2}-\d{2}$/.test(input.value) ? input.value : null))
      : options.value;
    if (supplied) {
      parseISO(supplied);
      if (!this.allowed(supplied)) throw new RangeError('Selected value is outside min/max');
    }
    this.selected = supplied || null;
    this.view = toCalendar(this.selected ?? todayISO(), this.calendar);

    this.originalName = input.getAttribute('name');
    this.originalPlaceholder = input.placeholder;
    this.originalReadonly = input.readOnly;
    this.originalAria = input.getAttribute('aria-expanded');
    this.host = document.createElement('span');
    this.host.className = 'adp-host';
    this.host.dir = this.locale === 'en' ? 'ltr' : 'rtl';
    this.host.dataset.theme = options.theme ?? 'auto';

    input.parentNode.insertBefore(this.host, input);
    this.host.appendChild(input);
    input.classList.add('adp-input');
    input.readOnly = true;
    input.setAttribute('aria-haspopup', 'dialog');
    input.setAttribute('aria-expanded', 'false');
    if (!this.originalPlaceholder) input.placeholder = locales[this.locale].chooseDate;

    if (this.originalName !== null) {
      this.formInput = document.createElement('input');
      this.formInput.type = 'hidden';
      this.formInput.name = this.originalName;
      input.removeAttribute('name');
      this.host.appendChild(this.formInput);
    }

    this.popup = document.createElement('div');
    this.popup.className = 'adp-popup';
    this.popup.hidden = true;
    this.popup.setAttribute('role', 'dialog');
    this.popup.setAttribute('aria-label', locales[this.locale].chooseDate);
    this.host.appendChild(this.popup);
    this.refreshInput();

    input.addEventListener('click', this.open);
    input.addEventListener('focus', this.onFocus);
    input.addEventListener('keydown', this.onInputKey);
    this.popup.addEventListener('keydown', this.onPopupKey);
    document.addEventListener('pointerdown', this.onOutside);
  }

  getValue(): string | null {
    return this.selected;
  }

  /** Set a Gregorian ISO date, or null to clear. */
  setValue = (iso: string | null): void => {
    this.assertAlive();
    if (iso !== null) {
      parseISO(iso);
      if (!this.allowed(iso)) throw new RangeError('Selected value is outside min/max');
    }
    const changed = this.selected !== iso;
    this.selected = iso;
    if (iso) this.view = toCalendar(iso, this.calendar);
    this.refreshInput();
    if (!this.popup.hidden) this.render();
    if (changed) this.onChange?.(iso);
  };

  open = (): void => {
    this.assertAlive();
    if (!this.popup.hidden) return;
    this.popup.hidden = false;
    this.input.setAttribute('aria-expanded', 'true');
    this.render();
  };

  close = (): void => {
    if (this.disposed || this.popup.hidden) return;
    this.popup.hidden = true;
    this.input.setAttribute('aria-expanded', 'false');
  };

  destroy(): void {
    if (this.disposed) return;
    this.close();
    this.disposed = true;
    this.input.removeEventListener('click', this.open);
    this.input.removeEventListener('focus', this.onFocus);
    this.input.removeEventListener('keydown', this.onInputKey);
    this.popup.removeEventListener('keydown', this.onPopupKey);
    document.removeEventListener('pointerdown', this.onOutside);
    this.input.classList.remove('adp-input');
    this.input.readOnly = this.originalReadonly;
    this.input.placeholder = this.originalPlaceholder;
    this.input.removeAttribute('aria-haspopup');
    if (this.originalAria === null) this.input.removeAttribute('aria-expanded');
    else this.input.setAttribute('aria-expanded', this.originalAria);
    if (this.originalName !== null) this.input.setAttribute('name', this.originalName);
    const parent = this.host.parentNode;
    if (parent) parent.insertBefore(this.input, this.host);
    this.host.remove();
  }

  private assertAlive(): void {
    if (this.disposed) throw new Error('Datepicker was destroyed');
  }

  private allowed(iso: string): boolean {
    return (!this.min || iso >= this.min) && (!this.max || iso <= this.max);
  }

  private refreshInput(): void {
    if (this.selected) {
      const date = toCalendar(this.selected, this.calendar);
      this.input.value = digits(date.day, this.numerals) + ' ' +
        getMonthName(date.month, this.calendar, this.locale) + ' ' +
        digits(date.year, this.numerals);
    } else {
      this.input.value = '';
    }
    this.input.dataset.iso = this.selected ?? '';
    if (this.formInput) this.formInput.value = this.selected ?? '';
  }

  private button(label: string, className: string, action: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', action);
    return button;
  }

  private render(): void {
    this.popup.replaceChildren();
    const dictionary = locales[this.locale];
    const dirRTL = this.locale !== 'en';
    const header = document.createElement('div');
    header.className = 'adp-header';
    const previous = this.button(dirRTL ? '›' : '‹', 'adp-nav', () => this.changeMonth(-1));
    previous.setAttribute('aria-label', dictionary.previousMonth);
    const next = this.button(dirRTL ? '‹' : '›', 'adp-nav', () => this.changeMonth(1));
    next.setAttribute('aria-label', dictionary.nextMonth);
    const title = document.createElement('strong');
    title.className = 'adp-title';
    title.textContent = getMonthName(this.view.month, this.calendar, this.locale) +
      ' ' + digits(this.view.year, this.numerals);
    header.append(previous, title, next);
    this.popup.append(header);

    const grid = document.createElement('div');
    grid.className = 'adp-grid';
    grid.setAttribute('role', 'grid');
    const dayNames = dictionary.weekdays;
    for (let i = 0; i < 7; i++) {
      const dayIndex = (this.weekStartsOn + i) % 7;
      const head = document.createElement('span');
      head.className = 'adp-weekday';
      head.textContent = dayNames[dayIndex].slice(0, 2);
      head.title = dayNames[dayIndex];
      head.setAttribute('aria-label', dayNames[dayIndex]);
      grid.append(head);
    }
    const firstISO = fromCalendar({ ...this.view, day: 1 }, this.calendar);
    const blanks = (weekday(firstISO) - this.weekStartsOn + 7) % 7;
    for (let index = 0; index < blanks; index++) {
      const empty = document.createElement('span');
      empty.className = 'adp-empty';
      empty.setAttribute('aria-hidden', 'true');
      grid.append(empty);
    }
    const length = monthLength(this.view.year, this.view.month, this.calendar);
    const today = todayISO();
    for (let day = 1; day <= length; day++) {
      const date: CalendarDate = { ...this.view, day };
      const iso = fromCalendar(date, this.calendar);
      const cell = this.button(digits(day, this.numerals), 'adp-day', () => {
        this.setValue(iso);
        this.close();
        this.returnFocus();
      });
      cell.dataset.iso = iso;
      cell.setAttribute('aria-label', digits(day, this.numerals) + ' ' +
        getMonthName(this.view.month, this.calendar, this.locale) + ' ' +
        digits(this.view.year, this.numerals));
      cell.setAttribute('aria-pressed', String(iso === this.selected));
      if (iso === this.selected) cell.classList.add('adp-selected');
      if (iso === today) {
        cell.classList.add('adp-today');
        cell.setAttribute('aria-current', 'date');
      }
      cell.disabled = !this.allowed(iso);
      cell.tabIndex = iso === (this.selected ?? today) ? 0 : -1;
      grid.append(cell);
    }
    this.popup.append(grid);
    const footer = document.createElement('div');
    footer.className = 'adp-footer';
    const todayButton = this.button(dictionary.today, 'adp-action', () => {
      this.setValue(todayISO());
      this.close();
      this.returnFocus();
    });
    todayButton.disabled = !this.allowed(today);
    const clearButton = this.button(dictionary.clear, 'adp-action', () => {
      this.setValue(null);
      this.close();
      this.returnFocus();
    });
    footer.append(todayButton, clearButton);
    this.popup.append(footer);
  }

  private changeMonth(offset: number): void {
    const next = shiftMonth(this.view, offset);
    try {
      fromCalendar({ ...next, day: 1 }, this.calendar);
      this.view = next;
      this.render();
    } catch {
      // Calendar conversion is defined only for a bounded range of years.
    }
  }

  private onFocus = (): void => {
    if (!this.suppressFocusOpen) this.open();
  };

  private returnFocus(): void {
    this.suppressFocusOpen = true;
    this.input.focus();
    this.suppressFocusOpen = false;
  }

  private onOutside = (event: PointerEvent): void => {
    if (!this.host.contains(event.target as Node)) this.close();
  };

  private onInputKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') this.close();
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.open();
      const selected = this.popup.querySelector<HTMLButtonElement>('.adp-day[tabindex="0"]:not(:disabled)');
      const first = this.popup.querySelector<HTMLButtonElement>('.adp-day:not(:disabled)');
      (selected ?? first)?.focus();
    }
  };

  private onPopupKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      this.returnFocus();
      return;
    }
    if (!(event.target instanceof HTMLButtonElement) || !event.target.dataset.iso) return;
    const offsets: Record<string, number> = {
      ArrowLeft: this.locale === 'en' ? -1 : 1,
      ArrowRight: this.locale === 'en' ? 1 : -1,
      ArrowUp: -7,
      ArrowDown: 7
    };
    const amount = offsets[event.key];
    if (amount === undefined) return;
    event.preventDefault();
    try {
      const nextISO = addDays(event.target.dataset.iso, amount);
      if (!this.allowed(nextISO)) return;
      this.view = toCalendar(nextISO, this.calendar);
      this.render();
      this.popup.querySelector<HTMLButtonElement>('[data-iso="' + nextISO + '"]')?.focus();
    } catch {
      // Keep focus inside supported calendar range.
    }
  };
}
