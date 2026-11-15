const {chromium}=require('@playwright/test');
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const sdk='window.supabase={createClient(){return {auth:{onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},getSession:async()=>({data:{session:null}}),signOut:async()=>({error:null})}}}};';
(async()=>{
  const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':file.endsWith('.js')?'application/javascript':file.endsWith('.json')?'application/json':'text/html; charset=utf-8'});res.end(data);}catch(_){res.writeHead(404).end();}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
  try{
    browser=await chromium.launch({channel:'chrome',headless:true});
    for(const locale of ['es','en','fr','de','pt-BR','pt-PT'])for(const width of [390,1280]){
      const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),errors=[],writes=[];
      await context.addInitScript(locale=>{if(!localStorage.getItem('comidadle_preview_lang'))localStorage.setItem('comidadle_preview_lang',locale);},locale);
      await context.route('https://**/*',route=>{
        const r=route.request();if(r.url().includes('supabase.min.js'))return route.fulfill({contentType:'application/javascript',body:sdk});
        if(r.url().includes('.supabase.co/')&&!['GET','OPTIONS','HEAD'].includes(r.method()))writes.push(r.url());
        return route.fulfill({contentType:'application/json',body:'[]'});
      });
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
      const url='http://127.0.0.1:'+server.address().port+'/preview/index.html';
      const ready=()=>page.waitForFunction(()=>typeof logOut==='function'&&document.getElementById('preview-demo-button'));
      await page.goto(url);await ready();await page.locator('#preview-demo-button').click();
      const before=await page.evaluate(()=>{closeModal('how-modal');return {xp:totalXP,state:JSON.stringify(loadState(currentDish)),language:localStorage.getItem('comidadle_preview_lang')};});
      await page.reload();await ready();assert.equal(await page.evaluate(()=>myUser),'Demo_01a190aa');
      await page.evaluate(()=>{closeModal('how-modal');openModal('cfg-modal');});
      await Promise.all([page.waitForEvent('load'),page.locator('button[onclick*="logOut()"]').click()]);await ready();
      await page.locator('#login-overlay').waitFor({state:'visible'});
      const after=await page.evaluate(()=>({flag:localStorage.getItem('comidadle_preview_demo'),user:myUser,xp:totalXP,state:JSON.stringify(loadState(currentDish)),language:localStorage.getItem('comidadle_preview_lang')}));
      assert.equal(after.flag,null);assert.equal(after.user,'');assert.equal(after.xp,before.xp);assert.equal(after.state,before.state);assert.equal(after.language,before.language);
      await page.reload();await ready();await page.locator('#login-overlay').waitFor({state:'visible'});
      await page.locator('#auth-state-home button[onclick*="register"]').click();await page.locator('#reg-email').waitFor({state:'visible'});
      await page.evaluate(()=>showLoginState('home'));await page.locator('#auth-state-home button[onclick*="login"]').click();await page.locator('#login-email').waitFor({state:'visible'});
      if(locale==='fr'&&width===390)await page.screenshot({path:'.translation-cache/logout-fr-mobile.png',animations:'disabled'});
      await page.locator('#preview-demo-button').click();assert.equal(await page.evaluate(()=>myUser),'Demo_01a190aa');
      await page.goto(url+'?login=1');await ready();await page.locator('#login-overlay').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>localStorage.getItem('comidadle_preview_demo')),null);assert.ok(!page.url().includes('login=1'));
      assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);await context.close();console.log(locale+' '+width+': salir de demo, recargar, formularios de cuenta, enlace de acceso y progreso conservado.');
    }
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
