const placeholders = text => [...String(text).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join('|');
const tags = text => [...String(text).matchAll(/<\/?[^>]+>/g)].map(m => m[0]).sort().join('|');
const variants = value => typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value) : [];

function validateCatalog(source, catalog) {
  const issues = [];
  const add = (path, reason) => issues.push({ path, reason });
  if (catalog.sourceRevision !== source.sourceRevision) add('sourceRevision', 'fuente desactualizada');
  if (catalog.status !== 'reviewed') add('status', 'traducciones sin revisar');
  if (catalog.applicationCoverageReviewed !== true) add('applicationCoverageReviewed', 'faltan pantallas por conectar y revisar');
  function check(original, translated, key) {
    const sources = variants(original);
    const values = variants(translated);
    if (!values.length || values.some(value => typeof value !== 'string' || !value.trim())) { add(key, 'traducción vacía o ausente'); return; }
    if (typeof original !== typeof translated || (typeof original === 'object' && Object.keys(original).some(form => !Object.hasOwn(translated, form)))) add(key, 'faltan formas de plural');
    for (const value of values) {
      if (placeholders(value) !== placeholders(sources[0])) add(key, 'variables distintas del original');
      if (tags(value) !== tags(sources[0])) add(key, 'marcado distinto del original');
    }
  }
  for (const [key, value] of Object.entries(source.ui)) check(value, catalog.ui?.[key], 'ui.' + key);
  for (const [id, dish] of Object.entries(source.dishes)) {
    const target = catalog.dishes?.[id];
    if (!target) { add('dishes.' + id, 'plato sin traducir'); continue; }
    check(dish.name, target.name, 'dishes.' + id + '.name');
    check(dish.desc, target.desc, 'dishes.' + id + '.desc');
    if (!Array.isArray(target.hints) || target.hints.length !== dish.hints.length) add('dishes.' + id + '.hints', 'número de pistas incorrecto');
    dish.hints.forEach((hint, i) => check(hint, target.hints?.[i], `dishes.${id}.hints.${i}`));
  }
  return issues;
}
module.exports = { validateCatalog };
