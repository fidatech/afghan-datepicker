# Django 5.2 example

The datepicker runs in the browser. Django receives and validates the ISO
Gregorian date; Python never needs to implement UI or Solar Hijri conversions.

From the repository root:

~~~bash
npm install
npm run build
mkdir -p examples/django/static/vendor
cp dist/afghan-datepicker.global.js examples/django/static/vendor/
cp src/datepicker.css examples/django/static/vendor/

python3 -m venv .venv
source .venv/bin/activate
pip install -r examples/django/requirements.txt
cd examples/django
python manage.py runserver
~~~

Open http://127.0.0.1:8000/

This is a self-contained *development-only* example with a hardcoded test
SECRET_KEY and DEBUG=True. Do not deploy these settings to production. In
a real Django app, bundle the JS/CSS into STATIC_ROOT via collectstatic and
follow Django's deployment checklist.
