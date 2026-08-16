/* Mobile/PWA enhancement layer. Presentation only: never imports or mutates game state. */
const $=id=>document.getElementById(id);
const prefersReduced=matchMedia('(prefers-reduced-motion: reduce)');
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;

function ensureInstallUI(){
  const startBtn=$('btn-start'); if(!startBtn||$('pwa-install'))return;
  const b=document.createElement('button'); b.id='pwa-install'; b.className='btn'; b.type='button'; b.textContent='安裝 YaKyoLife App';
  const s=document.createElement('div'); s.id='pwa-status'; s.setAttribute('aria-live','polite');
  startBtn.insertAdjacentElement('afterend',b); b.insertAdjacentElement('afterend',s);
  if(standalone())s.textContent='已以 App 模式開啟';
}

let installPrompt=null;
window.addEventListener('beforeinstallprompt',ev=>{
  ev.preventDefault(); installPrompt=ev; ensureInstallUI();
  const b=$('pwa-install'); if(b)b.classList.add('show');
});
window.addEventListener('appinstalled',()=>{
  installPrompt=null; const b=$('pwa-install'); if(b)b.classList.remove('show');
  const s=$('pwa-status'); if(s)s.textContent='安裝完成，可以從主畫面直接開啟。';
});

function setupInstall(){
  ensureInstallUI(); const b=$('pwa-install'),s=$('pwa-status'); if(!b)return;
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  if(standalone()){b.classList.remove('show');return;}
  if(ios){ b.classList.add('show'); b.textContent='加入 iPhone 主畫面'; }
  b.onclick=async()=>{
    if(installPrompt){
      installPrompt.prompt(); const choice=await installPrompt.userChoice; installPrompt=null;
      if(s)s.textContent=choice.outcome==='accepted'?'已送出安裝。':'這次沒有安裝，之後仍可再按。';
      b.classList.remove('show'); return;
    }
    if(ios&&s)s.innerHTML='Safari：點底部「分享」→ <b>加入主畫面</b>。';
  };
}

const majorWords=/高中.*十字路口|選秀|旅日|旅美|自由市場|合約|求婚|婚禮|交易|下放|戰力外|TJ|Tommy John|引退|落葉歸根|新東家|去向|球團徵詢/;
function decorateActions(){
  const act=$('act'); if(!act)return;
  const text=(act.textContent||'').replace(/\s+/g,' ').trim();
  const major=!!text&&majorWords.test(text);
  act.classList.toggle('major-decision',major);
  document.body.classList.toggle('major-choice-open',major);
  if(act.children.length)act.scrollTop=0;
}

const revealWords=/戀情公開|婚禮|新生命|大傷|小傷|健康回報|升級通知|日職球團|大聯盟球探|自由市場|選秀|年度MVP|新人王|金手套|守備聖經|總冠軍|日本一|世界大賽|隱藏屬性|引退|名人堂/;
function decorateCards(root=document){
  root.querySelectorAll?.('.card:not([data-story-seen])').forEach(card=>{
    card.dataset.storySeen='1';
    if(!prefersReduced.matches&&revealWords.test(card.textContent||''))card.classList.add('story-reveal');
  });
}

function summarizeYear(block){
  if(!block||block.dataset.recap==='1')return null;
  const body=block.querySelector('.yr-body'),head=block.querySelector('.yr-head');
  if(!body||!head||!body.children.length)return null;
  const cards=[...body.querySelectorAll(':scope > .card')];
  if(!cards.length)return null;
  const stat=cards.findLast?cards.findLast(c=>/球季數據|年度大賽/.test(c.textContent||'')):[...cards].reverse().find(c=>/球季數據|年度大賽/.test(c.textContent||''));
  const notable=[];
  cards.forEach(c=>{
    const h=c.querySelector('h4')?.textContent?.trim();
    if(!h||/球季數據|季末結算|健康回報|季初特訓/.test(h))return;
    if(!notable.includes(h))notable.push(h);
  });
  const recap=document.createElement('section'); recap.className='season-recap'; recap.setAttribute('aria-label','球季總結');
  const statText=stat?(stat.querySelector('.statline')?.textContent||stat.textContent||'').replace(/\s+/g,' ').trim():'';
  recap.innerHTML=`<div class="recap-kicker">Season recap</div><h4>${escapeHtml(head.textContent.trim())}・球季總結</h4>`+
    (statText?`<div class="recap-line">${escapeHtml(statText.slice(0,210))}</div>`:'')+
    (notable.length?`<div class="recap-tags">${notable.slice(0,6).map(x=>`<span class="recap-tag">${escapeHtml(x)}</span>`).join('')}</div>`:'');
  body.appendChild(recap); block.dataset.recap='1'; return recap;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function setupObservers(){
  const act=$('act'); if(act)new MutationObserver(decorateActions).observe(act,{childList:true,subtree:true,characterData:true});
  const log=$('log'); if(log)new MutationObserver(records=>{
    decorateCards(log);
    let newYear=false;
    records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1&&n.classList?.contains('yr-block'))newYear=true;}));
    if(newYear){ const years=[...log.querySelectorAll('.yr-block')]; if(years.length>1)summarizeYear(years[years.length-2]); }
  }).observe(log,{childList:true,subtree:true});
  decorateActions(); decorateCards();
}

function setupNetworkState(){
  const paint=()=>document.documentElement.classList.toggle('offline',!navigator.onLine);
  addEventListener('online',paint); addEventListener('offline',paint); paint();
}

async function registerSW(){
  if(!('serviceWorker'in navigator)||!/^https?:$/.test(location.protocol))return;
  const hadController=!!navigator.serviceWorker.controller;
  let refreshing=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!hadController||refreshing)return;
    refreshing=true; location.reload();
  });
  try{
    const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./'});
    await reg.update();
    if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});
  }catch(err){console.warn('PWA service worker registration failed',err);}
}

document.addEventListener('DOMContentLoaded',()=>{
  setupInstall(); setupObservers(); setupNetworkState(); registerSW();
});
