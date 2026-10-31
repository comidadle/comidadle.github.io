const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const source=stripTypeScriptTypes(fs.readFileSync(path.join(__dirname,'../supabase/functions/dish-recipe/index.ts'),'utf8').replace(/^import .*;\s*/,''));
function setup(){
  let handler;const calls=[];
  const secrets={SUPABASE_URL:'https://fixture.invalid',SUPABASE_ANON_KEY:'fixture-public',ANTHROPIC_API_KEY:'fixture-private'};
  const context=vm.createContext({Request,Response,AbortSignal,Deno:{env:{get:key=>secrets[key]},serve:fn=>{handler=fn;}},fetch:async(url,options)=>{
    calls.push({url,options});
    return new Response(JSON.stringify(url.includes('/auth/v1/user')?{id:'fixture-user'}:{content:[{type:'text',text:'Recipe fixture'}]}),{status:200,headers:{'Content-Type':'application/json'}});
  }});
  vm.runInContext(source,context);return {handler,calls};
}
test('las seis recetas solicitan el idioma correcto y distinguen las variantes de portugués',async()=>{
  const expected={es:'español',en:'English',fr:'français',de:'Deutsch','pt-BR':'português do Brasil','pt-PT':'português de Portugal'};
  for(const [language,label] of Object.entries(expected)){
    const {handler,calls}=setup();
    const response=await handler(new Request('https://fixture.invalid',{method:'POST',headers:{Authorization:'Bearer fixture-session','Content-Type':'application/json'},body:JSON.stringify({name:'Paella',country:'España',language})}));
    assert.equal(response.status,200);
    const provider=JSON.parse(calls[1].options.body);assert.ok(provider.system.includes(label));
    assert.equal(JSON.parse(provider.messages[0].content).name,'Paella');
    const body=await response.json();assert.equal(body.language,language);assert.ok(!JSON.stringify(body).includes('fixture-private'));
  }
});
test('una receta no llama al proveedor sin sesión o con un idioma no admitido',async()=>{
  const {handler,calls}=setup();
  for(const payload of [{name:'Paella',country:'España',language:'unknown'},{name:'Paella',country:'España',language:'en'}]){
    const response=await handler(new Request('https://fixture.invalid',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}));
    assert.ok([400,401].includes(response.status));
  }
  assert.equal(calls.length,0);
});
