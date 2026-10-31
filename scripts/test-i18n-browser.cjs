const { chromium } = require('@playwright/test');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const sourceCatalog = require('../locales/catalogs/es.json');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.json': 'application/json; charset=utf-8' };

(async () => {
  const server = http.createServer(async (request, response) => {
    try {
      const target = path.resolve(root, '.' + new URL(request.url, 'http://localhost').pathname);
      if (!target.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
      const content = await fs.readFile(target);
      response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'text/plain' });
      response.end(content);
    } catch (_) { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/i18n/review.html`);
    await page.waitForFunction(() => !document.getElementById('locale').disabled);
    for (const [locale, title] of [
      ['en', 'Where is this food from?'], ['fr', "D'où vient ce plat ?"],
      ['pt-BR', 'De onde é esta comida?'], ['pt-PT', 'De onde é esta comida?'],
      ['de', 'Woher kommt dieses Essen?'], ['es', '¿De dónde es esta comida?'],
    ]) {
      await page.locator('#search').fill('');
      await page.locator('#locale').selectOption(locale);
      await page.waitForFunction(() => document.getElementById('status').textContent !== 'Cargando idioma…');
      await page.waitForFunction(expected => [...document.querySelectorAll('#rows td')].some(td => td.textContent === expected), title);
      if (locale !== 'es') {
        const status = await page.locator('#status').innerText();
        assert.ok(status.includes(`${Object.keys(sourceCatalog.ui).length}/${Object.keys(sourceCatalog.ui).length} textos`));
        assert.ok(status.includes(`${Object.keys(sourceCatalog.dishes).length}/${Object.keys(sourceCatalog.dishes).length} platos`));
        assert.ok(status.includes('Catálogo completo.'));
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      console.log(`${locale}: vista móvil comprobada, título correcto y estado visible.`);
    }
    await page.locator('#search').fill('regular:0.hints.0');
    assert.equal(await page.locator('#rows tr').count(), 1);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
