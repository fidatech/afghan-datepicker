# Platform installation and integration

Afghan Datepicker is a **web TypeScript package**, with a separate DOM-free
calendar API for JavaScript runtimes. The browser UI can be used in any web
backend (PHP, Python, Java, .NET, etc.) that renders HTML. React Native and
Flutter require independent native UI components and are **examples only**.

## Support matrix

| Platform | Approach | Source | Current status |
| --- | --- | --- | --- |
| Plain HTML / JavaScript | Bundled browser script + CSS | [Core PHP](../examples/php) | Browser-tested core |
| TypeScript | ESM / types | [TypeScript Vite](../examples/typescript) | Build-tested |
| React | Lifecycle wrapper | [React Vite](../examples/react) | Build-tested |
| Vue 3 | Lifecycle wrapper | [Vue Vite](../examples/vue) | Build-tested |
| Laravel | Browser bundle + Blade + backend validation | [Laravel](../examples/laravel) | PHP lint and documented integration |
| Core PHP | Browser bundle + PHP ISO validation | [Core PHP](../examples/php) | PHP lint and bundle |
| Python / Django | Browser bundle + template/staticfiles + ISO validation | [Django](../examples/django) | Django checks |
| Flask / FastAPI | Browser bundle + HTML template | Plain HTML instructions below | Integration recipe |
| Node.js | DOM-free calendar core | Below | Automated tests |
| React Native / Expo | Independent native UI + JS calendar core | [React Native](../examples/react-native) | Prototype; device tests pending |
| Flutter / Dart | Native widgets + shamsi_date | [Flutter](../examples/flutter) | Prototype; Dart/device tests pending |

Other browser-based technologies such as WordPress, Symfony, Svelte, Angular,
Nuxt, Next.js, Rails and ASP.NET can load the same JS/CSS assets. These are
integration patterns, not claims that every framework has been individually
validated.

## Date range mode in web applications

For **every** supported locale and calendar view, the web package can select
a start and end date from one popup:

~~~js
new window.AfghanDatepicker('#period', {
  selectionMode: 'range',
  locale: 'fa-AF',
  calendar: 'jalali',
  variant: 'classic'
});
~~~

An HTML input named `period` submits `period_start` and `period_end`, both
Gregorian `YYYY-MM-DD`. Custom field names are supported through
`startName` and `endName`. Backend validation should ensure the end
is not earlier than the start, and both dates meet your business rules.

The separate React Native and Flutter prototypes do **not** yet offer
equivalent native date-range selection.

## Install from source

Requires Node.js 20+, and Chrome when running the browser test suite.

~~~bash
git clone https://github.com/fidatech/afghan-datepicker.git
cd afghan-datepicker
npm install
npm run check
npm pack
~~~

For builds without a browser, use npm run build. A tagged GitHub Release may
contain the generated local-installable npm tarball. The source package is
currently a beta; verify npm registry publication before trying npm install
against the @fidatech scope.

## Plain HTML, PHP and Python websites

A build produces:

- dist/afghan-datepicker.global.js (self-contained, exposes window.AfghanDatepicker)
- src/datepicker.css

Copy the JavaScript and CSS to a publicly served assets directory:

~~~html
<link rel="stylesheet" href="/assets/datepicker.css">
<input id="date" name="date">
<script src="/assets/afghan-datepicker.global.js"></script>
<script>
  new window.AfghanDatepicker('#date', {
    locale: 'ps-AF', calendar: 'jalali', theme: 'light'
  });
</script>
~~~

The generated hidden HTML form field contains Gregorian YYYY-MM-DD.

### Laravel / Blade

Read [the runnable Laravel example](../examples/laravel) for a full Blade form
and route. Either copy public JS/CSS assets into Laravel public/vendor/ or
install the local package tarball and import it through Vite in
resources/js/app.ts. On the backend, validate ISO with date_format:Y-m-d and
save it to your database DATE column.

### Core PHP

[Run the sample](../examples/php) with:

~~~bash
npm run build
php -S 127.0.0.1:8000 -t .
~~~

Visit http://127.0.0.1:8000/examples/php/index.php.
PHP validates the submitted ISO date using DateTimeImmutable.

### Django and Python

[The Django example](../examples/django) includes a complete development
project, staticfiles integration, a date template, CSRF protection and a
view validating ISO using the Python datetime module.

Flask and FastAPI can use the same HTML script and backend logic:

~~~python
from datetime import date
parsed = date.fromisoformat(iso_string)
canonical = parsed.isoformat()  # YYYY-MM-DD
~~~

Django or Python does not need to calculate Jalali dates again after the
browser submits the already-converted ISO value.

## Vanilla TypeScript, React and Vue

The [TypeScript](../examples/typescript), [React](../examples/react) and
[Vue](../examples/vue) directories contain complete Vite projects, including
local package dependency references, example inputs and build scripts.

From the project root, run npm run build. Then:

~~~bash
cd examples/react
npm install
npm run dev
~~~

Replace react with vue or typescript as desired. Each example currently
installs the local source package using file:../.. instead of depending on an
npm package that is not yet published.

In React, initialize in useEffect and destroy on cleanup. In Vue 3, initialize
in onMounted and destroy in onBeforeUnmount. In both, the selected value is a
Gregorian ISO string or null. Next.js/Nuxt require client-side initialization
because the DOM is unavailable during SSR.

## Node.js and DOM-free calendar core

~~~typescript
import { toCalendar, fromCalendar, locales } from
  '@fidatech/afghan-datepicker/core';

toCalendar('2016-04-11');  // Jalali: 1395-01-23
fromCalendar({ year: 1395, month: 1, day: 23 }); // 2016-04-11
~~~

The core module has no DOM requirements and can be reused in mobile
JavaScript runtimes. Do not instantiate the browser AfghanDatepicker class
outside a real browser.

## React Native / Expo

React Native does not provide document, HTMLInputElement or browser CSS.
The [native sample](../examples/react-native) uses React Native Modal,
Pressable, View and Text plus the calendar-only JS package import. Build
and install the local tarball, copy the TSX component and use it in a mobile
screen as shown in its README.

This is **not yet a tested production React Native package**. Android,
iOS and accessibility/device testing remain required.

## Flutter / Dart

Dart cannot import this TypeScript package. The [Flutter sample](../examples/flutter)
uses native Flutter widgets and the established shamsi_date Dart package:

~~~bash
flutter create afghan_datepicker_demo
cd afghan_datepicker_demo
flutter pub add shamsi_date:^1.1.1
# Copy examples/flutter/lib sources into the new app lib directory
flutter run
~~~

The Flutter sample emits DateTime values; call its isoDate helper to store
Gregorian YYYY-MM-DD. It is a separate, experimental sample, **not** a
published pub.dev package.

## Scope and limitations

Supported date display is Solar Hijri/Jalali and Gregorian. Lunar Hijri,
date-range selection, native screen-reader verification and native platform
release packages are not included in this beta. Do not interpret planned
features as shipped. See the [main README](../README.md) for API options,
accessibility behavior and licensing.
