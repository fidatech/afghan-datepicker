import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

test('the DOM-free core entry point works in ESM and CommonJS', async () => {
  const esm = await import(pathToFileURL(process.cwd() + '/dist/core.js').href);
  const cjs = require('../dist/core.cjs');
  for (const core of [esm, cjs]) {
    assert.deepEqual(core.toCalendar('2016-04-11'),
      { year: 1395, month: 1, day: 23 });
    assert.equal(core.fromCalendar({year:1395,month:1,day:23}), '2016-04-11');
    assert.equal(typeof core.locales['ps-AF'].weekdays[0], 'string');
  }
});

test('a standalone browser bundle, stylesheet and typed core are built', async () => {
  for (const path of [
    'dist/index.js','dist/index.cjs','dist/index.d.ts','dist/core.js',
    'dist/core.cjs','dist/core.d.ts','dist/afghan-datepicker.global.js',
    'src/datepicker.css'
  ]) {
    const metadata = await stat(path);
    assert.ok(metadata.size > 100, path + ' must have contents');
  }
  const bundle = await readFile('dist/afghan-datepicker.global.js', 'utf8');
  assert.ok(bundle.includes('AfghanDatepicker'));
  assert.ok(bundle.includes('AfghanCalendar'));
});
