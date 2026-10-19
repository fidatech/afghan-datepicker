# Laravel example

The library is a client-side JavaScript datepicker, not a Laravel PHP package.

1. Build the source repo: npm install && npm run build.
2. Copy dist/afghan-datepicker.global.js into your Laravel app at
   public/vendor/afghan-datepicker/afghan-datepicker.global.js.
3. Copy src/datepicker.css into your Laravel app at
   public/vendor/afghan-datepicker/datepicker.css.
4. Copy resources/views/datepicker.blade.php into your Laravel app's
   resources/views/datepicker.blade.php.
5. Copy routes/web.php routes into your existing routes/web.php
   (do not overwrite your other routes).
6. Run php artisan serve and open /afghan-datepicker.

The hidden field submits a Gregorian ISO date validated using date_format:Y-m-d.
The example relies on your Laravel app having normal session/CSRF middleware.
You may alternatively install the npm tarball and import the datepicker from
resources/js/app.ts through Vite (see the documentation website).
