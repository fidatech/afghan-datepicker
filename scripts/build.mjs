import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';

const shared = { bundle: true, target: 'es2022', sourcemap: true, legalComments: 'eof' };

await Promise.all([
  build({
    ...shared, entryPoints: ['src/index.ts'], platform: 'browser',
    format: 'esm', outfile: 'dist/index.js'
  }),
  build({
    ...shared, entryPoints: ['src/index.ts'], platform: 'node',
    format: 'cjs', target: 'node20', outfile: 'dist/index.cjs'
  }),
  build({
    ...shared, entryPoints: ['src/core.ts'], platform: 'neutral',
    format: 'esm', outfile: 'dist/core.js'
  }),
  build({
    ...shared, entryPoints: ['src/core.ts'], platform: 'node',
    format: 'cjs', target: 'node20', outfile: 'dist/core.cjs'
  }),
  build({
    ...shared, entryPoints: ['src/browser.ts'], platform: 'browser',
    format: 'iife', outfile: 'dist/afghan-datepicker.global.js'
  })
]);

execFileSync(
  process.platform === 'win32' ? 'node_modules/.bin/tsc.cmd' : './node_modules/.bin/tsc',
  ['-p', 'tsconfig.build.json'],
  { stdio: 'inherit' }
);
console.log('ESM, CJS, calendar-only modules, browser script and types are ready.');
