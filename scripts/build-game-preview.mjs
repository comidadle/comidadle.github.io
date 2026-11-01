import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import { parse as parseJs } from 'acorn';
import { parse as parseHtml, parseFragment } from 'parse5';
const root=path.resolve('.');
const source=fs.readFileSync('index.html','utf8');
const sourceCatalog=JSON.parse(fs.readFileSync('locales/catalogs/es.json','utf8'));
const gameMessages=createRequire(import.meta.url)('../i18n/game-messages.cjs');
const changelogTranslations=createRequire(import.meta.url)('../i18n/changelog-translations.cjs');
const changelogMessages={};
const messages={};
const lookup={};
const normalize=s=>s.replace(/\s+/g,' ').trim();
function register(value){
  const text=normalize(value),key='msg_'+crypto.createHash('sha256').update(text).digest('hex').slice(0,16);
  messages[key]=text;lookup[text]=key;return key;
}
const words=new Set('Entrar Guardar Cancelar Copiar Compartir Perfil Amigos Tienda Logros Misiones Racha Rachas Victorias Derrotas Progreso Duelos Pasaporte Precisión Memoria Infinito Invitado Invitados Reglas Estadísticas Configuración Reseñas Sugerencias Notificaciones Nombre Contraseña Email País Países Ayer Hoy Mañana Intentos Intento Pista Pistas Plato Platos Cerrar Volver Continuar Confirmar Aceptar Rechazar Eliminar Enviar Buscar Cargando Error Sí No Todos Todas Ninguno Ninguna Desbloqueado Bloqueado Gratis Equipar Equipado Comprar Enviado Pendiente Aciertos Fallos Nivel Novato Aprendiz Conocedor Experto Maestro Leyenda Comensal Gourmet Imparable Coleccionista Magnate Veterano Triunfador Dominante Explorador Trotamundos Incondicional Sabelotodo Anónimo Español Inglés Francés Portugués Alemán'.split(' '));
for(const word of 'Registrarme Receta Preferencias Sonido Datos Solicitudes Anuncio Extras Modos Yo Comunidad Info Colores Marcos Badges Emojis Ranking Prohibido Consecuencias Entendido Actual Cuenta Ayuda Usuario Oculto Hecho Invitación Conectando Verificando Comprobando Enviando Entrando Cambiando Publicando Quitando Malo Regular Bueno Responder Ocultar Enviada'.split(' '))words.add(word);
const lowerWords=new Set([...words].map(word=>word.toLocaleLowerCase('es')));
const brands=new Set(['🌶️ Comidadle','Comidadle','Comida','🌶️ Comida','dle','Anas','TikTok','@aanxs404','#FreeGaza','XP','ADMIN','Owner']);
function visibleText(value){
  const text=normalize(value);if(brands.has(text))return false;
  return /[A-Za-zÀ-ÿ]{2}/.test(text.replace(/\{(?:p\d+|n|s)\}/g,''));
}
function human(value){
  const text=normalize(value);
  if(text==='🟩 Acierto · 🟥 Fallo')return true;
  if(!/[a-záéíóúñü]{2}/i.test(text)||/^https?:|^data:|^comidadle_|^sb_publishable|^Bearer\b|^\/(?:rest|functions)\//.test(text))return false;
  if(words.has(text)||lowerWords.has(text.replace(/^[^\p{L}]+|[^\p{L}]+$/gu,'').toLocaleLowerCase('es')))return true;
  const parenthesized=text.match(/^([A-Za-zÀ-ÿ]+)\s*\(/);if(parenthesized&&lowerWords.has(parenthesized[1].toLocaleLowerCase('es')))return true;
  if(/[;{}]|rgba?\(|var\(--|#[\da-f]{3}|^\.[\w-]+$|^&|^\?|^\//i.test(text.replace(/\{p\d+\}/g,'')))return false;
  if(/^[.\d\s]+(?:px|rem|em|%|s)\b/.test(text))return false;
  return /[¿¡áéíóúñü]/i.test(text)||(/[a-z]{2}\s+[a-z0-9{]/i.test(text)&&!/^(Content-Type|Plus Jakarta|Fraunces|return=|resolution=|strict |throw |function |margin|padding|background|opacity |all )/.test(text));
}
const skip=new Set(['ALL_DISHES','SUNDAY_INTERNATIONAL_DISHES','FLAGS','DEMONYMS','T','SB','SK','SH']);
const start=source.lastIndexOf('<script>')+8,end=source.indexOf('</script>',start);
let code=source.slice(start,end);
// El país personal se cambia desde el perfil; ambos rankings muestran solo la identidad.
code=code.replace(/\s*<select id="my-country-select"[\s\S]*?<\/select>/,'');
code=code.replace('document.getElementById("my-country-select").onchange=(e)=>{saveMyCountry(e.target.value);populateCountryFilterSelects();};','');
code=code.replaceAll('<div style="text-align:center;font-size:17px;font-weight:700;color:var(--text);margin-bottom:.75rem">${d.name}</div>','<div class="dish-name" style="text-align:center;font-size:17px;font-weight:700;color:var(--text);margin-bottom:.75rem">${d.name}</div>');
code=code.replaceAll('<div style="font-size:13px;font-weight:600">${d.name}</div>','<div class="dish-name" style="font-size:13px;font-weight:600">${d.name}</div>');
code=code.replace(/\b(dish|d)\.name\.replace\(buildBlurRegex\(/g,'L10N.display($1.name).replace(buildBlurRegex(');
code=code.replace('const t=[c,...(DEMONYMS[c]||[])];','const t=L10N.countryTerms(c,[c,...(DEMONYMS[c]||[])]);');
code=code.replace('let currentLang=localStorage.getItem(LANG_KEY)||"es";','let currentLang=L10N.locale;');
code=code.replace('const fmt=d=>d.getDate()+" "+MONTHS[d.getMonth()];','const fmt=d=>L10N.date(d,{day:"numeric",month:"short"});');
code=code.replaceAll('a.localeCompare(b,"es")','L10N.compareCountries(a,b)');
code=code.replace('body:JSON.stringify({name,country,emoji})','body:JSON.stringify({name,country,emoji,language:L10N.locale})');
code=code.replace('const text=(data&&data.text)||"Sin respuesta.";','const text=(data&&data.text)||L10N.display("Sin respuesta.");');
code=code.replace('showLoginError("Error: "+error.message)','showLoginError(_friendlyAuthError(error.message))');
code=code.replace('lang:localStorage.getItem(LANG_KEY)','lang:L10N.locale');
code=code.replace('if(data.lang)localStorage.setItem(LANG_KEY,data.lang);','if(data.lang){localStorage.setItem(LANG_KEY,data.lang);localStorage.setItem("comidadle_preview_lang",ComidadleI18n.normalizeLocale(data.lang));}');
code=code.replace('"Adivina el país de origen — "+MAX+" intento"+(MAX!==1?"s":"")','t("attempts_label",{n:MAX})');
code=code.replace('"¡Acertaste en "+log.length+" intento"+(log.length!==1?"s":"")+"!"','t("result_won",{n:log.length})+"!"');
code=code.replace('"¡Acertado en "+log.length+" intento"+(log.length!==1?"s":"")+"!"','t("result_won",{n:log.length})+"!"');
code=code.replace('avg.toFixed(1)+" de 5 · "+rows.length+" reseña"+(rows.length!==1?"s":"")','t("review_summary",{rating:L10N.number(avg,{maximumFractionDigits:1}),n:rows.length})');
code=code.replace('"✅ "+passport[c.name].length+" plato"+(passport[c.name].length>1?"s":"")','"✅ "+t("dish_count",{n:passport[c.name].length})');
code=code.replace('claimedGifts.length===1?"de "+escapeHtml(last.from_username):"de "+claimedGifts.length+" amigos"','claimedGifts.length===1?t("gift_from_one",{name:escapeHtml(last.from_username)}):t("gift_from_many",{n:claimedGifts.length})');
code=code.replace('(i+1)+"º"','L10N.ordinal(i+1)');
const ast=parseJs(code,{ecmaVersion:'latest'});
const additionalCountryCodes={};
for(const declaration of ast.body.filter(node=>node.type==='VariableDeclaration'))for(const variable of declaration.declarations){
  if(['ACTIVE_ISO','FUTURE_ISO'].includes(variable.id.name)&&variable.init?.type==='ObjectExpression')for(const property of variable.init.properties)additionalCountryCodes[property.key.name||property.key.value]=property.value.value;
}
const changes=[];
function children(node){return Object.entries(node).filter(([key])=>!['start','end','loc'].includes(key)).flatMap(([,value])=>Array.isArray(value)?value.filter(x=>x?.type):value?.type?[value]:[]);}
const sourceText=node=>code.slice(node.start,node.end);
const parents=new WeakMap();
function rememberParents(node){for(const child of children(node)){parents.set(child,node);rememberParents(child);}}
rememberParents(ast);
function scope(node){const names=[];for(let parent=node;parent;parent=parents.get(parent))if(parent.type==='FunctionDeclaration'&&parent.id)names.push(parent.id.name);return names;}
for(const declaration of ast.body.filter(node=>node.type==='VariableDeclaration'))for(const variable of declaration.declarations){
  if(variable.id.name==='CHANGELOG'&&variable.init?.type==='ArrayExpression')for(const entry of variable.init.elements){
    const changes=entry.properties.find(field=>(field.key.name||field.key.value)==='changes');
    const version=entry.properties.find(field=>(field.key.name||field.key.value)==='v').value.value;
    for(const [index,text] of (changes?.value.elements||[]).entries())if(text.type==='Literal'&&typeof text.value==='string'){
      const key=register(text.value);
      for(const [locale,versions] of Object.entries(changelogTranslations))if(versions[version]){
        if(versions[version].length!==changes.value.elements.length)throw Error('Historial desincronizado: '+version);
        (changelogMessages[locale]||={})[key]=versions[version][index];
      }
    }
  }
  if(['ACH_LIST','MISSION_POOL'].includes(variable.id.name)&&variable.init?.type==='ArrayExpression')for(const entry of variable.init.elements||[]){
    for(const field of entry.properties||[]){
      if(!['name','desc','cat'].includes(field.key.name||field.key.value))continue;
      if(field.value.type==='Literal'&&typeof field.value.value==='string'&&visibleText(field.value.value))register(field.value.value);
      else {const parts=split(field.value);if(parts&&visibleText(parts.text.replace(/\uE000(\d+)\uE001/g,(_,i)=>`{p${i}}`)))register(parts.text.replace(/\uE000(\d+)\uE001/g,(_,i)=>`{p${i}}`));}
    }
  }
}
function split(node){
  if(node.type==='Literal'&&typeof node.value==='string')return {text:node.value,expressions:[]};
  if(node.type==='TemplateLiteral')return {text:node.quasis.map((q,i)=>q.value.cooked+(i<node.expressions.length?`\uE000${i}\uE001`:'')).join(''),expressions:node.expressions};
  if(node.type==='BinaryExpression'&&node.operator==='+'){
    const left=split(node.left);
    if(left&&node.right.type==='Literal'&&typeof node.right.value==='string')return {text:left.text+node.right.value,expressions:left.expressions};
    if(left)return {text:left.text+`\uE000${left.expressions.length}\uE001`,expressions:[...left.expressions,node.right]};
    if(node.right.type==='Literal'&&typeof node.right.value==='string')return {text:'\uE0000\uE001'+node.right.value,expressions:[node.left]};
  }
  return null;
}
function display(node){
  const text=sourceText(node);
  if(node.type==='MemberExpression'&&node.object.type==='ArrayExpression'&&node.object.elements.every(item=>item?.type==='Literal'&&typeof item.value==='string')){for(const item of node.object.elements)if(visibleText(item.value))register(item.value);return `L10N.display(${compile(node,false)})`;}
  if(text==='msg'&&scope(node).some(name=>['_showAuthErr','showLoginError'].includes(name)))return `L10N.display(${text})`;
  if(node.type==='ConditionalExpression')return `(${compile(node.test,false)}?${compile(node.consequent,true)}:${compile(node.alternate,true)})`;
  if(node.type==='LogicalExpression'&&['||','??'].includes(node.operator))return `(${display(node.left)}${node.operator}${compile(node.right,true)})`;
  if(/^MONTHS\[.*\]$/.test(text))return `L10N.month(${text})`;
  if(text==='name'&&scope(node).includes('openPassportCountry'))return `L10N.country(${text})`;
  if(text==='name'&&scope(node).includes('openDishRecipe'))return `L10N.display(${text})`;
  if(node.type==='CallExpression'&&node.callee.name==='escapeHtml'&&node.arguments.length===1)return `escapeHtml(${display(node.arguments[0])})`;
  // Solo datos de presentación conocidos; nunca nombres o mensajes de jugadores.
  if(/^(?:dish|d|dd|infDish|memDish)\.(?:name|desc|hints(?:\[.*\])?)$/.test(text)||/^(?:a|m|lv|item)\.(?:name|desc|description)$/.test(text)||/^(?:myEquip|eq|equip)\.(?:title|badge)$/.test(text)||['opt','cat','h.dish'].includes(text))return `L10N.display(${text})`;
  if(text==='c'&&scope(node).includes('renderChangelog'))return `L10N.display(${text})`;
  if(text==='entry.date'&&scope(node).includes('renderChangelog'))return `L10N.changelogDate(${text})`;
  if(['c','country','myCountry'].includes(text)||/\.country$/.test(text)||text==='c.name')return `L10N.country(${text})`;
  return compile(node,false);
}
function expressionText(text,expressions,displayExpressions=false){
  const parts=[];let at=0;
  for(const match of text.matchAll(/\uE000(\d+)\uE001/g)){
    if(match.index>at)parts.push(JSON.stringify(text.slice(at,match.index)));
    const expression=expressions[Number(match[1])];
    parts.push('('+(displayExpressions?display(expression):compile(expression,false))+')');at=match.index+match[0].length;
  }
  if(at<text.length)parts.push(JSON.stringify(text.slice(at)));
  return parts.join('+')||'""';
}
function translated(text,expressions,html=false){
  const clean=text.replace(/\uE000(\d+)\uE001/g,(_,n)=>`{p${n}}`);
  if(!visibleText(clean))return expressionText(text,expressions,true);
  const trimmed=clean.trim(),leading=clean.slice(0,clean.length-clean.trimStart().length),trailing=clean.slice(clean.trimEnd().length);
  const key=register(trimmed);
  const used=[...text.matchAll(/\uE000(\d+)\uE001/g)].map(m=>Number(m[1]));
  const vars=[...new Set(used)].map(i=>`p${i}:${display(expressions[i])}`).join(',');
  const call=`L10N.${html?'htmlText':'raw'}(${JSON.stringify(key)},{${vars}})`;
  return (leading?JSON.stringify(leading)+'+':'')+call+(trailing?'+'+JSON.stringify(trailing):'');
}
function markup(parts){
  const {text,expressions}=parts;
  const tree=parseFragment(text,{sourceCodeLocationInfo:true});const replacements=[];
  function visit(node){
    if(['script','style','svg'].includes(node.tagName))return;
    if(node.nodeName==='#text'&&node.sourceCodeLocation){
      const {startOffset,endOffset}=node.sourceCodeLocation;
      if(visibleText(node.value.replace(/\uE000\d+\uE001/g,'{p0}'))||/\uE000\d+\uE001/.test(node.value))replacements.push({start:startOffset,end:endOffset,expression:translated(node.value,expressions,true)});
    }
    for(const attr of node.attrs||[]){
      if(!['placeholder','title','aria-label','alt'].includes(attr.name))continue;
      const location=node.sourceCodeLocation?.attrs?.[attr.name];
      if(location&&visibleText(attr.value.replace(/\uE000\d+\uE001/g,'{p0}'))){
        const raw=text.slice(location.startOffset,location.endOffset),equal=raw.indexOf('='),after=raw.slice(equal+1),quoted=/^["']/.test(after);
        replacements.push({start:location.startOffset+equal+1+(quoted?1:0),end:location.endOffset-(quoted?1:0),expression:translated(attr.value,expressions,true)});
      }
    }
    for(const child of node.childNodes||[])visit(child);
  }
  visit(tree);
  const result=[];let offset=0;
  for(const item of replacements.sort((a,b)=>a.start-b.start)){
    if(item.start<offset)throw Error('Solapamiento en plantilla HTML');
    if(item.start>offset)result.push(expressionText(text.slice(offset,item.start),expressions));
    result.push('('+item.expression+')');offset=item.end;
  }
  if(offset<text.length)result.push(expressionText(text.slice(offset),expressions));
  return result.join('+')||'""';
}
function compile(node,visible){
  if(!node)return '';
  const parts=split(node);
  if(visible&&parts){
    if(/<[a-z][\s\S]*>/i.test(parts.text))return markup(parts);
    return translated(parts.text,parts.expressions);
  }
  if(visible&&node.type==='ConditionalExpression')return `(${compile(node.test,false)}?${compile(node.consequent,true)}:${compile(node.alternate,true)})`;
  if(visible&&node.type==='MemberExpression')return display(node);
  if(visible&&node.type==='Identifier')return display(node);
  // Compilar usos visibles anidados sin alterar valores técnicos de la expresión.
  const edits=[];
  walk(node,edits,false);
  let text=sourceText(node);
  for(const edit of edits.sort((a,b)=>b.start-a.start))text=text.slice(0,edit.start-node.start)+edit.text+text.slice(edit.end-node.start);
  return text;
}
const visibleCalls=new Set(['alert','confirm','prompt','showToast','showLoginError','setErr','showAuthPrompt','showDuelError','fillText','strokeText','_showAuthErr']);
function walk(node,edits,root=true){
  if(node.type==='VariableDeclarator'&&skip.has(node.id?.name))return;
  if(node.type==='FunctionDeclaration'&&['renderPassportGrid','openPassportCountry','openDishRecipe'].includes(node.id.name)){
    const replacements={renderPassportGrid:'function renderPassportGrid(){return L10N.passportGrid();}',openPassportCountry:'function openPassportCountry(name,active,unlocked){return L10N.passportCountry(name);}',openDishRecipe:'async function openDishRecipe(name,country,emoji,flag){return L10N.dishRecipe(name,country,emoji,flag);}'};
    edits.push({start:node.start,end:node.end,text:replacements[node.id.name]});return;
  }
  if(node.type==='AssignmentExpression'&&sourceText(node.left)==='descEl.style.display'&&scope(node).includes('renderAll')){
    edits.push({start:node.start,end:node.end,text:`(${sourceText(node)},L10N.decorateDishNames(descEl,done))`});return;
  }
  if(node.type==='FunctionDeclaration'&&['t','applyLang','setLang'].includes(node.id.name)){
    if(node.id.name==='t')edits.push({start:node.start,end:node.end,text:'function t(key,vars={}){return L10N.text(key,vars);}'});
    if(node.id.name==='applyLang')edits.push({start:node.start,end:node.end,text:'function applyLang(){L10N.applyStatic();}'});
    if(node.id.name==='setLang')edits.push({start:node.start,end:node.end,text:'function setLang(lang){L10N.changeLanguage(lang);}'});
    return;
  }
  if(node.type==='FunctionDeclaration'&&node.id.name==='timeAgo'){
    edits.push({start:node.start,end:node.end,text:'function timeAgo(value){return L10N.relativeDate(value);}'});return;
  }
  if(node.type==='FunctionDeclaration'&&node.id.name==='_friendlyAuthError'){
    const generic=register('No se pudo completar la operación. Inténtalo de nuevo.');
    const value=sourceText(node).replace('return "Error: "+msg;',`return L10N.raw("${generic}");`);
    edits.push({start:node.start,end:node.end,text:value});return;
  }
  if(node.type==='AssignmentExpression'&&node.left.type==='MemberExpression'&&['innerHTML','textContent','innerText','title','placeholder'].includes(node.left.property?.name)){
    const value=compile(node.right,true);
    const contexts=scope(node),gameContext=contexts.some(name=>['renderAll','renderInfiniteGame','loadInfinite','startMemoryRound','renderDuelPlay','renderGroupPlay'].includes(name));
    if(parents.get(node)?.type==='ExpressionStatement'&&(['innerHTML','textContent','innerText'].includes(node.left.property.name))&&(gameContext||sourceText(node.right).includes('dish-name'))){
      const reveal=contexts.includes('showMemResult')||contexts.includes('openPassportCountry')||contexts.includes('renderYesterday')?'true':contexts.includes('renderAll')?'done':contexts.includes('renderInfiniteGame')||contexts.includes('loadInfinite')?'iDone':'false';
      edits.push({start:node.start,end:node.end,text:`(${sourceText(node.left)}=${value},L10N.decorateDishNames(${sourceText(node.left.object)},${reveal}))`});
    }else if(value!==sourceText(node.right))edits.push({start:node.right.start,end:node.right.end,text:value});
    // No visitar la derecha dos veces.
    for(const child of children(node.left))walk(child,edits);return;
  }
  if(node.type==='AssignmentExpression'&&node.left.type==='Identifier'&&node.left.name==='shareText'){
    edits.push({start:node.right.start,end:node.right.end,text:compile(node.right,true)});return;
  }
  if(node.type==='Property'&&!node.computed&&['msg','prompt'].includes(node.key.name||node.key.value)){
    edits.push({start:node.value.start,end:node.value.end,text:compile(node.value,true)});return;
  }
  if(node.type==='NewExpression'&&node.callee.name==='Notification'){
    const body=node.arguments[1]?.properties?.find(property=>(property.key.name||property.key.value)==='body');
    if(body)edits.push({start:body.value.start,end:body.value.end,text:compile(body.value,true)});return;
  }
  if(node.type==='CallExpression'&&visibleCalls.has(node.callee.name||node.callee.property?.name)&&node.arguments[0]){
    const index=node.callee.name==='_showAuthErr'?1:0,arg=node.arguments[index];
    if(arg)edits.push({start:arg.start,end:arg.end,text:compile(arg,true)});
    for(const [i,child] of node.arguments.entries())if(i!==index)walk(child,edits);return;
  }
  // Cadenas de HTML retornadas por map(), funciones y plantillas de componentes.
  const parts=split(node);
  if(parts&&/<[a-z][\s\S]*>/i.test(parts.text)){
    edits.push({start:node.start,end:node.end,text:markup(parts)});return;
  }
  for(const child of children(node))walk(child,edits);
}
for(const node of ast.body)walk(node,changes);
for(const edit of changes.sort((a,b)=>b.start-a.start))code=code.slice(0,edit.start)+edit.text+code.slice(edit.end);
parseJs(code,{ecmaVersion:'latest'});
// Los textos de datos locales (logros, niveles, misiones) se resuelven al mostrarlos.
const inventory=JSON.parse(fs.readFileSync('locales/source/messages.json','utf8'));
for(const message of Object.values(inventory.messages))if(human(message.source)&&!message.source.includes('{p')&&!/<\/?[A-Za-z][^>]*>/.test(message.source))register(message.source);
// Vincular solo nodos originales. No se inspecciona contenido de jugadores.
const html=source.slice(0,start-8)+source.slice(end+9);
const document=parseHtml(html,{sourceCodeLocationInfo:true}),htmlEdits=[];
function staticText(node){
  if(['script','style','svg','noscript'].includes(node.tagName))return;
  const attrs=Object.fromEntries((node.attrs||[]).map(a=>[a.name,a.value]));
  if(node.nodeName==='#text'&&node.parentNode?.tagName&&visibleText(node.value)){
    const parent=node.parentNode,location=parent.sourceCodeLocation?.startTag;
    if(location){
      const siblings=parent.childNodes||[],index=siblings.indexOf(node),key=register(node.value.trim());
      htmlEdits.push({offset:location.endOffset-1,text:` data-l10n-node-${index}="${key}"`});
    }
  }
  for(const attr of node.attrs||[]){
    if(['placeholder','title','aria-label','alt'].includes(attr.name)&&visibleText(attr.value)){
      const key=register(attr.value),location=node.sourceCodeLocation?.startTag;
      if(location)htmlEdits.push({offset:location.endOffset-1,text:` data-l10n-attr-${attr.name}="${key}"`});
    }
    if(node.tagName==='meta'&&attr.name==='content'&&attrs.name==='description'){
      const key=register(attr.value),location=node.sourceCodeLocation.startTag;
      htmlEdits.push({offset:location.endOffset-1,text:` data-l10n-attr-content="${key}"`});
    }
  }
  for(const child of node.childNodes||[])staticText(child);
}
staticText(document);
let output=html;
const logoutKey=register('¿Cerrar sesión?');
for(const edit of htmlEdits.sort((a,b)=>b.offset-a.offset))output=output.slice(0,edit.offset)+edit.text+output.slice(edit.offset);
output=output.replace("confirm('¿Cerrar sesión?')",`confirm(ComidadleLocalization.raw('${logoutKey}'))`);
const selector='<div class="setting-row" style="display:block"><div><label class="setting-label" for="language-select">Idioma / Language</label><div class="setting-desc" id="language-notice">El cambio recarga la página. Tu progreso diario se conserva.</div></div><select id="language-select" aria-describedby="language-notice" style="font:inherit;width:100%;margin-top:8px;background:var(--surface2);color:var(--text);padding:8px;border:1px solid var(--border-strong);border-radius:8px"></select></div>';
output=output.replace('<div class="settings-section-label">🔥 Modo difícil</div>',selector+'<div class="settings-section-label">🔥 Modo difícil</div>');
// Insertar el selector antes de la sección marcada por el compilador.
if(!output.includes('id="language-select"'))output=output.replace(/(<div class="settings-section-label"[^>]*>🔥 Modo difícil<\/div>)/,selector+'$1');
output=output.replace('</head>','<style>.country-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.country-btn{min-width:0}.country-btn>span:last-child{min-width:0;overflow-wrap:anywhere;hyphens:auto}.setting-info{min-width:0;flex:1}.setting-desc{overflow-wrap:anywhere}</style><script src="../i18n/runtime.js"></script><script src="../i18n/geography.js"></script>\n</head>').replace('</body>','<script src="../i18n/game-boot.js"></script>\n</body>');
output=output.replace(/<script[^>]*src="https:\/\/www\.googletagmanager\.com[^>]*><\/script>/g,'').replace(/<script>window\.dataLayer[\s\S]*?<\/script>/g,'');
code='const L10N=window.ComidadleLocalization;\n'+code;
const outputDir=path.join(root,'preview');fs.mkdirSync(outputDir,{recursive:true});
fs.writeFileSync(path.join(outputDir,'index.html'),output);
fs.writeFileSync(path.join(outputDir,'app.js'),code);
const countryCode=flag=>[...flag].map(c=>String.fromCharCode(c.codePointAt(0)-0x1f1e6+65)).join('');
const flagsBlock=source.slice(source.indexOf('const FLAGS='),source.indexOf('const ALL_COUNTRIES='));
const vm=await import('node:vm');const flags=vm.runInNewContext(flagsBlock+'FLAGS');
const flagsByCountry={...Object.fromEntries(Object.entries(flags).map(([country,flag])=>[country,countryCode(flag)])),...additionalCountryCodes};
const demonymsBlock=source.slice(source.indexOf('const DEMONYMS='),source.indexOf('// ═══ VERSION'));
const demonyms=vm.runInNewContext(demonymsBlock+'DEMONYMS');
for(const values of Object.values(demonyms))for(const value of values)register(value);
if(fs.existsSync('locales/source/shop.json'))for(const item of JSON.parse(fs.readFileSync('locales/source/shop.json','utf8'))){
  for(const value of [item.name,item.description,...(['title','badge'].includes(item.category)?[item.value]:[])])if(typeof value==='string'&&/[a-záéíóúñ]/i.test(value))register(value);
}
register('Idioma');register('El cambio recarga la página. Tu progreso diario se conserva.');
const ui={...Object.fromEntries(Object.entries(sourceCatalog.ui).filter(([key])=>!key.startsWith('msg_'))),...messages,...gameMessages.es};
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const revision=crypto.createHash('sha256').update(JSON.stringify(canonical({ui,dishes:sourceCatalog.dishes}))).digest('hex');
const publicShop=fs.existsSync('locales/source/shop.json')?JSON.parse(fs.readFileSync('locales/source/shop.json','utf8')):[];
const catalog={...sourceCatalog,ui,sourceRevision:revision,applicationCoverageReviewed:false,lookup,flags:flagsByCountry,publicShop};
fs.writeFileSync('locales/catalogs/es.json',JSON.stringify(catalog,null,2)+'\n');
for(const [locale,values] of Object.entries(gameMessages)){
  if(locale==='es')continue;
  const file=`locales/catalogs/${locale}.json`,draft=JSON.parse(fs.readFileSync(file,'utf8'));
  // Al sustituir renderizadores solo se pueden retirar mensajes: los textos compartidos deben ser idénticos.
  const onlyRemoved=Object.entries(ui).every(([key,value])=>JSON.stringify(sourceCatalog.ui[key])===JSON.stringify(value)||Object.hasOwn(changelogMessages[locale]||{},key));
  if(onlyRemoved&&draft.sourceRevision===sourceCatalog.sourceRevision){draft.sourceRevision=revision;draft.ui=Object.fromEntries(Object.entries(draft.ui).filter(([key])=>Object.hasOwn(ui,key)));}
  draft.ui={...draft.ui,...values,...changelogMessages[locale]};fs.writeFileSync(file,JSON.stringify(draft,null,2)+'\n');
}
fs.writeFileSync('locales/source/bindings.json',JSON.stringify({messages:Object.keys(messages).length,sinks:changes.length,staticBindings:htmlEdits.length},null,2)+'\n');
const manifest=JSON.parse(fs.readFileSync('manifest.json','utf8'));manifest.start_url='./index.html';manifest.scope='./';fs.writeFileSync(path.join(outputDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const assets=['./app.js','../i18n/runtime.js','../i18n/geography.js','../i18n/passport.js','../i18n/game-boot.js',...['es','en','fr','de','pt-BR','pt-PT'].map(locale=>'../locales/catalogs/'+locale+'.json')];
const catalogContent=['es','en','fr','de','pt-BR','pt-PT'].map(locale=>fs.readFileSync(`locales/catalogs/${locale}.json`,'utf8')).join('');
const shellVersion=crypto.createHash('sha256').update(output+code+fs.readFileSync('i18n/game-boot.js','utf8')+fs.readFileSync('i18n/passport.js','utf8')+fs.readFileSync('i18n/runtime.js','utf8')+fs.readFileSync('i18n/geography.js','utf8')+catalogContent).digest('hex').slice(0,12);
output=output.replace(/(src="\.\.\/i18n\/(?:runtime|geography|game-boot)\.js)"/g,'$1?v='+shellVersion+'"');
fs.writeFileSync(path.join(outputDir,'index.html'),output);
let sw=fs.readFileSync('sw.js','utf8').replace('"-shell-1"',JSON.stringify('-preview-'+shellVersion));
sw=sw.replaceAll('"comidadle-"','"comidadle-preview-"');
sw=sw.replace('const APP_SHELL = [','const APP_SHELL = [\n'+assets.map(asset=>'  '+JSON.stringify(asset+'?v='+shellVersion)+',').join('\n'));
const offline=JSON.parse(fs.readFileSync('i18n/offline-messages.json','utf8'));
sw=sw.replace(JSON.stringify(offline.es),'offlineMessage(request)');
sw='const OFFLINE_MESSAGES='+JSON.stringify(offline)+';\nfunction offlineMessage(request){const requested=(request.headers.get("Accept-Language")||self.navigator.language||"es").split(",")[0].toLowerCase();const locale=requested.startsWith("pt-pt")?"pt-PT":requested.startsWith("pt")?"pt-BR":requested.split("-")[0];return OFFLINE_MESSAGES[locale]||OFFLINE_MESSAGES.es;}\n'+sw;
fs.writeFileSync(path.join(outputDir,'sw.js'),sw);
console.log(`${changes.length} expresiones de interfaz conectadas y ${htmlEdits.length} enlaces HTML. ${Object.keys(messages).length} mensajes.`);
