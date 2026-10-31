(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ComidadleI18n = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const LOCALES = Object.freeze({ es: 'Español', en: 'English', fr: 'Français', 'pt-BR': 'Português (Brasil)', 'pt-PT': 'Português (Portugal)', de: 'Deutsch' });
  function normalizeLocale(value) {
    const normalized = String(value || '').replace('_', '-').toLowerCase();
    const exact = Object.keys(LOCALES).find(locale => locale.toLowerCase() === normalized);
    if (exact) return exact;
    if (normalized.startsWith('pt')) return 'pt-BR';
    const base = normalized.split('-')[0];
    return Object.hasOwn(LOCALES, base) ? base : 'es';
  }
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  function interpolate(text, vars, escape = false) {
    return text.replace(/\{([\w]+)\}/g, (match, key) => {
      if (!Object.hasOwn(vars, key)) return match;
      return escape ? escapeHtml(vars[key]) : String(vars[key]);
    });
  }
  function message(value, locale, vars) {
    if (value && typeof value === 'object') return value[new Intl.PluralRules(locale).select(Number(vars.n))] || value.other;
    return value;
  }
  function countryCode(flag) {
    const code = [...(flag || '')].map(char => char.codePointAt(0) - 0x1f1e6);
    return code.length === 2 && code.every(n => n >= 0 && n < 26) ? code.map(n => String.fromCharCode(65 + n)).join('') : null;
  }
  class I18n {
    constructor(source, { fetchCatalog, preview = false, storage = null } = {}) {
      this.source = source;
      this.fetchCatalog = fetchCatalog;
      this.preview = preview;
      this.storage = storage;
      this.locale = 'es';
      this.catalog = source;
      this.request = 0;
    }
    async setLocale(value) {
      const locale = normalizeLocale(value);
      const request = ++this.request;
      const catalog = locale === 'es' ? this.source : await this.fetchCatalog(locale);
      if (catalog.locale !== locale) throw new Error('El catálogo no corresponde al idioma solicitado.');
      if (catalog.sourceRevision !== this.source.sourceRevision) throw new Error('El catálogo no corresponde a esta versión de los textos.');
      if (locale !== 'es' && !this.preview && catalog.status !== 'reviewed') throw new Error('Este idioma todavía no está revisado.');
      if (request !== this.request) return false;
      this.locale = locale;
      this.catalog = catalog;
      try { this.storage?.setItem('comidadle_lang', locale); } catch (_) {}
      return true;
    }
    pattern(key, vars = {}) {
      const value = message(Object.hasOwn(this.catalog.ui||{},key)?this.catalog.ui[key]:undefined, this.locale, vars);
      const source = message(Object.hasOwn(this.source.ui||{},key)?this.source.ui[key]:undefined, 'es', vars);
      return typeof value === 'string' && value.trim() ? value : source ?? key;
    }
    text(key, vars = {}) {
      const pattern = this.pattern(key, vars);
      const formatted=Object.fromEntries(Object.entries(vars).map(([name,value])=>[name,typeof value==='number'?this.number(value,{maximumFractionDigits:12}):value]));
      return interpolate(pattern, formatted);
    }
    // Solo se permite el marcado sencillo de los textos originales de la guía.
    richText(key, vars = {}) {
      return escapeHtml(this.pattern(key,vars)).replace(/&lt;(\/?)(strong|em|br)\s*\/?&gt;/gi, '<$1$2>').replace(/\{([\w]+)\}/g, (match, name) => Object.hasOwn(vars, name) ? escapeHtml(typeof vars[name]==='number'?this.number(vars[name],{maximumFractionDigits:12}):vars[name]) : match);
    }
    dish(id) {
      const original = this.source.dishes[id];
      if (!original) throw new Error('Plato desconocido: ' + id);
      const translated = this.catalog.dishes?.[id];
      const field = key => typeof translated?.[key] === 'string' && translated[key].trim() ? translated[key] : original[key];
      return {
        name: field('name'),
        displayName: typeof translated?.displayName === 'string' && translated.displayName.trim() ? translated.displayName : original.name,
        desc: field('desc'),
        hints: original.hints.map((hint, index) => translated?.hints?.[index]?.trim() ? translated.hints[index] : hint),
      };
    }
    country(label, flag) {
      const code = countryCode(flag);
      if (!code) return label;
      try { return new Intl.DisplayNames([this.locale], { type: 'region' }).of(code) || label; } catch (_) { return label; }
    }
    number(value, options) { return new Intl.NumberFormat(this.locale, options).format(value); }
    date(value, options = { day: 'numeric', month: 'short' }) { return new Intl.DateTimeFormat(this.locale, options).format(value); }
  }
  return { I18n, LOCALES, normalizeLocale, countryCode, interpolate, escapeHtml };
});
