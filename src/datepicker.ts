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
  private displayMode: 'days' | 'months' | 'years' = 'days';
  private yearPageStart = 0;

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
    this.yearPageStart = Math.floor(this.view.year / 12) * 12;

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
    window.addEventListener('resize', this.positionPopup);
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
    this.displayMode = 'days';
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
    window.removeEventListener('resize', this.positionPopup);
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

  /** Each chevron is an actual SVG, with a stable direction in RTL and LTR. */
  private navButton(direction: 'previous' | 'next', label: string, action: () => void): HTMLButtonElement {
    const button = this.button('', 'adp-nav', action);
    button.setAttribute('aria-label', label);
    button.title = label;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // In RTL: first button is on the right; it shows <, and the left button shows >.
    path.setAttribute('d', direction === 'previous' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6');
    svg.append(path);
    button.append(svg);
    return button;
  }

  private canShowMonth(year: number, month: number): boolean {
    try {
      const first = fromCalendar({ year, month, day: 1 }, this.calendar);
      const last = fromCalendar({ year, month, day: monthLength(year, month, this.calendar) }, this.calendar);
      return (!this.min || last >= this.min) && (!this.max || first <= this.max);
    } catch {
      // Outside jalaali-js supported years, or beyond Gregorian ISO year limits.
      return false;
    }
  }

  private canShowYear(year: number): boolean {
    for (let month = 1; month <= 12; month++) {
      if (this.canShowMonth(year, month)) return true;
    }
    return false;
  }

  private toggleMode(mode: 'months' | 'years'): void {
    this.displayMode = this.displayMode === mode ? 'days' : mode;
    if (this.displayMode === 'years') {
      this.yearPageStart = Math.floor(this.view.year / 12) * 12;
    }
    this.render();
    const selector = mode === 'months' ? '.adp-month-trigger' : '.adp-year-trigger';
    this.popup.querySelector<HTMLButtonElement>(selector)?.focus({ preventScroll: true });
  }

  private render(): void {
    this.popup.replaceChildren();
    const dictionary = locales[this.locale];
    const header = document.createElement('div');
    header.className = 'adp-header';

    const previousLabel = this.displayMode === 'years' ? dictionary.previousYears :
      this.displayMode === 'months' ? dictionary.previousYear : dictionary.previousMonth;
    const nextLabel = this.displayMode === 'years' ? dictionary.nextYears :
      this.displayMode === 'months' ? dictionary.nextYear : dictionary.nextMonth;
    const previous = this.navButton('previous', previousLabel, () => this.navigate(-1));
    const next = this.navButton('next', nextLabel, () => this.navigate(1));
    const heading = document.createElement('div');
    heading.className = 'adp-heading';
    const month = this.button(
      getMonthName(this.view.month, this.calendar, this.locale),
      'adp-picker-trigger adp-month-trigger',
      () => this.toggleMode('months')
    );
    month.setAttribute('aria-label', dictionary.chooseMonth);
    month.setAttribute('aria-expanded', String(this.displayMode === 'months'));
    month.setAttribute('aria-pressed', String(this.displayMode === 'months'));
    const year = this.button(
      digits(this.view.year, this.numerals),
      'adp-picker-trigger adp-year-trigger',
      () => this.toggleMode('years')
    );
    year.setAttribute('aria-label', dictionary.chooseYear);
    year.setAttribute('aria-expanded', String(this.displayMode === 'years'));
    year.setAttribute('aria-pressed', String(this.displayMode === 'years'));
    heading.append(month, year);
    header.append(previous, heading, next);
    this.popup.append(header);

    if (this.displayMode === 'months') {
      previous.disabled = !this.canShowYear(this.view.year - 1);
      next.disabled = !this.canShowYear(this.view.year + 1);
      this.renderMonths();
    } else if (this.displayMode === 'years') {
      previous.disabled = !Array.from({ length: 12 }, (_, i) => this.yearPageStart - 12 + i)
        .some((candidate) => this.canShowYear(candidate));
      next.disabled = !Array.from({ length: 12 }, (_, i) => this.yearPageStart + 12 + i)
        .some((candidate) => this.canShowYear(candidate));
      this.renderYears();
    } else {
      const before = shiftMonth(this.view, -1);
      const after = shiftMonth(this.view, 1);
      previous.disabled = !this.canShowMonth(before.year, before.month);
      next.disabled = !this.canShowMonth(after.year, after.month);
      this.renderDays();
      this.renderFooter();
    }
    this.positionPopup();
  }

  private renderMonths(): void {
    const grid = document.createElement('div');
    grid.className = 'adp-choices adp-month-choices';
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', locales[this.locale].chooseMonth);
    for (let month = 1; month <= 12; month++) {
      const option = this.button(
        getMonthName(month, this.calendar, this.locale),
        'adp-choice adp-month-option',
        () => {
          this.view = { year: this.view.year, month };
          this.displayMode = 'days';
          this.render();
          this.popup.querySelector<HTMLButtonElement>('.adp-day:not(:disabled)')?.focus({ preventScroll: true });
        }
      );
      option.disabled = !this.canShowMonth(this.view.year, month);
      option.setAttribute('aria-pressed', String(month === this.view.month));
      if (month === this.view.month) option.classList.add('adp-choice-current');
      grid.append(option);
    }
    this.popup.append(grid);
  }

  private renderYears(): void {
    const grid = document.createElement('div');
    grid.className = 'adp-choices adp-year-choices';
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', locales[this.locale].chooseYear);
    for (let year = this.yearPageStart; year < this.yearPageStart + 12; year++) {
      const candidate = year;
      const option = this.button(digits(year, this.numerals), 'adp-choice adp-year-option', () => {
        const selectedMonth = this.canShowMonth(candidate, this.view.month)
          ? this.view.month
          : Array.from({ length: 12 }, (_, index) => index + 1)
            .find((month) => this.canShowMonth(candidate, month));
        if (selectedMonth === undefined) return;
        this.view = { year: candidate, month: selectedMonth };
        this.displayMode = 'months';
        this.render();
        this.popup.querySelector<HTMLButtonElement>(
          '.adp-month-option[aria-pressed="true"]:not(:disabled)'
        )?.focus({ preventScroll: true });
      });
      option.disabled = !this.canShowYear(candidate);
      option.setAttribute('aria-pressed', String(candidate === this.view.year));
      if (candidate === this.view.year) option.classList.add('adp-choice-current');
      grid.append(option);
    }
    this.popup.append(grid);
  }

  private renderDays(): void {
    const dictionary = locales[this.locale];
    const grid = document.createElement('div');
    grid.className = 'adp-grid';
    grid.setAttribute('role', 'grid');
    for (let i = 0; i < 7; i++) {
      const dayIndex = (this.weekStartsOn + i) % 7;
      const head = document.createElement('span');
      head.className = 'adp-weekday';
      // The complete name is always displayed. No automatic slicing or abbreviations.
      head.textContent = dictionary.weekdays[dayIndex];
      head.title = dictionary.weekdays[dayIndex];
      head.setAttribute('aria-label', dictionary.weekdays[dayIndex]);
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
  }

  private renderFooter(): void {
    const dictionary = locales[this.locale];
    const footer = document.createElement('div');
    footer.className = 'adp-footer';
    const todayButton = this.button(dictionary.today, 'adp-action adp-today-action', () => {
      this.setValue(todayISO());
      this.close();
      this.returnFocus();
    });
    todayButton.disabled = !this.allowed(todayISO());
    const clearButton = this.button(dictionary.clear, 'adp-action adp-clear-action', () => {
      this.setValue(null);
      this.close();
      this.returnFocus();
    });
    footer.append(todayButton, clearButton);
    this.popup.append(footer);
  }

  private navigate(offset: number): void {
    if (this.displayMode === 'years') {
      const next = this.yearPageStart + offset * 12;
      if (Array.from({ length: 12 }, (_, i) => next + i).some((year) => this.canShowYear(year))) {
        this.yearPageStart = next;
      }
    } else if (this.displayMode === 'months') {
      if (this.canShowYear(this.view.year + offset)) {
        this.view = { year: this.view.year + offset, month: this.view.month };
      }
    } else {
      const next = shiftMonth(this.view, offset);
      if (this.canShowMonth(next.year, next.month)) this.view = next;
    }
    this.render();
  }

  /** Keep wide, full-weekday popups on screen, including narrow RTL layouts. */
  private positionPopup = (): void => {
    if (this.popup.hidden) return;
    this.popup.style.transform = '';
    const bounds = this.popup.getBoundingClientRect();
    const viewport = document.documentElement.clientWidth;
    const margin = 10;
    if (bounds.left < margin) {
      this.popup.style.transform = 'translateX(' + (margin - bounds.left) + 'px)';
    } else if (bounds.right > viewport - margin) {
      this.popup.style.transform = 'translateX(' + (viewport - margin - bounds.right) + 'px)';
    }
  };

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
