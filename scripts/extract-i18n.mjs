import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parse as parseJs } from 'acorn';
import { parse as parseHtml, parseFragment } from 'parse5';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const messages = new Map();
const excludedVariables = new Set(['ALL_DISHES', 'SUNDAY_INTERNATIONAL_DISHES', 'FLAGS', 'DEMONYMS', 'T', 'SB', 'SK', 'SH']);
const attributes = new Set(['placeholder', 'title', 'aria-label', 'alt']);

function add(text, origin, type = 'text') {
  const value = text.replace(/\s+/g, ' ').trim();
  if (!/[a-zÀ-ÿ]{2}/i.test(value)) return;
  // No incluir direcciones, selectores ni nombres internos como mensajes.
  if (/^(?:https?:|data:|\/rest\/|comidadle_|#[\w-]+$)/.test(value)) return;
  const id = 'msg_' + crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
  if (!messages.has(id)) messages.set(id, { source: value, origins: [], types: [] });
  const message = messages.get(id);
  if (!message.origins.includes(origin)) message.origins.push(origin);
  if (!message.types.includes(type)) message.types.push(type);
}

function htmlMessages(tree, origin, inspectHandlers = false) {
  function visit(node) {
    if (['script', 'style', 'svg', 'noscript'].includes(node.tagName)) return;
    if (node.nodeName === '#text') add(node.value, origin, 'html-text');
    const attrs = Object.fromEntries((node.attrs || []).map(a => [a.name, a.value]));
    for (const attr of node.attrs || []) {
      if (attributes.has(attr.name)) add(attr.value, origin + ':' + attr.name, 'attribute');
      if (inspectHandlers && attr.name.startsWith('on')) javascriptMessages(attr.value, origin + ':' + attr.name, true);
    }
    if (node.tagName === 'meta' && ['description', 'og:title', 'og:description'].includes(attrs.name || attrs.property)) add(attrs.content || '', origin, 'metadata');
    for (const child of node.childNodes || []) visit(child);
    if (node.content) visit(node.content);
  }
  visit(tree);
}

function javascriptMessages(code, origin, handler = false) {
  const ast = parseJs(code, { ecmaVersion: 'latest', locations: true, allowReturnOutsideFunction: handler });
  function display(value, node) {
    const location = origin + ':' + node.loc.start.line;
    if (/<[a-z][\s\S]*>/i.test(value)) htmlMessages(parseFragment(value), location);
    else add(value, location, node.type === 'TemplateLiteral' ? 'template' : 'javascript-review');
  }
  function walk(node, parent) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'VariableDeclarator' && excludedVariables.has(node.id?.name)) return;
    if (node.type === 'Literal' && typeof node.value === 'string') {
      if (parent?.type === 'Property' && parent.key === node && !parent.computed) return;
      // Los identificadores de APIs del DOM y del almacenamiento no son texto visible.
      const callee = parent?.type === 'CallExpression' ? parent.callee : null;
      const technical = new Set(['getElementById', 'querySelector', 'querySelectorAll', 'getItem', 'setItem', 'removeItem', 'createElement', 'addEventListener', 'removeEventListener', 'getAttribute', 'setAttribute']);
      if (callee?.type === 'MemberExpression' && technical.has(callee.property?.name) && parent.arguments[0] === node) return;
      display(node.value, node);
    }
    if (node.type === 'TemplateLiteral') {
      display(node.quasis.map((q, i) => q.value.cooked + (i < node.expressions.length ? `{p${i}}` : '')).join(''), node);
    }
    for (const [key, child] of Object.entries(node)) {
      if (['loc', 'start', 'end'].includes(key)) continue;
      if (Array.isArray(child)) child.forEach(item => walk(item, node));
      else if (child && typeof child === 'object') walk(child, node);
    }
  }
  walk(ast, null);
}

htmlMessages(parseHtml(source), 'index.html', true);
for (const [index, match] of [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].entries()) {
  if (!/\bsrc\s*=/.test(match[1])) javascriptMessages(match[2], `index.html:script-${index}`);
}

const output = path.join(root, 'locales', 'source');
fs.mkdirSync(output, { recursive: true });
const sorted = Object.fromEntries([...messages.entries()].sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(path.join(output, 'messages.json'), JSON.stringify({
  locale: 'es',
  status: 'source-inventory',
  note: 'Inventario para revisión. Incluye candidatos técnicos que deben clasificarse; no acredita cobertura de la interfaz.',
  messages: sorted,
}, null, 2) + '\n');
console.log(`${messages.size} candidatos de texto extraídos; falta clasificar y conectar sus usos a claves estables.`);
