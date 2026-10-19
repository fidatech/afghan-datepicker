import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { chromium } from 'playwright-core';

const root = process.cwd();
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.map':'application/json'};
async function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url ?? '/', 'http://127.0.0.1').pathname;
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

test('date inputs open functioning calendar popups in Chromium', {timeout:45000}, async () => {
  const {server,url} = await startServer();
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  try {
    const page = await browser.newPage({viewport:{width:1440,height:900}});
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.stack ?? e.message));
    page.on('console',(msg) => {if(msg.type() === 'error') errors.push(msg.text());});
    await page.goto(url);
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
    }
    assert.deepEqual(errors,[],'No browser JS errors');
  } finally {
    await browser.close();
    await new Promise((ok) => server.close(ok));
  }
});
