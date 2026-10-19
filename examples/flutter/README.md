# Flutter / Dart — native prototype

Flutter cannot display the DOM-based TypeScript datepicker. This example uses
Flutter widgets and the existing shamsi_date package for calendar conversion.

## Install and run

1. Run `flutter create afghan_datepicker_demo` then open that folder.
2. Run `flutter pub add shamsi_date:^1.1.1`.
3. Copy `examples/flutter/lib/main.dart` and
   `examples/flutter/lib/afghan_datepicker.dart` into the app's `lib/` folder.
4. Run `flutter run`.

The field passes a DateTime to onChanged; call isoDate(value) to format it as
Gregorian YYYY-MM-DD. The demo supports Pashto, Dari, Persian and English
month/day labels, a month selector and a year selector.

This is an **experimental native sample**, not an official pub.dev package.
It requires Dart analyzer and real-device testing before production use.
Its date arithmetic comes from the separate shamsi_date package:
https://pub.dev/packages/shamsi_date
