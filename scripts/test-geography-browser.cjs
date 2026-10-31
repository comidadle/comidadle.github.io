const {chromium}=require('@playwright/test');
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const sdk='window.supabase={createClient(){return {auth:{onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},getSession:async()=>({data:{session:null}}),signOut:async()=>({error:null})}}}};';
(async()=>{
  const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':file.endsWith('.js')?'application/javascript':file.endsWith('.json')?'application/json':'text/html; charset=utf-8'});res.end(data);}catch(_){res.writeHead(404).end();}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
  try{
    browser=await chromium.launch({channel:'chrome',headless:true});
    for(const locale of process.argv[2]?[process.argv[2]]:['es','en','fr','de','pt-BR','pt-PT']){
      const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
      await context.addInitScript(locale=>localStorage.setItem('comidadle_preview_lang',locale),locale);
      await context.route('https://**/*',route=>route.request().url().includes('supabase.min.js')?route.fulfill({contentType:'application/javascript',body:sdk}):route.fulfill({contentType:'application/json',body:'[]'}));
      const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto('http://127.0.0.1:'+server.address().port+'/preview/index.html');
      await page.waitForFunction(()=>window.ComidadleLocalization&&typeof renderAll==='function');
      const catalog=require('../locales/catalogs/'+locale+'.json');
      const report=await page.evaluate(async({locale,catalog})=>{
        enterGuestMode();closeModal('how-modal');cfg.progressive=false;cfg.noDesc=false;cfg.noHints=false;cfg.soundOn=false;cfg.hapticsOn=false;
        const geo=ComidadleGeography.createMatcher({countries:(await fetch('../locales/catalogs/es.json').then(r=>r.json())).flags});
        const visibleLeaks=element=>{
          const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT),leaks=[];
          while(walker.nextNode())if(!walker.currentNode.parentElement.closest('.geography-blur'))leaks.push(...geo.ranges(walker.currentNode.nodeValue).map(x=>x.text));
          return leaks;
        };
        let checked=0,hidden=0;const failures=[];
        const esc=ComidadleI18n.escapeHtml;
        for(const [id,entry] of Object.entries(catalog.dishes)){
          const element=document.createElement('section');
          element.innerHTML='<div class="dish-name">'+esc(entry.name)+'</div><div class="dish-desc">'+esc(entry.desc)+'</div><div class="hints">'+entry.hints.map(h=>'<p>'+esc(h)+'</p>').join('')+'</div>';
          ComidadleLocalization.decorateDishNames(element,false);
          const leaks=visibleLeaks(element);if(leaks.length)failures.push({id,leaks});
          hidden+=element.querySelectorAll('.geography-blur').length;checked++;
          if(element.querySelector('.dish-desc').textContent!==entry.desc)failures.push({id,translation:'La descripción ha cambiado.'});
          if(element.querySelector('.hints').textContent!==entry.hints.join(''))failures.push({id,translation:'Las pistas han cambiado.'});
        }
        // Regresiones de las capturas a través de los renderizadores reales.
        for(const index of [126,677,914]){
          dish=ALL_DISHES[index];done=false;log=[];wrong=new Set();renderAll();
          for(const id of ['dish-name','dish-desc','hints']){const leaks=visibleLeaks(document.getElementById(id));if(leaks.length)failures.push({mode:'daily',index,id,leaks});}
        }
        const realTimeout=window.setTimeout;window.setTimeout=(fn,ms,...args)=>ms===3000?0:realTimeout(fn,ms,...args);
        try{for(const index of [126,677,914]){memDish=ALL_DISHES[index];startMemoryRound();const card=document.querySelector('#memory-modal-content .dish-card');const leaks=visibleLeaks(card);if(leaks.length)failures.push({mode:'memory',index,leaks});if(locale!=='es'&&!card.querySelector('.dish-name-translation'))failures.push({mode:'memory',index,translation:'Falta el subtítulo.'});}}finally{window.setTimeout=realTimeout;}
        // Las regiones se ocultan incluso si el nombre original no contenía país.
        const synthetic=document.createElement('section');synthetic.innerHTML='<div class="dish-desc">Vasco, basque, baskisch, basco, panaméens, Cuba y São Paulo.</div>';
        ComidadleLocalization.decorateDishNames(synthetic,false);if(visibleLeaks(synthetic).length)failures.push({synthetic:visibleLeaks(synthetic)});
        ComidadleLocalization.decorateDishNames(synthetic,true);if(synthetic.querySelector('.geography-blur'))failures.push({reveal:'El texto no se ha revelado.'});
        const flags=[...document.querySelectorAll('#language-select option')].every(option=>/\p{Regional_Indicator}{2}/u.test(option.textContent));
        return {locale,checked,hidden,failures:failures.slice(0,12),flags};
      },{locale,catalog});
      assert.deepEqual(report.failures,[]);assert.equal(report.checked,1154);assert.ok(report.hidden>1000);assert.equal(report.flags,true);assert.deepEqual(errors,[]);
      if(locale==='fr'){
        await page.evaluate(()=>{openModal('memory-modal');const timeout=window.setTimeout;window.setTimeout=(fn,ms,...args)=>ms===3000?0:timeout(fn,ms,...args);memDish=ALL_DISHES[677];startMemoryRound();window.setTimeout=timeout;});
        await page.locator('#memory-modal .dish-name').waitFor({state:'visible'});
        await page.waitForTimeout(250);
        await page.screenshot({path:'.translation-cache/geography-fr-mobile.png',animations:'disabled'});
      }
      console.log(JSON.stringify(report));await context.close();
    }
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
