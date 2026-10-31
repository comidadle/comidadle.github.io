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
  const blocking=process.argv.includes('--preview')?issues.filter(issue=>!['status','applicationCoverageReviewed'].includes(issue.path)):issues;
  console.log(`${locale}: ${blocking.length ? (process.argv.includes('--preview')?'INCOMPLETO':'NO PUBLICABLE') : (process.argv.includes('--preview')?'CATÁLOGO COMPLETO (BORRADOR)':'REVISADO')} — ${blocking.length} comprobaciones pendientes`);
  if (process.argv.includes('--details')) console.log(JSON.stringify(issues, null, 2));
  if (blocking.length) failed = true;
}
process.exitCode = failed ? 1 : 0;
