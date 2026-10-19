import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';

await build({
  entryPoints: ['src/index.ts'], bundle: true, platform: 'browser',
  format: 'esm', target: 'es2022', outfile: 'dist/index.js',
  sourcemap: true, legalComments: 'eof'
});
await build({
  entryPoints: ['src/index.ts'], bundle: true, platform: 'node',
  format: 'cjs', target: 'node20', outfile: 'dist/index.cjs',
  sourcemap: true, legalComments: 'eof'
});
execFileSync(
  process.platform === 'win32' ? 'node_modules/.bin/tsc.cmd' : './node_modules/.bin/tsc',
  ['-p','tsconfig.build.json'], {stdio:'inherit'}
);
console.log('Built ESM, CJS and TypeScript declarations.');
