const {chromium}=require('@playwright/test');
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const sdk='window.supabase={createClient(){return {auth:{onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},getSession:async()=>({data:{session:null}}),signOut:async()=>({error:null})}}}};';
(async()=>{
  const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':file.endsWith('.js')?'application/javascript':file.endsWith('.json')?'application/json':'text/html; charset=utf-8'});res.end(data);}catch(_){res.writeHead(404).end();}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
  try{
    browser=await chromium.launch({channel:'chrome',headless:true});
    for(const locale of ['es','en','fr','de','pt-BR','pt-PT']){
      const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});let status=200;const requests=[],writes=[],errors=[];
      await context.addInitScript(locale=>localStorage.setItem('comidadle_preview_lang',locale),locale);
      await context.route('https://**/*',route=>{
        const request=route.request(),url=request.url();if(url.includes('supabase.min.js'))return route.fulfill({contentType:'application/javascript',body:sdk});
        if(url.includes('/functions/v1/dish-recipe')){requests.push(request.postDataJSON());return route.fulfill({status,contentType:'application/json',body:JSON.stringify(status===200?{text:'Recipe fixture\n4 portions\nEstimated ingredient cost: 12–16 EUR total; 3–4 EUR per serving.',language:locale}:{error:'fixture'})});}
        if(url.includes('.supabase.co/')&&!['GET','OPTIONS','HEAD'].includes(request.method()))writes.push(url);
        return route.fulfill({contentType:'application/json',body:'[]'});
      });
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:'+server.address().port+'/preview/index.html');await page.waitForFunction(()=>typeof openPassportCountry==='function'&&window.ComidadleLocalization);
      await page.locator('#preview-demo-button').click();
      await page.evaluate(()=>{closeModal('how-modal');passport['España']=['Churros con Chocolate','Tortilla Española','Patatas Bravas','Cochinillo Asado'];openPassportModal();});
      await page.locator('#passport-grid button[data-country="España"]').waitFor({state:'visible'});
      const grid=await page.locator('#passport-grid').evaluate(el=>{
        const cards=[...el.children].map(c=>c.getBoundingClientRect()),rows=[...new Map(cards.map(r=>[Math.round(r.top),r])).values()].sort((a,b)=>a.top-b.top);
        return {count:cards.length,gaps:rows.slice(1).map((r,i)=>r.top-rows[i].bottom),text:el.textContent};
      });
      assert.ok(grid.count>60);assert.ok(grid.gaps.every(n=>n>=0&&n<16));
      const countryLabel=await page.evaluate(()=>ComidadleLocalization.country('España'));assert.ok(grid.text.includes(countryLabel));
      await page.locator('#passport-grid [data-country="España"]').click();
      assert.equal(await page.locator('.modal-overlay:not(.hidden)').count(),1);assert.equal(await page.locator('#passport-detail h3').innerText(),countryLabel);
      assert.equal(await page.locator('#passport-detail .passport-dish').count(),4);assert.ok(!await page.locator('#passport-detail').innerText().then(t=>t.includes('????')||t.includes('|')));
      if(locale!=='es')assert.equal(await page.locator('#passport-detail .passport-dish .dish-name-translation').count(),4);
      await page.locator('#passport-detail [data-dish="Churros con Chocolate"]').click();await page.locator('#recipe-content').getByText(/12–16 EUR/).waitFor();
      assert.equal(requests.at(-1).name,'Churros con Chocolate');assert.equal(requests.at(-1).country,'España');assert.equal(requests.at(-1).language,locale);
      for(const code of [401,404]){status=code;await page.evaluate(()=>openDishRecipe('Churros con Chocolate','España','🍩','🇪🇸'));assert.ok(!await page.locator('#recipe-content').innerText().then(t=>t.includes('Recipe fixture')));assert.ok((await page.locator('#recipe-content').innerText()).length>80);}
      await page.evaluate(()=>{closeModal('recipe-modal');renderPassportGrid();openModal('passport-modal');});await page.setViewportSize({width:1280,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      if(locale==='fr'){
        await page.setViewportSize({width:390,height:844});await page.locator('#passport-grid [data-country="España"]').click();await page.waitForTimeout(250);await page.screenshot({path:'.translation-cache/passport-fr-mobile.png',animations:'disabled'});
      }
      assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);console.log(locale+': pasaporte sin huecos, países y platos traducidos, 4 recetas clicables, precio simulado y errores 401/404 correctos.');await context.close();
    }
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
