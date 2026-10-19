# Core PHP example (no PHP framework)

From the repository root:

~~~bash
npm install
npm run build
php -S 127.0.0.1:8000 -t .
~~~

Visit http://127.0.0.1:8000/examples/php/index.php

The standalone browser bundle defines window.AfghanDatepicker.
The form posts a Gregorian ISO date, which PHP checks with DateTimeImmutable.
For production, copy the built JS and CSS to your public assets directory
and update their URLs. Never serve the entire source repository publicly.
