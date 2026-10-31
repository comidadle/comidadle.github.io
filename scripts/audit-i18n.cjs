// Auditoría local: no ejecuta el juego ni consulta servicios externos.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function evaluateBetween(start, end, expression) {
  const from = html.indexOf(start);
  const to = html.indexOf(end, from);
  assert.ok(from >= 0 && to > from, `No se encuentra el bloque ${start}`);
  return vm.runInNewContext(html.slice(from, to) + '\n' + expression, {}, { timeout: 2000 });
}

const regular = evaluateBetween('const ALL_DISHES=', 'const DEMONYMS=', 'ALL_DISHES');
const sunday = evaluateBetween('const SUNDAY_INTERNATIONAL_DISHES=', 'const SUNDAY_SPECIAL_NAMES=', 'SUNDAY_INTERNATIONAL_DISHES');
const translations = evaluateBetween('const T={', 'function t(key,', 'T');
const esKeys = Object.keys(translations.es);
const dishes = [...regular, ...sunday];
const descriptions = dishes.filter(d => d.desc).length;
const hints = dishes.reduce((n, d) => n + (d.hints?.length || 0), 0);
const report = {
  requestedLocales: ['es', 'en', 'fr', 'pt-BR', 'pt-PT', 'de'],
  regularDishes: regular.length,
  sundayDishes: sunday.length,
  descriptions,
  hints,
  existingUiKeys: esKeys.length,
  existingLocales: Object.fromEntries(Object.entries(translations).map(([locale, values]) => [locale, {
    translatedKeys: Object.keys(values).length,
    missingKeys: esKeys.filter(key => !(key in values)),
  }])),
  explicitlyMarkedHtmlElements: (html.match(/data-i18n=/g) || []).length,
  status: 'Auditoría inicial. El diccionario actual no cubre toda la aplicación.',
};

// El catálogo español es la fuente: no se cambian los nombres que usa la lógica.
const catalog = {
  locale: 'es',
  ui: translations.es,
  dishes: {
    regular: regular.map(({ name, country, desc, hints }, index) => ({ index, name, country, desc, hints })),
    sunday: sunday.map(({ name, country, desc, hints }, index) => ({ index, name, country, desc, hints })),
  },
};

if (process.argv.includes('--write')) {
  const output = path.join(root, 'locales', 'source');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'es.json'), JSON.stringify(catalog, null, 2) + '\n');
  fs.writeFileSync(path.join(output, 'audit.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify(report, null, 2));
