const {chromium}=require('@playwright/test');
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
  const server=http.createServer(async(req,res)=>{
    try{
      let pathname=new URL(req.url,'http://localhost').pathname;if(pathname.endsWith('/'))pathname+='index.html';
      const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
      let content=await fs.readFile(file);
      // Las dependencias CDN son opcionales; esta prueba aísla los archivos locales del juego.
      if(file.endsWith(path.join('preview','sw.js')))content=Buffer.from(content.toString().replace(/const CDN_ASSETS\s*=\s*\[[\s\S]*?\];/,'const CDN_ASSETS = [];'));
      res.writeHead(200,{'Content-Type':file.endsWith('.js')?'application/javascript':file.endsWith('.json')?'application/json':'text/html; charset=utf-8','Cache-Control':'no-cache'});res.end(content);
    }catch(_){res.writeHead(404).end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
  try{
    browser=await chromium.launch({channel:'chrome',headless:true});
    const context=await browser.newContext({viewport:{width:390,height:844}});
    await context.route('https://**/*',route=>route.abort());
    await context.addInitScript(()=>{if(!localStorage.getItem('comidadle_preview_lang'))localStorage.setItem('comidadle_preview_lang','en');});
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/preview/index.html');
    await page.waitForFunction(()=>typeof renderAll==='function'&&document.getElementById('preview-demo-button'));
    await page.evaluate(async()=>{await caches.open('comidadle-public-sentinel');await navigator.serviceWorker.ready;});
    await page.waitForFunction(()=>navigator.serviceWorker.controller);
    await page.locator('#preview-demo-button').click();await page.evaluate(()=>closeModal('how-modal'));
    const inventory=await page.evaluate(()=>new Promise(async resolve=>{await openShop();resolve(myInventory.length);}));
    assert.equal(inventory,22);
    await page.evaluate(()=>closeModal('shop-modal'));
    const country=await page.evaluate(()=>dish.country),options=await page.evaluate(()=>getOpts());
    await page.locator('#grid .country-btn').nth(options.indexOf(country)).click();
    const xp=await page.evaluate(()=>totalXP);
    await context.setOffline(true);await page.reload();
    await page.waitForFunction(()=>window.ComidadleLocalization?.locale==='en'&&typeof renderAll==='function');
    assert.equal(await page.evaluate(()=>done),true);assert.equal(await page.evaluate(()=>totalXP),xp);
    assert.equal(await page.evaluate(()=>document.getElementById('login-overlay').style.display),'none');
    assert.ok(await page.locator('#offline-banner').innerText());
    const keys=await page.evaluate(()=>caches.keys());assert.ok(keys.includes('comidadle-public-sentinel'));
    const languages=await page.evaluate(async()=>{
      const names=await caches.keys(),cache=await caches.open(names.find(name=>name.startsWith('comidadle-preview-')));
      const entries=await cache.keys();return ['es','en','fr','de','pt-BR','pt-PT'].map(locale=>entries.some(request=>new URL(request.url).pathname.endsWith('/locales/catalogs/'+locale+'.json')));
    });
    assert.ok(languages.every(Boolean));assert.deepEqual(errors,[]);
    console.log('Sin conexión: arranque completo, seis catálogos guardados, demostración restaurada, partida y XP intactos, caché pública conservada.');
    await context.close();
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
