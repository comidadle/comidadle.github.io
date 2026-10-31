const { test } = require('node:test');
const assert = require('node:assert/strict');
const { I18n, normalizeLocale } = require('../i18n/runtime.js');
const { validateCatalog } = require('../i18n/validate.cjs');
const source = {
  locale: 'es', sourceRevision: 'revision-1', status: 'source',
  ui: { count: { one: '{n} intento', other: '{n} intentos' }, hello: 'Hola, {name}', how: 'Elige <strong>{name}</strong>' },
  dishes: { taco: { name: 'Tacos', desc: 'Descripción', hints: ['Pista uno', 'Pista dos'] } },
};
const english = {
  locale: 'en', sourceRevision: 'revision-1', status: 'reviewed', applicationCoverageReviewed: true,
  ui: { count: { one: '{n} attempt', other: '{n} attempts' }, hello: 'Hello, {name}', how: 'Choose <strong>{name}</strong>' },
  dishes: { taco: { name: 'Tacos', desc: 'Description', hints: ['First hint', 'Second hint'] } },
};
const clone = value => structuredClone(value);

test('se reconocen seis idiomas y las dos variantes de portugués', () => {
  assert.equal(normalizeLocale('pt_PT'), 'pt-PT');
  assert.equal(normalizeLocale('pt-br'), 'pt-BR');
  assert.equal(normalizeLocale('en-US'), 'en');
  assert.equal(normalizeLocale('xx'), 'es');
});
test('plurales y variables conservan el cero y escapan el contenido enriquecido', async () => {
  const i18n = new I18n(source, { fetchCatalog: async () => english });
  await i18n.setLocale('en');
  assert.equal(i18n.text('count', { n: 1 }), '1 attempt');
  assert.equal(i18n.text('count', { n: 6 }), '6 attempts');
  assert.equal(i18n.text('count', { n: 0 }), '0 attempts');
  assert.equal(i18n.text('hello', { name: 0 }), 'Hello, 0');
  assert.equal(i18n.richText('how', { name: '<img src=x onerror=alert(1)>' }), 'Choose <strong>&lt;img src=x onerror=alert(1)&gt;</strong>');
});
test('un idioma sin revisar queda bloqueado salvo en la vista de revisión', async () => {
  const draft = { ...english, status: 'draft' };
  await assert.rejects(new I18n(source, { fetchCatalog: async () => draft }).setLocale('en'), /no está revisado/);
  const preview = new I18n(source, { fetchCatalog: async () => draft, preview: true });
  assert.equal(await preview.setLocale('en'), true);
});
test('un catálogo antiguo no sustituye a los textos de la versión actual', async () => {
  const i18n = new I18n(source, { fetchCatalog: async () => ({ ...english, sourceRevision: 'old' }) });
  await assert.rejects(i18n.setLocale('en'), /esta versión/);
  assert.equal(i18n.locale, 'es');
});
test('cambiar rápido de idioma no permite que una descarga antigua gane', async () => {
  let resolve;
  const i18n = new I18n(source, { fetchCatalog: () => new Promise(done => { resolve = done; }) });
  const first = i18n.setLocale('en');
  await i18n.setLocale('es');
  resolve(english);
  assert.equal(await first, false);
  assert.equal(i18n.locale, 'es');
});
test('se conservan el país canónico y los datos originales del juego', async () => {
  const original = clone(source);
  const i18n = new I18n(source, { fetchCatalog: async () => english });
  await i18n.setLocale('en');
  assert.equal(i18n.country('España', '🇪🇸'), 'Spain');
  const display = i18n.dish('taco');
  display.hints.push('cambio');
  assert.deepEqual(source, original);
  assert.equal(i18n.dish('taco').hints.length, 2);
});
test('sin red y sin almacenamiento se conserva el idioma que ya funcionaba', async () => {
  const i18n = new I18n(source, { fetchCatalog: async () => { throw new Error('offline'); }, storage: { setItem() { throw new Error('blocked'); } } });
  assert.equal(await i18n.setLocale('es'), true);
  await assert.rejects(i18n.setLocale('en'), /offline/);
  assert.equal(i18n.text('hello', { name: 'Anas' }), 'Hola, Anas');
});
test('la comprobación de publicación rechaza pistas, variables y marcado alterados', () => {
  assert.deepEqual(validateCatalog(source, english), []);
  const broken = clone(english);
  broken.ui.hello = 'Hello, {other}';
  broken.ui.how = 'Choose <script>{name}</script>';
  broken.dishes.taco.hints.pop();
  const issues = validateCatalog(source, broken);
  assert.ok(issues.some(issue => issue.reason.includes('variables')));
  assert.ok(issues.some(issue => issue.reason.includes('marcado')));
  assert.ok(issues.some(issue => issue.reason.includes('pistas')));
});
test('una traducción vacía usa la fuente durante la revisión y bloquea la publicación', async () => {
  const draft = clone(english);
  draft.ui.hello = '';
  draft.dishes.taco.hints[0] = '';
  const i18n = new I18n(source, { preview: true, fetchCatalog: async () => draft });
  await i18n.setLocale('en');
  assert.equal(i18n.text('hello', { name: 'Anas' }), 'Hola, Anas');
  assert.equal(i18n.dish('taco').hints[0], 'Pista uno');
  assert.ok(validateCatalog(source, draft).some(issue => issue.reason.includes('vacía')));
});
test('los nombres de propiedades heredadas no se interpretan como mensajes',()=>{
  const i18n=new I18n(source);
  assert.equal(i18n.text('constructor'),'constructor');
  assert.equal(i18n.text('__proto__'),'__proto__');
});
test('los separadores locales de millares no convierten un plural en singular',async()=>{
  const german={...english,locale:'de',ui:{...english.ui,count:{one:'{n} Versuch',other:'{n} Versuche'}}};
  const i18n=new I18n(source,{fetchCatalog:async()=>german});
  await i18n.setLocale('de');
  assert.equal(i18n.text('count',{n:1000}),'1.000 Versuche');
  assert.equal(i18n.text('count',{n:1}),'1 Versuch');
});
