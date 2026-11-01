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
      const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),errors=[],writes=[];
      await context.addInitScript(locale=>localStorage.setItem('comidadle_preview_lang',locale),locale);
      await context.route('https://**/*',route=>{
        const r=route.request();if(r.url().includes('supabase.min.js'))return route.fulfill({contentType:'application/javascript',body:sdk});
        if(r.url().includes('.supabase.co/')&&!['GET','OPTIONS','HEAD'].includes(r.method()))writes.push(r.url());
        return route.fulfill({contentType:'application/json',body:'[]'});
      });
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:'+server.address().port+'/preview/index.html');await page.waitForFunction(()=>typeof renderChangelog==='function'&&window.ComidadleLocalization);await page.locator('#preview-demo-button').click();
      for(const width of [390,1280]){
        await page.setViewportSize({width,height:900});
        const result=await page.evaluate(async()=>{
          closeModal('how-modal');await openRanking();
          const global={selects:document.querySelectorAll('#ranking-modal select').length,identity:document.getElementById('ranking-username-section').textContent,personal:!!document.getElementById('my-country-select')};
          closeModal('ranking-modal');await openWeekly();
          const weeklySelects=document.querySelectorAll('#weekly-modal select').length;closeModal('weekly-modal');
          renderChangelog();openModal('changelog-modal');
          const lists=[...document.querySelectorAll('#changelog-content ul')],rows=[...CHANGELOG].reverse();
          return {global,weeklySelects,versions:lists.length,expectedVersions:rows.length,changes:lists.flatMap((list,i)=>[...list.children].map((li,j)=>({source:rows[i].changes[j],text:li.textContent}))),dates:[...document.querySelectorAll('#changelog-content>div')].map((el,i)=>({text:el.firstElementChild.lastElementChild.textContent,expected:ComidadleLocalization.changelogDate(rows[i].date)})),overflow:document.documentElement.scrollWidth>innerWidth};
        });
        assert.equal(result.global.personal,false);assert.equal(result.global.selects,1);assert.equal(result.weeklySelects,1);assert.ok(result.global.identity.includes('Demo_01a190aa'));assert.equal(result.versions,result.expectedVersions);assert.equal(result.overflow,false);
        for(const row of result.dates)assert.equal(row.text,row.expected);
        if(locale!=='es')assert.deepEqual(result.changes.filter(row=>row.text===row.source),[],'Entrada sin traducir');
        if(locale==='fr')assert.ok(!result.changes.some(row=>/Edge-Fit|handicapées|remède|lecteur|Change name|Antropique/.test(row.text)));
        await page.evaluate(()=>closeModal('changelog-modal'));
      }
      const dishes=await page.evaluate(()=>{
        cfg.progressive=false;cfg.noDesc=false;cfg.noHints=false;cfg.soundOn=false;cfg.hapticsOn=false;
        return ['Pastelón de Plátano','Humita en Olla','Caldo de Costilla Bogotano','Tacu Tacu de Frijoles'].map(name=>{
          infDish=ALL_DISHES.find(d=>d.name===name);renderInfiniteGame();
          const card=document.querySelector('#infinite-modal .dish-card'),subtitle=card.querySelector('.dish-name-translation');
          const hiddenBefore=card.querySelectorAll('.geography-blur').length;
          [...document.querySelectorAll('#infinite-modal .country-btn')].find(button=>button.dataset.c===infDish.country).click();
          return {name,subtitle:subtitle?.textContent,explanation:subtitle?.dataset.explanation,hiddenBefore,hiddenAfter:document.querySelectorAll('#infinite-modal .geography-blur').length};
        });
      });
      if(locale!=='es')for(const d of dishes){assert.ok(d.subtitle,d.name);assert.ok(!d.explanation,d.name);assert.ok(!/Lit bébé|Cotinha|Bogotano.Cot|Pâteau|Humita (en|in|em) Olla/.test(d.subtitle),d.subtitle);}
      assert.ok(dishes.find(d=>d.name==='Caldo de Costilla Bogotano').hiddenBefore>0);
      for(const d of dishes)assert.equal(d.hiddenAfter,0);
      if(locale==='fr'){await page.evaluate(()=>{renderChangelog();openModal('changelog-modal');});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.translation-cache/changelog-fr-mobile.png',animations:'disabled'});}
      assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);console.log(locale+': ranking global/semanal, historial completo, fechas y cuatro platos revisados, móvil y PC correctos.');await context.close();
    }
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
