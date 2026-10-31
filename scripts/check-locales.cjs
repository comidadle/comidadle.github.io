const fs = require('node:fs');
const path = require('node:path');
const { validateCatalog } = require('../i18n/validate.cjs');
const directory = path.join(__dirname, '..', 'locales/catalogs');
const source = JSON.parse(fs.readFileSync(path.join(directory, 'es.json'), 'utf8'));
let failed = false;
for (const locale of ['en', 'fr', 'pt-BR', 'pt-PT', 'de']) {
  const catalog = JSON.parse(fs.readFileSync(path.join(directory, locale + '.json'), 'utf8'));
  const issues = validateCatalog(source, catalog);
  if(catalog.locale !== locale) issues.push({ path: 'locale', reason: 'idioma incorrecto para este archivo' });
  console.log(`${locale}: ${issues.length ? 'NO PUBLICABLE' : 'REVISADO'} — ${issues.length} comprobaciones pendientes`);
  if (process.argv.includes('--details')) console.log(JSON.stringify(issues, null, 2));
  if (issues.length) failed = true;
}
process.exitCode = failed ? 1 : 0;
