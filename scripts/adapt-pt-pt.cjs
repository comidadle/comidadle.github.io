// Adaptación regional de una base portuguesa válida. Nunca utiliza la salida defectuosa del token pt_PT.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'locales/catalogs');
const source=JSON.parse(fs.readFileSync(path.join(dir,'es.json'),'utf8'));
const brazil=JSON.parse(fs.readFileSync(path.join(dir,'pt-BR.json'),'utf8'));
const old=JSON.parse(fs.readFileSync(path.join(dir,'pt-PT.json'),'utf8'));
if(brazil.sourceRevision!==source.sourceRevision||Object.keys(brazil.dishes).length!==Object.keys(source.dishes).length)throw Error('Completa primero el catálogo portugués de base.');
const replacements=[
  ['cafés da manhã','pequenos-almoços'],['café da manhã','pequeno-almoço'],['café-da-manhã','pequeno-almoço'],
  ['sucos de fruta','sumos de fruta'],['suco de fruta','sumo de fruta'],['suco de limão','sumo de limão'],['suco','sumo'],['sucos','sumos'],
  ['abacaxis','ananases'],['abacaxi','ananás'],['abobrinhas','curgetes'],['abobrinha','curgete'],['berinjelas','beringelas'],['berinjela','beringela'],
  ['o creme de leite espessa','as natas engrossam'],['creme de leite espessa','as natas engrossam'],['do creme de leite','das natas'],['creme de leite','natas'],['cremes de leite','natas'],['salsinha','salsa'],
  ['alhos-porós','alhos-franceses'],['alho-poró','alho-francês'],['açougues','talhos'],['açougue','talho'],['sorvetes','gelados'],['sorvete','gelado'],
  ['numa geladeira','num frigorífico'],['uma geladeira','um frigorífico'],['na geladeira','no frigorífico'],['da geladeira','do frigorífico'],['a geladeira','o frigorífico'],['geladeira','frigorífico'],['freezer','congelador'],
  ['pimentões','pimentos'],['pimentão','pimento'],['café da manha','pequeno-almoço'],
  ['purê','puré'],['úmidas','húmidas'],['úmidos','húmidos'],['úmida','húmida'],['úmido','húmido'],
  ['icônicas','icónicas'],['icônicos','icónicos'],['icônica','icónica'],['icônico','icónico'],['gênero','género'],['sêmola','sémola'],
  ['usuários','utilizadores'],['usuário','utilizador'],['senhas','palavras-passe'],['senha','palavra-passe'],
  ['arquivos','ficheiros'],['arquivo','ficheiro'],['equipes','equipas'],['equipe','equipa'],['cadastro','registo'],['contato','contacto'],
  ['celulares','telemóveis'],['celular','telemóvel'],['na tela','no ecrã'],['da tela','do ecrã'],['a tela','o ecrã'],['telas','ecrãs'],['tela','ecrã'],
  ['mayonesa','maionese']
];
const uiReplacements=[['compartilhadas','partilhadas'],['compartilhados','partilhados'],['compartilhada','partilhada'],['compartilhado','partilhado'],['compartilhar','partilhar'],['compartilhe','partilha'],['salvas','guardadas'],['salvos','guardados'],['salva','guardada'],['salvo','guardado'],['salvar','guardar'],['salve','guarda']];
const escape=text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function adapt(text,ui=false){
  let result=text;
  for(const [from,to] of [...replacements,...(ui?uiReplacements:[])]){
    const regex=new RegExp('(?<![\\p{L}])'+escape(from)+'(?![\\p{L}])','giu');
    result=result.replace(regex,match=>match===match.toUpperCase()?to.toUpperCase():match[0]===match[0].toUpperCase()?to[0].toUpperCase()+to.slice(1):to);
  }
  return result;
}
function mapValues(value,ui){return typeof value==='string'?adapt(value,ui):Array.isArray(value)?value.map(item=>mapValues(item,ui)):Object.fromEntries(Object.entries(value).map(([key,item])=>[key,mapValues(item,ui)]));}
const target={...old,locale:'pt-PT',sourceRevision:source.sourceRevision,status:'draft',applicationCoverageReviewed:false,generatedWith:'Base portuguesa com adaptação regional para Portugal',generationComplete:true,regionalAdaptation:{sourceLocale:'pt-BR',version:1},ui:{},dishes:{}};
for(const key of Object.keys(source.ui)){
  if(!Object.hasOwn(brazil.ui,key))throw Error('Falta el texto portugués: '+key);
  target.ui[key]=!key.startsWith('msg_')&&old.ui[key]?old.ui[key]:mapValues(brazil.ui[key],true);
}
for(const [id,dish] of Object.entries(source.dishes)){
  const translated=brazil.dishes[id];target.dishes[id]={name:dish.name,desc:adapt(translated.desc),hints:translated.hints.map(hint=>adapt(hint))};
}
target.review={controlsReviewed:false,fullEditorialReview:false,regionalVocabularyAdapted:true};
fs.writeFileSync(path.join(dir,'pt-PT.json'),JSON.stringify(target,null,2)+'\n');
console.log(`pt-PT: ${Object.keys(target.ui).length} textos y ${Object.keys(target.dishes).length} platos adaptados; revisión editorial pendiente.`);
