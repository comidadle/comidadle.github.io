const {test}=require('node:test'),assert=require('node:assert/strict');
const {createMatcher}=require('../i18n/geography.js');
const countries=require('../locales/catalogs/es.json').flags;
const matcher=createMatcher({countries});
test('se ocultan los países y gentilicios de las capturas, incluso con acentos y plurales',()=>{
  for(const text of ['panaméens','panaméennes','Panameñas','panamenho','panamiano','Panamanian','panamaisches','Cuba','cubains','kubanischen','Espagnol','españoles','Spanish','spanisches'])assert.equal(matcher.redact(text),'…',text);
});
test('vasco y sus equivalentes se ocultan en los seis idiomas junto con ciudades y regiones',()=>{
  for(const text of ['vasco','vascas','basque','Basques','baskischen','basco','basca','Euskadi','Bilbao','País Vasco','Pays basque','Baskenland','Oaxaca','Québec','São Paulo','La Habana','Andalousie','La Paz','Arequipa','Viennese','viennois','Wiener','vienense'])assert.equal(matcher.redact(text),'…',text);
});
test('cada país disponible se oculta en sus seis nombres localizados',()=>{
  for(const code of new Set(Object.values(countries)))for(const locale of ['es','en','fr','de','pt-BR','pt-PT']){
    const name=new Intl.DisplayNames([locale],{type:'region'}).of(code);assert.equal(matcher.redact(name),'…',locale+': '+name);
  }
});
test('se cubren gentilicios traducidos que no comparten raíz con el nombre del país',()=>{
  for(const text of ['belge','belges','autrichienne','ägyptischen','grega','alemão','franceses','rusos','polaca','tunesischen','saoudienne','guianense','paquistanês','queniano','dinamarqueses','suíça','Czech','romeno','neuseeländischen','néo-zélandais','Costa Rican','portoricains','sud-africaines','sul-africano','South Korean','südkoreanischen'])assert.equal(matcher.redact(text),'…',text);
});
test('las coordenadas de texto conservan emojis y Unicode fuera del dato oculto',()=>{
  assert.equal(matcher.redact('🍞 Pain panaméen, servi à Cuba.'),'🍞 Pain …, servi à ….');
  assert.equal(matcher.redact('🇪🇸 Café de Perú y São Paulo.'),'🇪🇸 Café de … y ….');
  assert.equal(matcher.redact('paname\u0301ens'),'…');
});
test('no se ocultan ingredientes comunes por coincidir parcialmente con un país',()=>{
  for(const text of ['chile guajillo con tomate','turkey with rice','cubierto de chocolate','arroz con pollo','mantequilla y harina'])assert.equal(matcher.redact(text),text);
});
