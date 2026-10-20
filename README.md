<div align="center">

<img src="demo/assets/fida-mark.webp" width="105" alt="Fida Rahmani Technology Services logo">

# Afghan Datepicker

**A multilingual Solar Hijri (Jalali) and Gregorian datepicker with single-date, date-range and customizable design support.**

پښتو &nbsp;·&nbsp; دری &nbsp;·&nbsp; فارسی &nbsp;·&nbsp; English

[![Build and tests](https://github.com/fidatech/afghan-datepicker/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/fidatech/afghan-datepicker/actions/workflows/ci.yml)
[![GitHub beta](https://img.shields.io/badge/Release-v0.2.0--beta.1-F77700?style=flat&labelColor=0D1E2A)](https://github.com/fidatech/afghan-datepicker/releases/tag/v0.3.0-beta.1)
[![MIT License](https://img.shields.io/badge/License-MIT-0D1E2A?style=flat&labelColor=F77700)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-0D1E2A?style=flat&labelColor=F77700)](examples/typescript)

</div>

![Navy and orange illustration showing a Jalali calendar and Gregorian ISO output](.github/assets/readme-cover.svg)

<div align="center">

**[Get started](#quick-start)** &nbsp;·&nbsp; **[Platforms](#frameworks--platforms)** &nbsp;·&nbsp; **[API reference](#api-at-a-glance)** &nbsp;·&nbsp; **[Download beta](https://github.com/fidatech/afghan-datepicker/releases/tag/v0.3.0-beta.1)**

</div>

> [!NOTE]
> **Public beta.** The source and compiled archives are available on GitHub. Publication to the npm registry has **not been confirmed**. The React Native and Flutter integrations are experimental native examples, not production-certified SDKs.

## Dates your users understand

Afghan Datepicker displays dates in your users' language while returning a standard Gregorian `YYYY-MM-DD` value for APIs, databases and HTML forms.

| | What you get |
| :--- | :--- |
| **Four locales** | Pashto (`ps-AF`), Afghan Dari (`fa-AF`), Iranian Persian (`fa-IR`) and English (`en`) |
| **Two calendars** | Solar Hijri (Jalali) and Gregorian |
| **Readable UI** | Full weekday names, localized digits, RTL/LTR layout and a compact responsive popup |
| **Fast date selection** | Clickable month and year grids, keyboard controls, Today and Clear |
| **Backend-friendly** | Gregorian ISO output, inclusive date limits and native HTML form integration |
| **Customizable styling** | Fida navy-and-orange demo, light/dark/auto themes and CSS variables |

### Localized calendar display

| Language | Locale | First Jalali month | Direction |
| :--- | :--- | :--- | :--- |
| پښتو · Pashto | `ps-AF` | وری | RTL |
| دری · Dari | `fa-AF` | حمل | RTL |
| فارسی · Persian | `fa-IR` | فروردین | RTL |
| English | `en` | Hamal | LTR |

Full weekday labels are retained, without automatic abbreviations.

## Quick start

### Option A · Download a public beta build

Download the verified [**v0.3.0-beta.1 GitHub release**](https://github.com/fidatech/afghan-datepicker/releases/tag/v0.3.0-beta.1).

For npm-based projects, download the `fidatech-afghan-datepicker-0.3.0-beta.1.tgz` file and install it locally:

~~~bash
npm install ./fidatech-afghan-datepicker-0.3.0-beta.1.tgz
~~~

For plain HTML, PHP, Laravel Blade or Django templates, download the [documentation/assets ZIP](https://github.com/fidatech/afghan-datepicker/releases/download/v0.3.0-beta.1/afghan-datepicker-docs.zip), then copy `dist/afghan-datepicker.global.js` and `src/datepicker.css` into your application's public/static assets.

### Option B · Clone and build

Requires Node.js 20 or newer.

~~~bash
git clone https://github.com/fidatech/afghan-datepicker.git
cd afghan-datepicker
npm install
npm run build
python3 -m http.server 4173
~~~

Open **http://localhost:4173/demo/** for the four-language interactive playground and developer documentation.

Run `npm run check` to execute the full test suite. Chrome/Chromium must be installed for the browser tests; configure `CHROME_BIN` if your browser executable is in a nonstandard location.


## Date range mode

Choose a **start** and **end** date from one calendar. Every locale supports
both Jalali and Gregorian views, with the same Gregorian ISO API:

~~~ts
import { AfghanDatepicker } from '@fidatech/afghan-datepicker';
import '@fidatech/afghan-datepicker/styles.css';

const range = new AfghanDatepicker('#booking', {
  selectionMode: 'range',
  locale: 'ps-AF',                // 'fa-AF', 'fa-IR' or 'en'
  calendar: 'jalali',            // or 'gregorian'
  variant: 'soft',               // 'classic', 'soft', 'minimal'
  onRangeChange: ({ start, end }) => console.log(start, end)
});

range.getRange(); // { start: null, end: null } initially
range.setRange({ start: '2026-10-01', end: '2026-10-15' });
range.setRange(null); // Clear both fields
~~~

An input named \`booking\` generates hidden fields \`booking_start\` and
\`booking_end\` for backend forms. Override names with \`startName\` and
\`endName\`. On the first click the start date is submitted with an empty end;
after the second click the inclusive range is complete. The calendar highlights
all days between the endpoints, including across month/year boundaries.
Single-date behavior is unchanged.

### Visual designs and visible attribution

The \`variant\` option selects **Classic** (navy), **Soft** (orange) or
**Minimal** (clean), independently of \`theme: 'light' | 'dark' | 'auto'\`.
CSS variables can override the palette. The [documentation playground](demo/index.html)
includes a design selector and four working range demos.

**Attribution is optional and transparent.** Setting \`attribution: true\`
adds a small **visible** “Powered by Fida Technologies” link to
[https://fida.af](https://fida.af), with \`rel="nofollow"\`.
Its default is \`false\`; the package never inserts hidden promotional links.

**Mobile scope:** the browser range picker works in web applications,
including mobile browsers. The separate React Native and Flutter prototypes
do not yet offer native range selection.

## Integration examples

### JavaScript / TypeScript

After installing the compiled package archive:

~~~html
<label for="invoice_date">Invoice date</label>
<input id="invoice_date" name="invoice_date">
~~~

~~~ts
import { AfghanDatepicker } from '@fidatech/afghan-datepicker';
import '@fidatech/afghan-datepicker/styles.css';

const picker = new AfghanDatepicker('#invoice_date', {
  locale: 'ps-AF',
  calendar: 'jalali',
  theme: 'light',
  min: '2024-01-01',
  onChange: (iso) => console.log(iso) // Gregorian YYYY-MM-DD or null
});
~~~

The visible input displays a localized date. The component creates a hidden form input under the original field name, containing a Gregorian ISO date for submission.

### HTML / Core PHP / Laravel / Django

Copy the standalone JS and CSS into your web application's static directory:

~~~html
<link rel="stylesheet" href="/assets/datepicker.css">
<input id="due_date" name="due_date">

<script src="/assets/afghan-datepicker.global.js"></script>
<script>
  new window.AfghanDatepicker('#due_date', {
    locale: 'fa-AF',
    calendar: 'jalali'
  });
</script>
~~~

Your PHP or Python backend validates the submitted `YYYY-MM-DD` date. The compiled browser component does not require a Node.js server at runtime.

## Frameworks & platforms

**Web applications use the same datepicker. Native mobile examples have their own UIs.**

| Platform | Example / guide | Verification |
| :--- | :--- | :--- |
| TypeScript / Vite | [Complete project](examples/typescript) | Automated build |
| React | [React + Vite](examples/react) | Automated build |
| Vue 3 | [Vue + Vite](examples/vue) | Automated build |
| Laravel | [Blade + ISO validation](examples/laravel) | PHP syntax; end-to-end Laravel test pending |
| Core PHP | [Standalone form](examples/php) | PHP syntax |
| Django / Python | [Django project](examples/django) | Django checks |
| Node.js | [DOM-free calendar core](src/core.ts) | Package tests |
| React Native / Expo | [Native prototype](examples/react-native) | Source transpilation; device tests pending |
| Flutter / Dart | [Native prototype](examples/flutter) | Flutter analyzer; device tests pending |

**[Full installation and platform support guide →](docs/PLATFORMS.md)**

Other server-rendered frameworks can serve the standalone browser bundle, but individual support for every framework has not been verified.

## API at a glance

### Configuration

| Option | Default | Description |
| :--- | :--- | :--- |
| `selectionMode` | `single` | `single` or `range` |
| `range` | `null` | Initial `{ start, end }` Gregorian ISO dates |
| `startName`, `endName` | Default hidden range field names | Override submitted start/end names |
| `variant` | `classic` | `classic`, `soft`, `minimal` |
| `onRangeChange` | Unset | Range change callback |
| `attribution` | `false` | Optional visible Fida credit (nofollow) |
| `locale` | `ps-AF` | `ps-AF`, `fa-AF`, `fa-IR`, `en` |
| `calendar` | `jalali` | `jalali` or `gregorian` |
| `value` | `null` or input ISO | Initial Gregorian date |
| `min`, `max` | Unset | Inclusive Gregorian ISO limits |
| `weekStartsOn` | `6` | Saturday; Sunday is `0` |
| `numerals` | Locale-dependent | `persian` or `latin` |
| `theme` | `auto` | `light`, `dark`, `auto` |
| `onChange` | Unset | Callback receiving ISO string or `null` |

<details>
<summary><strong>Component methods</strong></summary>

~~~ts
picker.getValue();             // '2026-10-19' or null
picker.setValue('2026-10-19');
picker.setValue(null);
picker.open();
picker.close();
picker.destroy();
~~~

Call `destroy()` when removing the associated input, including component cleanup in React and Vue.

</details>

<details>
<summary><strong>Calendar utilities · browser and Node.js</strong></summary>

~~~ts
import {
  toCalendar,
  fromCalendar,
  addDays
} from '@fidatech/afghan-datepicker/core';

toCalendar('2016-04-11');
// { year: 1395, month: 1, day: 23 }

fromCalendar({ year: 1395, month: 1, day: 23 });
// '2016-04-11'

addDays('2024-02-28', 1);
// '2024-02-29'
~~~

</details>

<details>
<summary><strong>Keyboard and RTL behavior</strong></summary>

Activate the input with **Enter**, **Space** or **Arrow Down**. The arrow keys navigate dates, **Enter** selects and **Escape** closes. Left/right follows the calendar display direction.

The web component has focus indicators and browser tests. Additional assistive-technology testing is planned.

</details>

## Development and quality checks

~~~bash
npm install
npm run build          # Build ESM, CommonJS, browser and core bundles
npm run typecheck      # Validate TypeScript
npm run test           # Calendar conversion tests
npm run test:package   # Package entry points
npm run test:browser   # Chromium UI tests
npm run check          # All checks
~~~

The [GitHub Actions suite](.github/workflows/ci.yml) also validates the example projects, including Dart static analysis for the Flutter prototype.

> [!IMPORTANT]
> Jalali conversion is based on [jalaali-js](https://github.com/jalaali/jalaali-js), which has a bounded supported year range. Dates used in official or legal contexts should be checked against the applicable calendar authority.

## Documentation & community

Explore the [documentation source and local demo](demo/index.html), [platform integration guide](docs/PLATFORMS.md) and [release instructions](docs/RELEASING.md). An offline documentation bundle is included in the [GitHub beta release](https://github.com/fidatech/afghan-datepicker/releases/tag/v0.3.0-beta.1).

Contributions are welcome, particularly Pashto/Dari language review, accessibility testing and real-world framework integrations. Read [CONTRIBUTING.md](CONTRIBUTING.md), open an [issue](https://github.com/fidatech/afghan-datepicker/issues) or submit a pull request.

---

<div align="center">

**Built for Afghan and Persian-speaking developers.**

[![By Fida Technologies](https://img.shields.io/badge/By-Fida%20Technologies-0D1E2A?style=flat-square&labelColor=F77700)](https://fida.af)

[Repository](https://github.com/fidatech/afghan-datepicker) &nbsp;·&nbsp; [MIT License](LICENSE) &nbsp;·&nbsp; [Third-party notices](THIRD_PARTY_NOTICES.md)

</div>
