const {chromium}=require('@playwright/test');
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
// SDK simulado que usa fetch de la página: las solicitudes atraviesan la protección real de la demo.
const sdk=`window.supabase={createClient(url,key){let listeners=[];const session=()=>JSON.parse(sessionStorage.getItem('fixture-session')||'null');const call=async(path,body)=>{const response=await fetch(url+path,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)return {data:null,error:{message:data.msg||'fixture_error'}};if(data.session){sessionStorage.setItem('fixture-session',JSON.stringify(data.session));for(const listener of listeners)listener('SIGNED_IN',data.session);}return {data,error:null};};return {auth:{onAuthStateChange(fn){listeners.push(fn);return {data:{subscription:{unsubscribe(){}}}}},getSession:async()=>({data:{session:session()}}),signOut:async()=>{sessionStorage.removeItem('fixture-session');for(const fn of listeners)fn('SIGNED_OUT',null);return {error:null};},signUp:body=>call('/auth/v1/signup',body),resend:body=>call('/auth/v1/resend',body),signInWithPassword:body=>call('/auth/v1/token?grant_type=password',body)}}}};`;
(async()=>{
  const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':file.endsWith('.js')?'application/javascript':file.endsWith('.json')?'application/json':'text/html; charset=utf-8'});res.end(data);}catch(_){res.writeHead(404).end();}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
  try{
    browser=await chromium.launch({channel:'chrome',headless:true});
    for(const [index,locale] of ['es','en','fr','de','pt-BR','pt-PT'].entries()){
      const confirm=index%2===0,context=await browser.newContext({viewport:{width:confirm?390:1280,height:900},serviceWorkers:'block'}),errors=[],requests=[],writes=[];let rejectSignup=true;
      const user={id:'00000000-0000-4000-8000-000000000123',user_metadata:{username:'RegistroFixture'}},session={access_token:'fixture-user-jwt',user};
      await context.addInitScript(locale=>localStorage.setItem('comidadle_preview_lang',locale),locale);
      await context.route('https://**/*',route=>{
        const r=route.request(),u=new URL(r.url());if(r.url().includes('supabase.min.js'))return route.fulfill({contentType:'application/javascript',body:sdk});
        const reply=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
        if(u.hostname.endsWith('.supabase.co')){
          if(!['GET','HEAD','OPTIONS'].includes(r.method()))requests.push({path:u.pathname,method:r.method(),body:r.postDataJSON(),authorization:r.headers().authorization});
          if(u.pathname==='/auth/v1/signup')return reply(rejectSignup?{msg:'User already registered'}:{user,session:confirm?null:session},rejectSignup?400:200);
          if(u.pathname==='/auth/v1/resend')return reply({});
          if(u.pathname==='/auth/v1/token')return reply({user,session});
          if(u.pathname==='/functions/v1/dish-recipe')return reply({text:'Recipe fixture with estimated ingredient cost.'});
          if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(u.pathname);return reply([]);
        }
        return reply([]);
      });
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));const ready=()=>page.waitForFunction(()=>typeof registerWithEmail==='function'&&document.getElementById('preview-demo-button'));
      await page.goto('http://127.0.0.1:'+server.address().port+'/preview/index.html?login=1');await ready();await page.locator('#auth-state-home button[onclick*="register"]').click();
      await page.locator('#reg-username').fill(user.user_metadata.username);await page.locator('#reg-email').fill('signup-fixture@example.invalid');await page.locator('#reg-password').fill('fixture-password');await page.locator('#reg-password2').fill('fixture-password');await page.locator('#reg-country').selectOption('España');
      await page.evaluate(()=>localStorage.setItem('comidadle_preview_demo','1'));
      await page.locator('#register-submit-btn').click();await page.locator('#register-err').waitFor({state:'visible'});assert.ok(!(await page.locator('#register-submit-btn').isDisabled()));assert.equal(await page.evaluate(()=>localStorage.getItem('comidadle_preview_demo')),null);
      rejectSignup=false;await page.locator('#register-submit-btn').click();
      if(confirm){await page.locator('#auth-state-verify').waitFor({state:'visible'});await page.locator('#verify-resend-btn').click();await page.waitForFunction(()=>!document.getElementById('verify-resend-btn').disabled);await page.locator('#verify-continue-btn').click();assert.ok(requests.some(r=>r.path==='/auth/v1/resend'));}
      await page.locator('#login-overlay').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>myUser),user.user_metadata.username);assert.equal(await page.evaluate(()=>_sbSession.access_token),'fixture-user-jwt');
      await page.evaluate(()=>{localStorage.removeItem(UK);localStorage.removeItem(UDK);});await page.reload();await ready();await page.waitForFunction(()=>myUser==='RegistroFixture');await page.locator('#username-setup-overlay').waitFor({state:'hidden'});
      await page.evaluate(()=>{closeModal('how-modal');passport['España']=['Churros con Chocolate'];openDishRecipe('Churros con Chocolate','España','🍩','🇪🇸');});await page.locator('#recipe-content').getByText('Recipe fixture with estimated ingredient cost.').waitFor();
      assert.equal(requests.find(r=>r.path==='/functions/v1/dish-recipe').authorization,'Bearer fixture-user-jwt');
      const denied=await page.evaluate(async()=>{const sb='https://dacgheuzlhybesnqjqzn.supabase.co';return Promise.all([['/rest/v1/ranking','POST'],['/auth/v1/signup','PUT'],['/auth/v1/user','PUT']].map(async([path,method])=>(await fetch(sb+path,{method,body:'{}'})).status));});assert.deepEqual(denied,[409,409,409]);
      const signup=requests.find(r=>r.path==='/auth/v1/signup');assert.equal(signup.body.options.data.username,user.user_metadata.username);assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);console.log(locale+': registro explícito, error recuperable, '+(confirm?'confirmación y reenvío':'sesión inmediata')+', restauración y receta autenticada; tablas protegidas.');await context.close();
    }
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
