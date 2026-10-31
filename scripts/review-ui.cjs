const fs=require('node:fs'),path=require('node:path');
const overrides=require('../i18n/ui-overrides.cjs');
const additional=require('../i18n/game-messages.cjs');
const directory=path.join(__dirname,'../locales/catalogs');
const source=JSON.parse(fs.readFileSync(path.join(directory,'es.json'),'utf8'));
const locales=['en','fr','de','pt-BR','pt-PT'];
const overrideLookup=Object.fromEntries(Object.entries(overrides).map(([key,value])=>[key.toLocaleLowerCase('es'),value]));
for(const [index,locale] of locales.entries()){
  if(process.argv.length>2&&!process.argv.slice(2).includes(locale))continue;
  const file=path.join(directory,locale+'.json'),catalog=JSON.parse(fs.readFileSync(file,'utf8'));
  let reviewed=0;
  const aliases=new Map(Object.entries(source.ui).filter(([key,value])=>!key.startsWith('msg_')&&typeof value==='string').map(([key,value])=>[value,key]));
  for(const [key,original] of Object.entries(source.ui)){
    if(typeof original!=='string')continue;
    const alias=aliases.get(original);
    if(alias&&catalog.ui[alias])catalog.ui[key]=catalog.ui[alias];
    let translated=catalog.ui[key];if(typeof translated!=='string')continue;
    if(/duelos?/i.test(original)){
      const patterns={en:[[/\bmourning\b/gi,'duel'],[/\bgrief\b/gi,'duel']],fr:[[/\bdeuils\b/gi,'duels'],[/\bdeuil\b/gi,'duel']],de:[[/\bTrauer\b/g,'Duell']], 'pt-BR':[[/\blutos\b/gi,'duelos'],[/\bluto\b/gi,'duelo']], 'pt-PT':[[/\blutos\b/gi,'duelos'],[/\bluto\b/gi,'duelo']]};
      for(const [pattern,value] of patterns[locale])translated=translated.replace(pattern,value);
    }
    if(/platos?/i.test(original)){
      const patterns={en:[[/\bplates\b/g,'dishes'],[/\bplate\b/g,'dish']],fr:[[/\bassiettes\b/g,'plats'],[/\bassiette\b/g,'plat']],de:[[/\bTeller\b/g,'Gerichte']], 'pt-BR':[], 'pt-PT':[]};
      for(const [pattern,value] of patterns[locale])translated=translated.replace(pattern,value);
    }
    if(/rachas?/i.test(original)){
      const patterns={en:[[/\bgusts\b/g,'streaks'],[/\bgust\b/g,'streak']],fr:[[/\brafales\b/g,'séries'],[/\brafale\b/g,'série']],de:[[/\bBöen\b/g,'Serien'],[/\bBöe\b/g,'Serie']], 'pt-BR':[[/\brajadas\b/g,'sequências'],[/\brajada\b/g,'sequência']], 'pt-PT':[[/\brajadas\b/g,'sequências'],[/\brajada\b/g,'sequência']]};
      for(const [pattern,value] of patterns[locale])translated=translated.replace(pattern,value);
    }
    const direct=overrides[original]||overrideLookup[original.toLocaleLowerCase('es')];
    const prefix=original.match(/^[^\p{L}\p{N}¿¡{]+/u)?.[0]||'';
    const plain=original.slice(prefix.length);
    if(direct){translated=direct[index];reviewed++;}
    else if(overrideLookup[plain.toLocaleLowerCase('es')]){translated=prefix+overrideLookup[plain.toLocaleLowerCase('es')][index];reviewed++;}
    catalog.ui[key]=translated;
  }
  Object.assign(catalog.ui,additional[locale]);
  catalog.review={...(catalog.review||{}),controlsReviewed:true,manualControlOverrides:reviewed,fullEditorialReview:false};
  fs.writeFileSync(file,JSON.stringify(catalog,null,2)+'\n');
  console.log(`${locale}: ${reviewed} redacciones de controles aplicadas; revisión editorial completa pendiente.`);
}
