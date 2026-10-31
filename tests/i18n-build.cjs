const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {parse}=require('acorn');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const original=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
const compiled=fs.readFileSync(path.join(root,'preview/app.js'),'utf8');
const sourceCatalog=JSON.parse(fs.readFileSync(path.join(root,'locales/catalogs/es.json'),'utf8'));
function declarations(source){
  const ast=parse(source,{ecmaVersion:'latest'}),result=new Map();
  for(const node of ast.body){
    if(node.type==='VariableDeclaration')for(const value of node.declarations)if(value.id.type==='Identifier')result.set(value.id.name,source.slice(value.init.start,value.init.end));
    if(node.type==='FunctionDeclaration')result.set(node.id.name,source.slice(node.start,node.end));
  }
  return result;
}
test('el compilador conserva los datos, las semillas y el almacenamiento canónicos',()=>{
  const before=declarations(original),after=declarations(compiled);
  for(const name of ['ALL_DISHES','SUNDAY_INTERNATIONAL_DISHES','FLAGS','DEMONYMS','ACTIVE_ISO','FUTURE_ISO','seededRng','shuffleWithSeed','stateKey','loadState','saveState','getWeekKey','getOpts']){
    assert.ok(before.has(name),name);assert.equal(after.get(name),before.get(name),name);
  }
});
test('todos los mensajes referenciados por el código generado existen en la fuente',()=>{
  const keys=[...compiled.matchAll(/L10N\.(?:raw|htmlText)\("(msg_[a-f0-9]+)"/g)].map(match=>match[1]);
  assert.ok(keys.length>300);
  for(const key of keys)assert.ok(Object.hasOwn(sourceCatalog.ui,key),key);
});
test('la caché de prueba incluye el arranque y los seis catálogos',()=>{
  const sw=fs.readFileSync(path.join(root,'preview/sw.js'),'utf8');
  for(const asset of ['app.js','runtime.js','game-boot.js','es.json','en.json','fr.json','de.json','pt-BR.json','pt-PT.json'])assert.ok(sw.includes(asset),asset);
  assert.ok(sw.includes('offlineMessage(request)'));
  assert.ok(sw.includes('n.startsWith("comidadle-preview-")'));
});
test('el selector de idiomas forma parte de la versión de prueba y deja intacta la pública',()=>{
  const preview=fs.readFileSync(path.join(root,'preview/index.html'),'utf8');
  assert.ok(preview.includes('id="language-select"'));
  assert.ok(!html.includes('id="language-select"'));
  assert.ok(!html.includes('game-boot.js'));
});
test('el HTML estático solo deja sin enlazar marcas y los controles gestionados por el arranque',async()=>{
  const {parse}=await import('parse5');
  const tree=parse(fs.readFileSync(path.join(root,'preview/index.html'),'utf8'));
  const allowed=new Set(['🌶️ Comidadle','Comidadle','Idioma / Language','El cambio recarga la página. Tu progreso diario se conserva.','Anas','TikTok','🌶️ Comida','dle','ℹ️ Info','@aanxs404']);
  const missing=[];
  function visit(node){
    if(['script','style','svg','noscript'].includes(node.tagName))return;
    if(node.nodeName==='#text'&&/[a-záéíóúñ]{2}/i.test(node.value)&&node.parentNode?.tagName){
      const parent=node.parentNode,index=parent.childNodes.indexOf(node),attrs=parent.attrs||[];
      if(!attrs.some(attr=>attr.name==='data-l10n-node-'+index||attr.name==='data-i18n')&&!allowed.has(node.value.trim()))missing.push(node.value.trim());
    }
    for(const child of node.childNodes||[])visit(child);
  }
  visit(tree);assert.deepEqual(missing,[]);
});
