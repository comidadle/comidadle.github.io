(async function(){
  'use strict';
  const {I18n,LOCALES,normalizeLocale,escapeHtml}=window.ComidadleI18n;
  const isPreview=location.pathname.includes('/preview/');
  let demoActive=false;
  let demoInventory=[];
  if(isPreview){
    const realFetch=window.fetch.bind(window);
    window.fetch=async(input,options={})=>{
      options=options||{};
      const url=new URL(typeof input==='string'||input instanceof URL?String(input):input.url,location.href);
      const method=String(options.method||input.method||'GET').toUpperCase();
      if(url.hostname.endsWith('.supabase.co')){
        const mutating=!['GET','HEAD','OPTIONS'].includes(method);
        const safeLogin=url.pathname==='/auth/v1/token'||url.pathname==='/rest/v1/rpc/email_for_username';
        if(url.pathname==='/auth/v1/logout')return new Response('{}',{status:200,headers:{'Content-Type':'application/json'}});
        if(mutating&&!safeLogin)return new Response(JSON.stringify({error:'preview_read_only'}),{status:409,headers:{'Content-Type':'application/json'}});
        const publicTables=['ranking','weekly_ranking','shop_items','reviews','review_replies','announcements','announcement_reactions'];
        const table=url.pathname.split('/')[3];
        if(demoActive&&table==='user_inventory'&&method==='GET')return new Response(JSON.stringify(demoInventory),{status:200,headers:{'Content-Type':'application/json'}});
        if(demoActive&&url.pathname.startsWith('/rest/v1/')&&!publicTables.includes(table))return new Response('[]',{status:200,headers:{'Content-Type':'application/json'}});
      }
      return realFetch(input,options);
    };
  }
  const loading=document.createElement('div');loading.setAttribute('role','status');loading.textContent='Comidadle…';loading.style.cssText='position:fixed;inset:0;z-index:10000;background:#100900;color:#fff3e0;display:grid;place-items:center;font:20px system-ui';document.body.append(loading);
  const fetchCatalog=async locale=>{
    const response=await fetch('../locales/catalogs/'+encodeURIComponent(locale)+'.json');
    if(!response.ok)throw Error('No se pudo cargar el idioma.');return response.json();
  };
  try{
    const source=await fetchCatalog('es'),engine=new I18n(source,{fetchCatalog,preview:true});
    demoInventory=(source.publicShop||[]).map(item=>({item_id:item.id}));
    let selected='es';try{selected=normalizeLocale(localStorage.getItem('comidadle_preview_lang')||localStorage.getItem('comidadle_lang'));}catch(_){}
    try{await engine.setLocale(selected);}catch(_){await engine.setLocale('es');}
    const bindings=[];
    for(const element of document.querySelectorAll('*')){
      for(const attr of element.attributes){
        if(attr.name.startsWith('data-l10n-node-')){
          const node=element.childNodes[Number(attr.name.slice(15))];
          if(node?.nodeType===Node.TEXT_NODE){const text=node.nodeValue;bindings.push({node,key:attr.value,before:text.match(/^\s*/)[0],after:text.match(/\s*$/)[0]});}
        }
        if(attr.name.startsWith('data-l10n-attr-'))bindings.push({element,attribute:attr.name.slice(15),key:attr.value});
      }
    }
    const dishLookup=new Map();
    for(const [id,dish] of Object.entries(source.dishes)){
      dishLookup.set(dish.name,{id,field:'name'});dishLookup.set(dish.desc,{id,field:'desc'});
      dish.hints.forEach((hint,index)=>dishLookup.set(hint,{id,field:'hints',index}));
    }
    const normalize=text=>text.replace(/\s+/g,' ').trim();
    const lookup=Object.assign(Object.create(null),source.lookup);
    for(const [key,text] of Object.entries(source.ui))if(typeof text==='string')lookup[normalize(text)]=key;
    const patterns=Object.entries(source.ui).filter(([,value])=>typeof value==='string'&&/\{p\d+\}/.test(value)&&value.replace(/\{p\d+\}/g,'').length>=8).map(([key,value])=>{
      const names=[];let at=0,pattern='^';
      for(const match of value.matchAll(/\{(p\d+)\}/g)){pattern+=value.slice(at,match.index).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(.+?)';names.push(match[1]);at=match.index+match[0].length;}
      pattern+=value.slice(at).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$';return {key,names,regex:new RegExp(pattern),specificity:value.replace(/\{p\d+\}/g,'').length};
    }).sort((a,b)=>b.specificity-a.specificity);
    const format=value=>typeof value==='number'?new Intl.NumberFormat(engine.locale,{maximumFractionDigits:12}).format(value):String(value??'');
    const localization={
      get locale(){return engine.locale;},
      text:(key,vars={})=>engine.text(key,vars),
      raw(key,vars={}){return this.text(key,vars);},
      htmlText(key,vars={}){
        return escapeHtml(engine.pattern(key,vars)).replace(/\{(\w+)\}/g,(match,name)=>Object.hasOwn(vars,name)?format(vars[name]):match);
      },
      display(value){
        if(typeof value!=='string')return value;
        if(source.flags?.[value])return this.country(value);
        const dish=dishLookup.get(value);
        if(dish){const view=engine.dish(dish.id);return dish.field==='hints'?view.hints[dish.index]:view[dish.field];}
        const clean=normalize(value),key=lookup[clean];if(key)return engine.text(key);
        for(const pattern of patterns){const match=pattern.regex.exec(clean);if(match){const vars=Object.fromEntries(pattern.names.map((name,index)=>[name,/^-?\d+(?:\.\d+)?$/.test(match[index+1])?Number(match[index+1]):match[index+1]]));return engine.text(pattern.key,vars);}}
        return value;
      },
      decorateDishNames(){
        for(const element of document.querySelectorAll('.dish-name')){
          element.querySelector('.dish-name-translation')?.remove();
          const native=element.textContent.trim(),entry=dishLookup.get(native);
          if(!entry||entry.field!=='name'||engine.locale==='es')continue;
          const translated=engine.dish(entry.id).displayName;
          const same=text=>text.normalize('NFKC').toLocaleLowerCase(engine.locale).replace(/[\s\p{P}]+/gu,'');
          if(!translated||same(translated)===same(native))continue;
          const label=document.createElement('span');label.className='dish-name-translation';label.lang=engine.locale;
          label.style.cssText='display:block;font:600 13px/1.5 system-ui;color:var(--text-muted);margin-top:5px;overflow-wrap:anywhere';
          label.textContent=translated;
          if(element.querySelector('span[style*="blur"]')){
            const [kind,index]=entry.id.split(':'),dish=kind==='regular'?ALL_DISHES[Number(index)]:SUNDAY_INTERNATIONAL_DISHES[Number(index)];
            const countryPattern=buildBlurRegex(dish.country),pattern=new RegExp('(?:'+countryPattern.source+')[\\p{L}]*','giu');
            label.innerHTML=escapeHtml(translated).replace(pattern,match=>'<span style="filter:blur(5px);user-select:none">'+match+'</span>');
          }
          element.append(label);
        }
      },
      country(value){
        const code=source.flags?.[value];if(!code)return value;
        try{return new Intl.DisplayNames([engine.locale],{type:'region'}).of(code)||value;}catch(_){return value;}
      },
      compareCountries(a,b){return new Intl.Collator(engine.locale).compare(this.country(a),this.country(b));},
      countryTerms(country,original){
        const terms=[...original,this.country(country),...original.map(term=>this.display(term))];
        const code=source.flags?.[country];
        if(code)for(const locale of Object.keys(LOCALES))terms.push(new Intl.DisplayNames([locale],{type:'region'}).of(code));
        return [...new Set(terms.filter(Boolean))];
      },
      date:(value,options)=>engine.date(value,options),
      number:(value,options)=>engine.number(value,options),
      ordinal(value){
        if(engine.locale==='de')return value+'.';
        if(engine.locale==='fr')return value+(value===1?'er':'e');
        if(engine.locale==='en'){const category=new Intl.PluralRules('en',{type:'ordinal'}).select(value);return value+({one:'st',two:'nd',few:'rd',other:'th'}[category]);}
        return value+'º';
      },
      month(value){
        const index=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'].indexOf(value);
        return index<0?value:engine.date(new Date(2020,index,1),{month:'short'});
      },
      relativeDate(value){
        const minutes=Math.max(0,Math.floor((Date.now()-new Date(value))/60000));
        const [amount,unit]=minutes<60?[minutes,'minute']:minutes<1440?[Math.floor(minutes/60),'hour']:[Math.floor(minutes/1440),'day'];
        return new Intl.RelativeTimeFormat(engine.locale,{numeric:'auto'}).format(-amount,unit);
      },
      applyStatic(){
        document.documentElement.lang=engine.locale;
        for(const binding of bindings){
          if(binding.node?.isConnected)binding.node.nodeValue=binding.before+engine.text(binding.key)+binding.after;
          if(binding.element?.isConnected)binding.element.setAttribute(binding.attribute,engine.text(binding.key));
        }
        for(const element of document.querySelectorAll('[data-i18n]'))element.innerHTML=engine.richText(element.dataset.i18n);
      },
      changeLanguage(locale){
        locale=normalizeLocale(locale);if(locale===engine.locale)return;
        try{localStorage.setItem('comidadle_preview_lang',locale);}catch(_){return;}
        location.reload();
      },
    };
    window.ComidadleLocalization=localization;
    localization.applyStatic();
    const select=document.getElementById('language-select');
    if(select){
      const label=document.querySelector('label[for="language-select"]');if(label)label.textContent=localization.display('Idioma');
      document.getElementById('language-notice').textContent=localization.display('El cambio recarga la página. Tu progreso diario se conserva.');
      for(const [locale,name] of Object.entries(LOCALES)){const option=document.createElement('option');option.value=locale;option.textContent=name;select.append(option);}
      select.value=engine.locale;select.addEventListener('change',()=>localization.changeLanguage(select.value));
      const login=document.getElementById('login-overlay');
      if(login){
        const label=document.createElement('label');label.htmlFor='login-language';label.textContent='🌐 '+localization.display('Idioma');
        label.style.cssText='position:absolute;top:12px;right:12px;display:flex;align-items:center;gap:8px;font:14px system-ui;color:var(--text-muted)';
        const loginSelect=select.cloneNode(true);loginSelect.id='login-language';loginSelect.removeAttribute('aria-describedby');loginSelect.style.cssText='font:16px system-ui;width:185px;max-width:60vw;padding:8px;background:var(--surface2);color:var(--text);border:1px solid var(--border-strong);border-radius:8px';
        loginSelect.value=engine.locale;loginSelect.addEventListener('change',()=>localization.changeLanguage(loginSelect.value));label.append(loginSelect);login.append(label);
      }
    }
    const previewText={
      es:['Versión de prueba: tu cuenta real no se modifica.','Probar sin cuenta (demostración)'],
      en:['Preview: your real account will not be changed.','Try without an account (demo)'],
      fr:['Version de test : votre compte réel ne sera pas modifié.','Essayer sans compte (démonstration)'],
      de:['Testversion: Dein echtes Konto wird nicht verändert.','Ohne Konto ausprobieren (Demo)'],
      'pt-BR':['Versão de teste: sua conta real não será alterada.','Testar sem conta (demonstração)'],
      'pt-PT':['Versão de teste: a tua conta real não será alterada.','Experimentar sem conta (demonstração)'],
    };
    const script=document.createElement('script');script.src='app.js';script.onload=()=>{
      localization.decorateDishNames();
      localization.applyStatic();loading.remove();
      if(isPreview){
        const text=previewText[engine.locale],notice=document.createElement('div');notice.id='preview-notice';notice.textContent=text[0];notice.style.cssText='width:100%;text-align:center;padding:8px 12px;background:#251a0d;border-bottom:1px solid #ffb627;color:#ffcf69;font:12px/1.4 system-ui';document.body.prepend(notice);
        const button=document.createElement('button');button.id='preview-demo-button';button.type='button';button.className='play-btn';button.textContent=text[1];
        const startDemo=()=>{
          demoActive=true;isGuest=false;myUser='Demo_01a190aa';myId='00000000-0000-0000-0000-000001a190aa';
          try{if(localStorage.getItem('comidadle_preview_demo')!=='1'){totalXP=1000;localStorage.setItem(XPK,'1000');}localStorage.setItem('comidadle_preview_demo','1');}catch(_){}
          const overlay=document.getElementById('login-overlay');if(overlay)overlay.style.display='none';
          applyGuestLocks();updateMiniAvatar();renderAll();
        };
        const authNotice=document.createElement('p');authNotice.textContent=text[0];authNotice.style.cssText='font:12px/1.5 system-ui;color:var(--text-muted);text-align:center;margin-top:16px';
        button.addEventListener('click',startDemo);document.querySelector('#login-overlay>div')?.append(authNotice,button);
        try{if(localStorage.getItem('comidadle_preview_demo')==='1'&&!_sbSession)startDemo();}catch(_){}
        if(sbClient)sbClient.auth.onAuthStateChange((_event,session)=>{if(session){demoActive=false;try{localStorage.removeItem('comidadle_preview_demo');}catch(_){}}});
      }
    };script.onerror=()=>{loading.textContent='No se pudo cargar Comidadle. Recarga la página.';};document.body.append(script);
  }catch(error){loading.textContent='No se pudo preparar el juego. Recarga la página con conexión.';console.error(error);}
})();
