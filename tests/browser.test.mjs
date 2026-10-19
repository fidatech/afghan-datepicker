import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, access } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { chromium } from 'playwright-core';

const root = process.cwd();
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.map':'application/json'};
async function startServer() {
  const server = createServer(async (req, res) => {
    try {
      let path = new URL(req.url ?? '/', 'http://127.0.0.1').pathname;
      if (path === '/favicon.ico') { res.writeHead(204).end(); return; }
      if (path.endsWith('/')) path += 'index.html';
      const file = resolve(join(root, decodeURIComponent(path)));
      if (!file.startsWith(root + sep) && file !== root) {
        res.writeHead(403).end();
        return;
      }
      const bytes = await readFile(file);
      res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
      res.end(bytes);
    } catch (err) { res.writeHead(404).end(String(err)); }
  });
  await new Promise((ok) => server.listen(0,'127.0.0.1',ok));
  return {server, url: 'http://127.0.0.1:' + server.address().port + '/demo/'};
}

/**
 * Use an existing system Chrome/Chromium installation instead of requiring a
 * Playwright-managed browser. CI and developers can override with CHROME_BIN.
 */
async function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    ...(process.platform === 'darwin' ? [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      ...(process.env.HOME ? [
        join(process.env.HOME, 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
      ] : [])
    ] : []),
    ...(process.platform === 'win32' ? [
      ...(process.env.PROGRAMFILES ? [
        join(process.env.PROGRAMFILES, 'Google/Chrome/Application/chrome.exe')
      ] : []),
      ...(process.env['PROGRAMFILES(X86)'] ? [
        join(process.env['PROGRAMFILES(X86)'], 'Google/Chrome/Application/chrome.exe')
      ] : []),
      ...(process.env.LOCALAPPDATA ? [
        join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe')
      ] : [])
    ] : []),
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Check the next known installation location.
    }
  }
  throw new Error(
    'Chrome/Chromium was not found. Install Google Chrome or set CHROME_BIN to ' +
    'the full executable path, then rerun npm run check.'
  );
}

test('date inputs open functioning calendar popups in Chromium', {timeout:45000}, async () => {
  const {server,url} = await startServer();
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: await findChrome(),
      headless: true,
      args: process.platform === 'linux' ? ['--no-sandbox', '--disable-dev-shm-usage'] : []
    });
    const page = await browser.newPage({viewport:{width:1440,height:900}});
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.stack ?? e.message));
    page.on('console',(msg) => {if(msg.type() === 'error') errors.push(msg.text());});
    const response = await page.goto(url);
    assert.equal(response?.status(), 200, 'Demo HTTP status');
    await page.locator('#ps').waitFor({timeout:5000});
    // Regression: a conflicting author stylesheet can apply display:none after
    // our CSS. The explicitly open popup must still render in that situation.
    await page.addStyleTag({content: '.adp-popup { display: none !important; }'});
    for (const id of ['ps','dari','fa','en']) {
      await page.locator('#' + id).click();
      const host = page.locator('#' + id).locator('xpath=..');
      const popup = host.locator('.adp-popup');
      const state = await popup.evaluate((p) => ({
        hidden:p.hidden,display:getComputedStyle(p).display,
        text:p.textContent?.slice(0,100),height:p.getBoundingClientRect().height
      }));
      assert.equal(state.hidden,false, id + ' hidden: ' + JSON.stringify(state)+' / errors: '+ errors.join('\n'));
      assert.notEqual(state.display,'none',id+' not displayed: '+JSON.stringify(state));
      assert.ok(state.height > 100,id+' popup has no height: '+JSON.stringify(state));
      assert.ok(await popup.locator('button.adp-day:not([disabled])').count() >= 28,id+' missing date buttons');
      await page.keyboard.press('Escape');
      assert.equal(await popup.evaluate((p) => getComputedStyle(p).display), 'none',
        id + ' popup is hidden again after Escape');
    }
    await page.locator('#ps').focus();
    const psPopup = page.locator('#ps').locator('xpath=..').locator('.adp-popup');
    assert.equal(await psPopup.evaluate((p) => p.hidden), false, 'Keyboard focus opens the popup');
    const firstDay = psPopup.locator('button.adp-day:not([disabled])').first();
    const chosenISO = await firstDay.getAttribute('data-iso');
    await firstDay.click();
    assert.equal(await psPopup.evaluate((p) => p.hidden), true, 'Selection closes the popup');
    assert.equal(await page.locator('#ps').getAttribute('data-iso'), chosenISO);
    assert.equal(await page.locator('input[type="hidden"][name="ps_date"]').inputValue(), chosenISO);
    assert.deepEqual(errors,[],'No browser JS errors');
  } finally {
    try {
      await browser?.close();
    } finally {
      // Always close the HTTP server, including on missing Chrome or launch errors.
      await new Promise((resolveClose, rejectClose) => server.close((error) =>
        error ? rejectClose(error) : resolveClose()
      ));
    }
  }
});
