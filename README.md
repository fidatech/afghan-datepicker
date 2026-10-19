# Afghan Datepicker

An open-source, framework-independent TypeScript datepicker for Afghan and Persian-script applications, maintained by **Fida Technologies**.

Pashto (ps-AF) · Dari (fa-AF) · Iranian Persian (fa-IR) · English (en).

## Features

- Solar Hijri/Jalali and Gregorian views with separate Afghan and Iranian month names.
- Gregorian YYYY-MM-DD storage/output, suitable for backend APIs, Laravel and database fields.
- Redesigned responsive RTL/LTR popup with complete weekday names (no abbreviations), localized digits, and keyboard navigation.
- Clickable month and year headers: choose a month or jump between 12-year pages; chevron icons match the requested RTL layout.
- Inclusive min/max dates, Today and Clear controls, light/dark/automatic themes.
- CSS isolated under the .adp-host class. No fonts, tracking, remote scripts or API keys.
- ESM and CommonJS bundles plus TypeScript declaration files when built.

**Status:** early v0.1.0 implementation. The npm package is not yet published. The repository includes buildable source, tests and a local demo. Please report any language issues or browser bugs.

## Documentation and interactive playground

The GitHub source includes a [full developer documentation site](demo/index.html) with an interactive datepicker demo, installation instructions, Laravel/React/Vue examples, configuration tables, methods, calendar utilities, keyboard support, styling and troubleshooting. Build and run the project locally to view it at http://localhost:4173/demo/.

The demo uses the supplied Fida Rahmani Technology Services navy-and-orange logo mark, with brand colors separate from the package's customizable CSS variables. The datepicker is intentionally compact (approximately 388 px maximum on desktop) while keeping complete weekday names.

## Start locally

Requires Node.js 20 or newer. The browser test in `npm run check` uses an installed Google Chrome/Chromium browser. On macOS, Chrome is normally detected in `/Applications/Google Chrome.app`; on Linux and Windows, common installation locations are detected automatically. Set `CHROME_BIN` to the absolute path of the browser executable for a nonstandard installation.

~~~bash
git clone https://github.com/fidatech/afghan-datepicker.git
cd afghan-datepicker
npm install
npm run check
~~~

To view the interactive browser demo:

~~~bash
npm run build
python3 -m http.server 4173
~~~

Visit http://localhost:4173/demo/ in your browser. Run a local HTTP server instead of opening the demo via file://.

## Basic usage

After building or once the package is published, import the component and stylesheet from the project or installed package. For local demo usage, see demo/index.html.

~~~html
<form method="post">
  <label for="invoice-date">Invoice date</label>
  <input id="invoice-date" name="invoice_date">
  <button type="submit">Submit</button>
</form>
~~~

~~~ts
import { AfghanDatepicker } from '@fidatech/afghan-datepicker';
import '@fidatech/afghan-datepicker/styles.css';

const picker = new AfghanDatepicker('#invoice-date', {
  locale: 'ps-AF',
  calendar: 'jalali',
  min: '2024-01-01',
  max: '2030-12-31',
  theme: 'light',
  onChange: (iso) => console.log(iso) // Gregorian YYYY-MM-DD or null
});

picker.getValue();
picker.setValue('2026-10-19');
picker.open();
picker.close();
picker.destroy();
~~~

The **visible input** displays a localized date. The library creates a hidden input with the original field name and a Gregorian ISO value. Submitting the form sends invoice_date=2026-10-19; empty selection submits an empty string.

The datepicker takes ownership of the input's value while active, and its destroy() method restores the original name and readonly state. The original display value is not restored by destroy().

## Supported options

| Option | Default | Meaning |
| --- | --- | --- |
| locale | ps-AF | ps-AF, fa-AF, fa-IR, en |
| calendar | jalali | jalali or gregorian view |
| value | null or input ISO | Selected Gregorian ISO date |
| min, max | unset | Inclusive Gregorian ISO boundaries |
| weekStartsOn | 6 | Sunday = 0; Saturday = 6 |
| numerals | persian (latin for en) | persian or latin digit display |
| theme | auto | light, dark or auto |
| onChange | unset | Callback receiving ISO string or null |

Gregorian ISO dates always use Western digits in stored values. No timestamp or timezone is inferred from an ISO date. Today uses the browser's local date.

## Calendar utility API

~~~ts
import { toCalendar, fromCalendar, addDays } from '@fidatech/afghan-datepicker';

toCalendar('2016-04-11'); // { year: 1395, month: 1, day: 23 }
fromCalendar({ year: 1395, month: 1, day: 23 }); // '2016-04-11'
addDays('2024-02-28', 1); // '2024-02-29'
~~~

Jalali conversion uses the established [jalaali-js](https://github.com/jalaali/jalaali-js) algorithm. Its supported year range is bounded and very distant dates can differ from astronomical calendar calculations. Dates intended for official/legal use should be independently checked.

## Keyboard accessibility

Activate the field with Enter, Space or Arrow Down. Click the displayed month to choose among all 12 months, or click the year to browse year pages and select a year followed by a month. The adjacent chevrons navigate months (or years in selection mode). Navigate dates with arrow keys, including week jumps with Up/Down. Use Enter to select and Escape to close. Left/right follows the calendar display direction. Full weekday names are used in every locale, including on mobile.

## Planned improvements

- Automated real-browser component tests and screen-reader review.
- Month/year jump controls and additional accessibility refinements.
- Dedicated React/Vue wrappers and Laravel examples.
- Review Pashto/Dari wording with native-speaking contributors.

These features are planned and are not part of the current release.

## Contributing and licensing

See CONTRIBUTING.md. MIT license, copyright 2026 Fida Technologies. See THIRD_PARTY_NOTICES.md for bundled dependencies.

Maintainer: [@fidatech](https://github.com/fidatech) · [Fida Technologies](https://fida.af)
