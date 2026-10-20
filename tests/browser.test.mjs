import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, access } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { chromium } from 'playwright-core';

const root = process.cwd();
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.map':'application/json','.webp':'image/webp'};
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
    // Documentation navigation highlights the current tab in Fida navy/orange.
    const installTab = page.locator('.sidebar a[href="#installation"]');
    await installTab.click();
    await page.waitForTimeout(250);
    const clickedTabState = await page.evaluate(() => ({
      hash: location.hash,
      y: window.scrollY,
      installationTop: document.getElementById('installation').getBoundingClientRect().top,
      active: Array.from(document.querySelectorAll('.sidebar a[aria-current]'))
        .map((a) => a.getAttribute('href')),
      clicked: document.querySelector('.sidebar a[href="#installation"]')?.getAttribute('aria-current')
    }));
    assert.equal(clickedTabState.clicked, 'location',
      'Sidebar clicked state: ' + JSON.stringify(clickedTabState) + ' / JS errors: ' + errors.join(' | '));
    assert.equal(await page.locator('.sidebar a[aria-current="location"]').count(), 1);
    assert.equal(await installTab.evaluate((node) => getComputedStyle(node).backgroundColor), 'rgb(13, 30, 42)');
    await page.evaluate(() => {
      document.getElementById('options')?.scrollIntoView({block:'start', behavior:'instant'});
    });
    await page.waitForFunction(() =>
      document.querySelector('.sidebar a[href="#options"]')
        ?.getAttribute('aria-current') === 'location'
    );
    await page.locator('.sidebar a[href="#playground"]').click();
    await page.waitForFunction(() =>
      document.querySelector('.sidebar a[href="#playground"]')
        ?.getAttribute('aria-current') === 'location'
    );

    // The documentation and supplied Fida artwork should load without errors.
    const mark = page.locator('.brand-mark');
    await mark.evaluate((img) => img.decode());
    assert.ok(await mark.evaluate((img) => img.naturalWidth > 0),
      'Fida logo is served as a real image');
    assert.equal(await page.locator('main .doc-section').count(), 16,
      'Developer documentation contains the complete set of sections');
    assert.equal(await page.locator('a[href="#installation"]').count() > 0, true);
    assert.equal(await page.locator('#platforms .feature').count(), 8);
    const globalReady = await page.evaluate(async () => {
      const response = await fetch('/dist/afghan-datepicker.global.js');
      const code = await response.text();
      if (!response.ok) return false;
      (0, eval)(code);
      return typeof window.AfghanDatepicker === 'function' &&
        typeof window.AfghanCalendar?.toCalendar === 'function';
    });
    assert.ok(globalReady, 'Standalone browser bundle exports the documented API');

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
      const size = await popup.boundingBox();
      assert.ok(size && size.width <= 410, id+' popup should stay compact: '+JSON.stringify(size));

      assert.ok(await popup.locator('button.adp-day:not([disabled])').count() >= 28,id+' missing date buttons');
      const fullWeekdays = {
        ps: ['خالي','یونۍ','دونۍ','درېنۍ','څلورنۍ','پنځنۍ','جمعه'],
        dari: ['شنبه','یکشنبه','دوشنبه','سه شنبه','چهارشنبه','پنج شنبه','جمعه'],
        fa: ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'],
        en: ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday']
      };
      assert.deepEqual(await popup.locator('.adp-weekday').allTextContents(), fullWeekdays[id],
        id+' uses complete weekday names');
      await page.keyboard.press('Escape');
      assert.equal(await popup.evaluate((p) => getComputedStyle(p).display), 'none',
        id + ' popup is hidden again after Escape');
    }
    await page.locator('#ps').focus();
    const psPopup = page.locator('#ps').locator('xpath=..').locator('.adp-popup');
    assert.equal(await psPopup.evaluate((p) => p.hidden), false, 'Keyboard focus opens the popup');

    // Full names stay visible, including long words. No abbreviations.
    assert.deepEqual(await psPopup.locator('.adp-weekday').allTextContents(), [
      'خالي', 'یونۍ', 'دونۍ', 'درېنۍ', 'څلورنۍ', 'پنځنۍ', 'جمعه'
    ]);
    const navIcons = psPopup.locator('.adp-nav svg path');
    assert.equal(await navIcons.first().getAttribute('d'), 'm15 18-6-6 6-6');
    assert.equal(await navIcons.last().getAttribute('d'), 'm9 18 6-6-6-6');

    // Month header must open a complete, selectable 12-month grid.
    await psPopup.locator('.adp-month-trigger').click();
    assert.equal(await psPopup.locator('.adp-month-option').count(), 12);
    assert.equal(await psPopup.locator('.adp-day').count(), 0, 'Month panel replaces date grid');
    await psPopup.locator('.adp-month-option:not(:disabled)').nth(3).click();
    assert.equal(await psPopup.locator('.adp-weekday').count(), 7, 'Selecting month returns to dates');

    // Clicking the year opens 12 years; selecting one then chooses a month.
    await psPopup.locator('.adp-year-trigger').click();
    assert.equal(await psPopup.locator('.adp-year-option').count(), 12);
    await psPopup.locator('.adp-year-option:not(:disabled)').first().click();
    assert.equal(await psPopup.locator('.adp-month-option').count(), 12);
    await psPopup.locator('.adp-month-option:not(:disabled)').first().click();
    assert.ok(await psPopup.locator('.adp-day').count() >= 28);

    // On small screens the popup must remain inside the visible viewport.
    await page.setViewportSize({width: 375, height: 780});
    await page.waitForFunction(() => {
      const popup = document.querySelector('#ps')?.parentElement?.querySelector('.adp-popup');
      if (!popup) return false;
      const box = popup.getBoundingClientRect();
      return box.left >= 0 && box.right <= document.documentElement.clientWidth;
    });
    const bounds = await psPopup.boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 375,
      'Mobile popup fits viewport: ' + JSON.stringify(bounds));

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


test('range inputs work in all locales, presets and both calendars', {timeout:70000}, async () => {
  const {server,url} = await startServer();
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: await findChrome(),
      headless:true,
      args:process.platform === 'linux' ? ['--no-sandbox','--disable-dev-shm-usage'] : []
    });
    const page = await browser.newPage({viewport:{width:1365,height:950}});
    const errors = [];
    page.on('pageerror',(e) => errors.push(e.message));
    const response = await page.goto(url);
    assert.equal(response?.status(),200);
    await page.locator('#ps-range').waitFor();

    const styleSelector = page.locator('#picker-design');
    assert.deepEqual(await styleSelector.locator('option').evaluateAll(
      (els) => els.map((e) => e.value)), ['classic','soft','minimal']);
    await styleSelector.selectOption('soft');
    assert.equal(await page.locator('#ps-range').locator('xpath=..').getAttribute('data-variant'),'soft');
    assert.equal(await page.locator('#ps-range').locator('xpath=..').evaluate(
      (host) => getComputedStyle(host).getPropertyValue('--adp-accent').trim()), '#f77700');
    await styleSelector.selectOption('minimal');
    assert.equal(await page.locator('#en').locator('xpath=..').getAttribute('data-variant'),'minimal');
    await styleSelector.selectOption('classic');

    for (const [id, name] of [
      ['ps-range','ps_period'],
      ['dari-range','dari_period'],
      ['fa-range','fa_period'],
      ['en-range','en_period']
    ]) {
      const field = page.locator('#' + id);
      await field.click();
      const popup = field.locator('xpath=..').locator('.adp-popup');
      assert.equal(await popup.locator('.adp-weekday').count(),7);
      const available = popup.locator('.adp-day:not([disabled])');
      assert.ok(await available.count() >= 28);
      const start = await available.nth(5).getAttribute('data-iso');
      await available.nth(5).click();
      assert.equal(await popup.evaluate((el) => el.hidden),false,
        id + ': first selection must keep popup open');
      assert.equal(await field.locator('xpath=..').locator('input[type="hidden"][name="' + name + '_start"]').inputValue(),start);
      assert.equal(await field.locator('xpath=..').locator('input[type="hidden"][name="' + name + '_end"]').inputValue(),'');
      const end = await popup.locator('.adp-day:not([disabled])').nth(12).getAttribute('data-iso');
      await popup.locator('.adp-day:not([disabled])').nth(12).click();
      assert.equal(await popup.evaluate((el) => el.hidden),true,
        id + ': second selection must close popup');
      assert.ok(start <= end);
      assert.equal(await field.locator('xpath=..').locator('input[type="hidden"][name="' + name + '_end"]').inputValue(),end);
      assert.ok((await page.locator('#' + id + '-out').textContent()).includes(end));
      await field.click();
      assert.equal(await popup.locator('.adp-range-start').count(),1);
      assert.equal(await popup.locator('.adp-range-end').count(),1);
      assert.ok(await popup.locator('.adp-in-range').count() > 0);
      await page.keyboard.press('Escape');
    }
    assert.equal(await page.locator('a.adp-credit').count(),1);
    const credit=page.locator('#ps-range').locator('xpath=..').locator('a.adp-credit');
    assert.equal(await credit.getAttribute('href'),'https://fida.af/');
    assert.match(await credit.getAttribute('rel') ?? '',/nofollow/);
    assert.ok(await credit.isVisible());

    // The same core range API works for a Gregorian UI in Pashto and for
    // a Jalali UI in English; there is no locale/calendar coupling.
    await page.addScriptTag({url:'/dist/afghan-datepicker.global.js'});
    const result=await page.evaluate(() => {
      const wrap=document.createElement('div');
      wrap.style.cssText='max-width:420px;padding:20px';
      const input=document.createElement('input');
      input.name='trip';
      wrap.append(input);
      document.body.append(wrap);
      const C=window.AfghanDatepicker;
      const picker=new C(input,{
        selectionMode:'range',calendar:'gregorian',locale:'ps-AF',
        min:'2024-01-01',max:'2026-12-31',
        startName:'departure',endName:'return_date',
        variant:'soft'
      });
      picker.setRange({start:'2024-12-30',end:'2025-01-03'});
      const saved=picker.getRange();
      const formFields=Array.from(wrap.querySelectorAll('input[type=hidden]')).map(
        (i)=>[i.name,i.value]);
      let invalidBounds=false,invalidOrder=false;
      try{picker.setRange({start:'2023-12-31',end:'2024-01-01'});}catch(e){invalidBounds=e instanceof RangeError;}
      try{picker.setRange({start:'2025-01-03',end:'2024-12-30'});}catch(e){invalidOrder=e instanceof RangeError;}
      picker.open();
      const ui={
        weekdays:wrap.querySelectorAll('.adp-weekday').length,
        startCell:!!wrap.querySelector('.adp-range-start'),
        inRange:wrap.querySelectorAll('.adp-in-range').length
      };
      picker.setRange(null);
      const cleared=picker.getRange();
      picker.destroy();
      const restored=input.name==='trip' && input.readOnly===false && !wrap.querySelector('.adp-host');
      wrap.remove();
      const second=document.createElement('input');
      second.name='other';
      document.body.append(second);
      const other=new C(second,{selectionMode:'range',calendar:'jalali',locale:'en',variant:'minimal'});
      other.setRange({start:'2024-03-19',end:'2024-04-02'});
      const englishJalali=other.getRange();
      other.destroy();
      second.remove();
      return {saved,formFields,invalidBounds,invalidOrder,ui,cleared,restored,englishJalali};
    });
    assert.deepEqual(result.saved,{start:'2024-12-30',end:'2025-01-03'});
    assert.deepEqual(result.formFields,[['departure','2024-12-30'],['return_date','2025-01-03']]);
    assert.ok(result.invalidBounds);
    assert.ok(result.invalidOrder);
    assert.equal(result.ui.weekdays,7);
    assert.ok(result.ui.startCell);
    assert.ok(result.ui.inRange > 0);
    assert.deepEqual(result.cleared,{start:null,end:null});
    assert.ok(result.restored);
    assert.deepEqual(result.englishJalali,{start:'2024-03-19',end:'2024-04-02'});
    assert.deepEqual(errors,[]);
  } finally {
    try {
      await browser?.close();
    } finally {
      await new Promise((resolveClose,rejectClose) =>
        server.close((err) => err ? rejectClose(err) : resolveClose()));
    }
  }
});
