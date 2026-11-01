(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ComidadlePassport=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const locales=['es','en','fr','de','pt-BR','pt-PT'];
  const labels={
    countries:['Países descubiertos','Countries discovered','Pays découverts','Entdeckte Länder','Países descobertos','Países descobertos'],
    discovered:['{n}/{total} platos descubiertos','{n}/{total} dishes discovered','{n}/{total} plats découverts','{n}/{total} Gerichte entdeckt','{n}/{total} pratos descobertos','{n}/{total} pratos descobertos'],
    locked:['Sin descubrir','Not discovered','À découvrir','Noch nicht entdeckt','Não descoberto','Por descobrir'],
    remaining:['{n} platos por descubrir','{n} dishes to discover','{n} plats à découvrir','Noch {n} Gerichte zu entdecken','{n} pratos para descobrir','{n} pratos por descobrir'],
    play:['Acierta más platos para descubrirlos aquí.','Guess more dishes to discover them here.','Trouvez l’origine d’autres plats pour les découvrir ici.','Errate weitere Gerichte, um sie hier zu entdecken.','Acerte mais pratos para descobri-los aqui.','Acerta em mais pratos para os descobrires aqui.'],
    recipe:['Ver receta y precio aproximado','View recipe and estimated cost','Voir la recette et le coût estimé','Rezept und geschätzte Kosten ansehen','Ver receita e custo aproximado','Ver receita e custo aproximado'],
    back:['Volver al pasaporte','Back to passport','Retour au passeport','Zurück zum Pass','Voltar ao passaporte','Voltar ao passaporte'],
    sunday:['Especial de domingo','Sunday special','Spécial du dimanche','Sonntagsspezial','Especial de domingo','Especial de domingo'],
    future:['Todavía no hay platos disponibles de este país.','No dishes from this country are available yet.','Aucun plat de ce pays n’est encore disponible.','Für dieses Land sind noch keine Gerichte verfügbar.','Ainda não há pratos disponíveis deste país.','Ainda não há pratos disponíveis deste país.'],
    loading:['Cargando receta…','Loading recipe…','Chargement de la recette…','Rezept wird geladen…','Carregando receita…','A carregar a receita…'],
    unavailable:['El servicio de recetas todavía no está activado. Tus platos descubiertos siguen guardados.','The recipe service has not been activated yet. Your discovered dishes are still saved.','Le service de recettes n’est pas encore activé. Vos plats découverts restent enregistrés.','Der Rezeptdienst ist noch nicht aktiviert. Deine entdeckten Gerichte bleiben gespeichert.','O serviço de receitas ainda não foi ativado. Seus pratos descobertos continuam salvos.','O serviço de receitas ainda não foi ativado. Os teus pratos descobertos continuam guardados.'],
    signin:['Inicia sesión con tu cuenta para solicitar recetas. El perfil de demostración no tiene una sesión real.','Sign in with your account to request recipes. The demo profile is not a real signed-in session.','Connectez-vous à votre compte pour demander une recette. Le profil de démonstration n’est pas une session réelle.','Melde dich mit deinem Konto an, um Rezepte anzufordern. Das Demoprofil ist keine echte Anmeldung.','Entre na sua conta para solicitar receitas. O perfil de demonstração não é uma sessão real.','Inicia sessão na tua conta para pedir receitas. O perfil de demonstração não é uma sessão real.'],
    failed:['No se pudo cargar la receta.','The recipe could not be loaded.','Impossible de charger la recette.','Das Rezept konnte nicht geladen werden.','Não foi possível carregar a receita.','Não foi possível carregar a receita.'],
    price:['El precio orientativo aparecerá con la receta cuando el servicio esté disponible.','An estimated cost will be included with the recipe when the service is available.','Le coût estimé accompagnera la recette lorsque le service sera disponible.','Geschätzte Kosten werden zusammen mit dem Rezept angezeigt, sobald der Dienst verfügbar ist.','O custo aproximado aparecerá com a receita quando o serviço estiver disponível.','O custo aproximado aparecerá com a receita quando o serviço estiver disponível.'],
    retry:['Reintentar','Retry','Réessayer','Erneut versuchen','Tentar novamente','Tentar novamente']
  };
  function create({locale,state,country,nameLabel,decorate,open,close,requestRecipe}){
    const t=(key,vars={})=>labels[key][locales.indexOf(locale())] .replace(/\{(\w+)\}/g,(m,k)=>Object.hasOwn(vars,k)?new Intl.NumberFormat(locale()).format(vars[k]):m);
    const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
    const flag=iso=>String.fromCodePoint(...[...iso].map(c=>0x1f1e6+c.charCodeAt(0)-65));
    function grid(){
      const s=state(),el=document.getElementById('passport-grid'),progress=document.getElementById('passport-progress');if(!el)return;
      const all=[...s.normal,...s.international],eligible=s.countries.filter(c=>all.some(d=>d.country===c.name)),unlocked=eligible.filter(c=>all.some(d=>d.country===c.name&&(s.progress[c.name]||[]).includes(d.name)));
      progress.replaceChildren(node('strong',new Intl.NumberFormat(locale()).format(unlocked.length)+' / '+eligible.length),node('p',t('countries')));
      progress.style.cssText='text-align:center;margin-bottom:16px';
      el.replaceChildren();el.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));grid-auto-rows:minmax(100px,auto);align-items:stretch;gap:8px;content-visibility:visible';
      for(const entry of s.countries){
        const dishes=all.filter(d=>d.country===entry.name),count=dishes.filter(d=>(s.progress[entry.name]||[]).includes(d.name)).length;
        const button=node('button',undefined,'passport-card'+(count?' unlocked':' locked'));button.type='button';button.dataset.country=entry.name;button.style.minHeight='100px';button.style.caretColor='transparent';
        const emoji=node('span',flag(entry.iso));emoji.style.fontSize='28px';const title=node('span',country(entry.name));title.style.cssText='font-size:12px;font-weight:700;overflow-wrap:anywhere';
        const subtitle=node('small',count?'✅ '+new Intl.NumberFormat(locale()).format(count):dishes.length&&!entry.active?'🌍 '+t('sunday'):'🔒 '+t('locked'));subtitle.style.fontSize='10px';
        button.append(emoji,title,subtitle);
        if(entry.name==='Israel'&&!entry.active){button.disabled=true;subtitle.textContent='#FreeGaza';}
        else button.addEventListener('click',()=>detail(entry.name));el.append(button);
      }
    }
    function detail(canonical){
      const s=state(),entry=s.countries.find(c=>c.name===canonical);if(!entry)return;
      const dishes=[...s.normal,...s.international].filter(d=>d.country===canonical),discovered=dishes.filter(d=>(s.progress[canonical]||[]).includes(d.name));
      const el=document.getElementById('passport-detail');el.replaceChildren();
      const back=node('button','← '+t('back'),'ranking-btn');back.type='button';back.addEventListener('click',()=>{close('passport-country-modal');grid();open('passport-modal');});el.append(back);
      const header=node('div');header.style.cssText='text-align:center;margin:16px 0';const emoji=node('div',flag(entry.iso));emoji.style.fontSize='40px';header.append(emoji,node('h3',country(canonical)),node('p',t('discovered',{n:discovered.length,total:dishes.length})));el.append(header);
      for(const dish of discovered){
        const card=node('button',undefined,'dish-card passport-dish');card.type='button';card.dataset.dish=dish.name;card.style.cssText='display:flex;align-items:center;gap:12px;width:100%;text-align:left;margin-bottom:10px;padding:12px;color:var(--text);font:inherit;cursor:pointer;caret-color:transparent';
        const emoji=node('span',dish.emoji);emoji.style.fontSize='28px';const info=node('div');info.style.minWidth='0';const title=node('div',dish.name,'dish-name');title.style.fontSize='15px';info.append(title,node('small','🍳 '+t('recipe')));card.append(emoji,info);card.addEventListener('click',()=>recipe(dish.name,dish.country,dish.emoji,dish.flag||flag(entry.iso)));el.append(card);decorate(card,true);
      }
      if(discovered.length<dishes.length){const locked=node('details');locked.append(node('summary','🔒 '+t('remaining',{n:dishes.length-discovered.length})),node('p',t('play')));el.append(locked);}
      if(!dishes.length)el.append(node('p',t('future')));
      close('passport-modal');open('passport-country-modal');
    }
    async function recipe(name,canonical,emoji,flagValue){
      const s=state(),dish=[...s.normal,...s.international].find(d=>d.name===name&&d.country===canonical);if(!dish||!(s.progress[canonical]||[]).includes(name))return;
      close('passport-country-modal');close('passport-modal');open('recipe-modal');
      const title=document.getElementById('recipe-modal-title');title.textContent=emoji+' '+name+' '+flagValue;
      const translated=nameLabel(name);if(translated&&translated!==name){const secondary=node('small',translated);secondary.style.cssText='display:block;color:var(--text-muted);font-size:12px';title.append(secondary);}
      const el=document.getElementById('recipe-content');el.replaceChildren(node('p',t('loading')));
      try{
        const response=await requestRecipe({name,country:canonical,emoji,language:locale()});
        if(!response.ok){const message=response.status===401?t('signin'):[404,503].includes(response.status)?t('unavailable'):t('failed');el.replaceChildren(node('p',message),node('p',t('price')));return;}
        const data=await response.json();if(typeof data.text!=='string'||!data.text.trim())throw Error('empty_recipe');
        const content=node('div',data.text);content.style.cssText='white-space:pre-wrap;line-height:1.7;font-size:14px';el.replaceChildren(content);
      }catch(_){el.replaceChildren(node('p',t('failed')),node('p',t('price')));}
    }
    return {passportGrid:grid,passportCountry:detail,dishRecipe:recipe};
  }
  return {create};
});
