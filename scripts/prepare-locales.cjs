const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const seed = require('../i18n/seed-ui.cjs');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const old = vm.runInNewContext(html.slice(html.indexOf('const T={'), html.indexOf('function t(key,')) + '\nT', {}, { timeout: 1000 });
const source = JSON.parse(fs.readFileSync(path.join(root, 'locales/source/es.json'), 'utf8'));
const inventory = JSON.parse(fs.readFileSync(path.join(root, 'locales/source/messages.json'), 'utf8'));
const dishes = {};
for (const [pool, values] of Object.entries(source.dishes)) {
  for (const dish of values) dishes[`${pool}:${dish.index}`] = { name: dish.name, desc: dish.desc, hints: dish.hints };
}
const messages = Object.fromEntries(Object.entries(inventory.messages).map(([id, message]) => [id, message.source]));
const ui = { ...source.ui, ...messages };
const plurals = {
  es: ['Adivina el país de origen — {n} intento', 'Adivina el país de origen — {n} intentos', 'Acertaste en {n} intento', 'Acertaste en {n} intentos'],
  en: ['Guess the country of origin — {n} attempt', 'Guess the country of origin — {n} attempts', 'You got it in {n} attempt', 'You got it in {n} attempts'],
  fr: ["Devinez le pays d’origine — {n} tentative", "Devinez le pays d’origine — {n} tentatives", 'Trouvé en {n} tentative', 'Trouvé en {n} tentatives'],
  de: ['Errate das Herkunftsland — {n} Versuch', 'Errate das Herkunftsland — {n} Versuche', 'In {n} Versuch erraten', 'In {n} Versuchen erraten'],
  'pt-BR': ['Adivinhe o país de origem — {n} tentativa', 'Adivinhe o país de origem — {n} tentativas', 'Você acertou em {n} tentativa', 'Você acertou em {n} tentativas'],
  'pt-PT': ['Adivinha o país de origem — {n} tentativa', 'Adivinha o país de origem — {n} tentativas', 'Acertaste em {n} tentativa', 'Acertaste em {n} tentativas'],
};
function seedPlurals(values, locale) {
  const [one, other, wonOne, wonOther] = plurals[locale];
  values.attempts_label = values.subtitle_attempts = { one, other };
  values.result_won = { one: wonOne, other: wonOther };
}
seedPlurals(ui, 'es');
const sourceRevision = crypto.createHash('sha256').update(JSON.stringify({ ui, dishes, canonical: source.dishes })).digest('hex');
const catalog = { locale: 'es', sourceRevision, status: 'source', applicationCoverageReviewed: false, ui, dishes };
fs.mkdirSync(path.join(root, 'locales/catalogs'), { recursive: true });
fs.writeFileSync(path.join(root, 'locales/catalogs/es.json'), JSON.stringify(catalog, null, 2) + '\n');
// No sobrescribir traducciones ya preparadas al regenerar la fuente.
for (const locale of ['en', 'fr', 'pt-BR', 'pt-PT', 'de']) {
  const file = path.join(root, 'locales/catalogs', locale + '.json');
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  const initial = { locale, sourceRevision, status: 'draft', applicationCoverageReviewed: false, ui: old[locale] || {}, dishes: {} };
  const draft = existing || initial;
  draft.ui = { ...(seed[locale] || {}), ...draft.ui };
  // Solo convertir el formato heredado; no sustituir una revisión posterior.
  if (typeof draft.ui.attempts_label === 'string') seedPlurals(draft.ui, locale);
  fs.writeFileSync(file, JSON.stringify(draft, null, 2) + '\n');
}
console.log(`Fuente preparada: ${Object.keys(ui).length} claves y ${Object.keys(dishes).length} platos. Los idiomas nuevos permanecen como borradores.`);
