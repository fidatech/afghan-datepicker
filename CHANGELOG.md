# Changelog

## 0.3.0-beta.1 — Date range, style variants and transparent credits

- Added inclusive date-range selection for both Jalali and Gregorian calendars
  in Pashto, Dari, Persian and English.
- Added `selectionMode: 'range'`, `getRange()`, `setRange()`,
  `onRangeChange`, initial `range`, and start/end hidden form fields.
- Added three styles: classic, soft and minimal.
- Added a range playground and styling selector to the documentation.
- Added optional, visible Fida attribution with nofollow. Defaults to off;
  no hidden links or tracking are introduced.
- Extended Chromium regression coverage for locales, calendars, range endpoints,
  submitted ISO values, invalid bounds and styling.


## 0.2.0-beta.1 — Cross-platform integration preview

- Added standalone browser script bundle for script-tag, core PHP and Django.
- Added DOM-free JavaScript/TypeScript calendar entry point for Node.js and React Native.
- Added runnable local-package Vite examples for TypeScript, React and Vue.
- Added core PHP, Laravel Blade and Django template/backend demonstration projects.
- Added separate experimental native React Native and Flutter prototype components.
- Added full cross-platform documentation and revised web demo instructions.
- Added package build tests, web-framework CI and backend example checks.
- Added GitHub Pages workflow, public GitHub beta release automation and
  a manually triggered npm publishing workflow (requires npm permissions).

**Verification boundary:** these beta examples do not constitute certified
support for native iOS/Android, pub.dev publishing or every server framework.
Native UI code requires separate platform testing.

## 0.1.0 — Initial implementation

- TypeScript datepicker with Pashto, Dari, Persian and English locales.
- Jalali/Gregorian views using jalaali-js.
- Gregorian ISO output through hidden HTML input.
- Keyboard navigation, inclusive min/max and browser demo.
