const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const weeklyCode = html.slice(html.indexOf('const WK='), html.indexOf('async function syncWeekly(){'));

function weeklyContext(initialDate, stored = {}) {
  let now = initialDate;
  const storage = new Map(Object.entries(stored));
  const context = vm.createContext({
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : [now])); }
    },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  vm.runInContext(weeklyCode, context);
  return { context, storage, setDate: value => { now = value; } };
}

test('la semana usa el lunes local, incluso junto a medianoche', () => {
  // La fecha del lunes no debe convertirse al domingo por usar UTC.
  const { context } = weeklyContext('2026-11-02T00:15:00');
  assert.equal(vm.runInContext('getWeekKey()', context), '2026-11-02');
  const sunday = weeklyContext('2026-11-01T12:00:00');
  assert.equal(vm.runInContext('getWeekKey()', sunday.context), '2026-10-26');
});

test('el cambio de semana archiva los puntos una sola vez y conserva los nuevos', () => {
  const { context, storage, setDate } = weeklyContext('2026-11-01T23:59:00', {
    comidadle_weekly: JSON.stringify({ week: '2026-10-26', points: 120 }),
  });
  setDate('2026-11-02T00:01:00');
  vm.runInContext('ensureCurrentWeek(); weekly.points+=10; saveWeekly(); ensureCurrentWeek();', context);
  assert.deepEqual(JSON.parse(storage.get('comidadle_lastweek')), { week: '2026-10-26', xp: 120 });
  assert.deepEqual(JSON.parse(storage.get('comidadle_weekly')), { week: '2026-11-02', points: 10 });
});

test('Auth actualiza el token REST y lo retira al cerrar sesión sin duplicar listeners', () => {
  let listener;
  let clients = 0;
  const context = vm.createContext({
    supabase: { createClient: () => {
      clients++;
      return { auth: { onAuthStateChange: callback => { listener = callback; } } };
    } },
  });
  const authCode = html.slice(html.indexOf('function _initSBClient(){'), html.indexOf('function clearLoginError()'));
  vm.runInContext('const SB="test",SK="public",SH={};let sbClient=null,_sbSession=null;' + authCode + '_initSBClient();_initSBClient();', context);
  listener('TOKEN_REFRESHED', { access_token: 'renewed' });
  assert.equal(vm.runInContext('SH.Authorization', context), 'Bearer renewed');
  listener('SIGNED_OUT', null);
  assert.equal(vm.runInContext('SH.Authorization', context), 'Bearer public');
  assert.equal(vm.runInContext('_sbSession', context), null);
  assert.equal(clients, 1);
});

test('el service worker guarda archivos que existen y puede servir el HTML sin red', async () => {
  const handlers = {};
  const saved = new Map();
  const cachedResponse = { ok: true, clone() { return this; } };
  const cache = {
    add: async url => {
      if (url.startsWith('https:')) return;
      assert.ok(fs.existsSync(path.join(root, url === './' ? 'index.html' : url)));
      saved.set(new URL(url, 'https://comidadle.test/').href, cachedResponse);
    },
    match: async request => saved.get(typeof request === 'string' ? request : request.url),
    put: async () => {},
  };
  const context = vm.createContext({
    URL, Response,
    fetch: async () => { throw new Error('sin red'); },
    caches: { open: async () => cache },
    self: {
      location: { origin: 'https://comidadle.test' },
      addEventListener: (name, fn) => { handlers[name] = fn; },
      skipWaiting() {},
    },
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), context);
  let install;
  handlers.install({ waitUntil: promise => { install = promise; } });
  await install;
  for (const url of ['https://comidadle.test/', 'https://comidadle.test/index.html']) {
    let response;
    handlers.fetch({ request: { method: 'GET', mode: 'navigate', url }, respondWith: promise => { response = promise; } });
    assert.equal(await response, cachedResponse);
  }
});
