/* YaKyoLife mobile/PWA experience layer v5. Presentation only. */
const $=id=>document.getElementById(id);
const phone=matchMedia('(max-width: 920px)');
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
window.addEventListener('beforeinstallprompt',ev=>{ev.preventDefault();installPrompt=ev;ensureInstallUI();$('pwa-install')?.classList.add('show');});
window.addEventListener('appinstalled',()=>{installPrompt=null;$('pwa-install')?.classList.remove('show');const s=$('pwa-status');if(s)s.textContent='安裝完成，可以從主畫面直接開啟。';});
function setupInstall(){
  ensureInstallUI(); const b=$('pwa-install'),s=$('pwa-status'); if(!b)return;
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  if(standalone()){b.classList.remove('show');return;}
  if(ios){b.classList.add('show');b.textContent='加入 iPhone 主畫面';}
  b.onclick=async()=>{
    if(installPrompt){installPrompt.prompt();const choice=await installPrompt.userChoice;installPrompt=null;if(s)s.textContent=choice.outcome==='accepted'?'已送出安裝。':'這次沒有安裝，之後仍可再按。';b.classList.remove('show');return;}
    if(ios&&s)s.innerHTML='Safari：點底部「分享」→ <b>加入主畫面</b>。';
  };
}

function phaseText(){const on=document.querySelector('#lamps .lamp.on');return(on?.textContent||'').replace(/\s+/g,' ').trim()||'生涯';}
function roleText(){return($('bd-role')?.querySelector('.bd-chip.pos')?.textContent||'').trim();}
function syncMobileHud(){
  if(!phone.matches)return; const meta=$('mobile-meta'); if(!meta)return;
  const y=$('bd-year')?.textContent?.trim()||'',age=$('bd-age')?.textContent?.trim()||'',ovr=$('bd-ovr')?.textContent?.trim()||'';
  const vals={'mm-season':`${y}${age?` · ${age}歲`:''}`,'mm-ovr':ovr?`OVR ${ovr}`:'','mm-role':roleText(),'mm-phase':phaseText()};
  Object.entries(vals).forEach(([id,text])=>{const el=$(id);if(el&&el.textContent!==text)el.textContent=text;});
}
function ensureMobileHud(){
  const board=$('board');if(!board||$('mobile-meta'))return;
  const meta=document.createElement('div');meta.id='mobile-meta';meta.innerHTML='<span id="mm-season" class="mm-pill"></span><span id="mm-ovr" class="mm-pill"></span><span id="mm-role" class="mm-pill"></span><span id="mm-phase" class="mm-pill mm-phase"></span><button id="mobile-career" type="button">生涯</button>';
  $('bd-top')?.insertAdjacentElement('afterend',meta);$('mobile-career').onclick=()=>$('bd-more')?.click();syncMobileHud();
}

const kindRules=[
  ['injury',/傷|受傷|疼痛|疲勞|TJ|Tommy John|觸身球|打針|醫療|復健|健康/],
  ['love',/戀|愛|感情|約會|求婚|婚|老婆|女友|緋聞|外遇|孩子|新生命/],
  ['contract',/合約|FA|自由市場|旅日|旅美|大聯盟|日職|中職|球團|交易|選秀|下放|戰力外|續約|薪資|新東家/],
  ['intl',/國際賽|WBC|世界棒球經典賽|12強|P12|亞錦|國家隊|Team Taiwan/],
  ['honor',/MVP|新人王|金手套|守備聖經|冠軍|日本一|世界大賽|名人堂|全明星|獎項|打擊王|全壘打王|盜壘王/],
  ['training',/訓練|特訓|重量|影像|打擊機|守備千球|跑壘|長傳|教練|指點|伙食|睡眠|低潮|宵夜/]
];
const kindLabel={general:'事件',training:'訓練',injury:'傷病',love:'感情',contract:'生涯',intl:'國際賽',honor:'榮譽'};
function classify(text){for(const[k,re]of kindRules)if(re.test(text))return k;return'general';}

function ensureActionHead(act){
  let head=act.querySelector(':scope > .mobile-action-head');
  if(!head){
    head=document.createElement('div');head.className='mobile-action-head';head.innerHTML='<i class="mah-dot"></i><b class="mah-label">事件</b><button class="mah-toggle" type="button">收起看紀錄</button>';act.prepend(head);
    head.querySelector('.mah-toggle').onclick=()=>{document.body.classList.toggle('action-collapsed');syncActionToggle();};
  }
  return head;
}
function syncActionToggle(){
  const btn=document.querySelector('.mah-toggle');if(!btn)return;
  const collapsed=document.body.classList.contains('action-collapsed');
  btn.textContent=collapsed?'展開選項':'收起看紀錄';btn.setAttribute('aria-expanded',String(!collapsed));
}
function revealLatestCard(){
  if(!phone.matches)return;
  const cards=[...document.querySelectorAll('#log .yr-block:not(.collapsed) .card')];
  const card=cards.at(-1);const dock=$('act');const board=$('board');if(!card||!dock)return;
  requestAnimationFrame(()=>{
    const r=card.getBoundingClientRect();const dockH=dock.getBoundingClientRect().height;const boardH=board?.getBoundingClientRect().height||0;
    const topSafe=boardH+10,bottomSafe=innerHeight-dockH-12;
    if(r.bottom>bottomSafe)scrollBy(0,r.bottom-bottomSafe);
    else if(r.top<topSafe)scrollBy(0,r.top-topSafe);
  });
}
let actionSignature='';
function syncActions(){
  const act=$('act');if(!act)return;
  const allocOpen=$('alloc-full')?.classList.contains('show');
  const buttons=[...act.querySelectorAll(':scope > .btn, :scope > .row2 .btn')];
  const has=!allocOpen&&!!act.innerHTML.trim()&&buttons.length>0&&act.style.display!=='none';

  if(!phone.matches){
    document.body.classList.remove('has-mobile-action','mobile-event-open','action-collapsed','major-choice-open');
    act.querySelector(':scope > .mobile-action-head')?.remove();delete act.dataset.kind;delete act.dataset.count;actionSignature='';return;
  }
  document.body.classList.toggle('has-mobile-action',has);document.body.classList.toggle('mobile-event-open',has);
  document.body.classList.remove('choice-sheet-open','quick-action-open');
  if(!has){document.body.classList.remove('action-collapsed','major-choice-open');actionSignature='';return;}

  const title=act.querySelector(':scope > .title')?.textContent||'';
  const text=(title+' '+buttons.map(b=>b.textContent||'').join(' ')).replace(/\s+/g,' ').trim();
  const sig=title+'|'+buttons.map(b=>b.textContent||'').join('|');
  const isNew=sig!==actionSignature;actionSignature=sig;
  if(isNew)document.body.classList.remove('action-collapsed');
  const kind=classify(text);act.dataset.kind=kind;act.dataset.count=String(buttons.length);
  const head=ensureActionHead(act);head.querySelector('.mah-label').textContent=kindLabel[kind]||'事件';
  const major=/高中.*十字路口|選秀|旅日|旅美|自由市場|求婚|婚禮|交易|戰力外|TJ|引退|新東家|去向/.test(text);
  document.body.classList.toggle('major-choice-open',major);syncActionToggle();
  if(isNew)revealLatestCard();
}

const revealWords=/戀情公開|婚禮|新生命|大傷|小傷|健康回報|升級通知|日職球團|大聯盟球探|自由市場|選秀|年度MVP|新人王|金手套|守備聖經|總冠軍|日本一|世界大賽|隱藏屬性|引退|名人堂/;
function decorateCards(root=document){
  root.querySelectorAll?.('.card').forEach(card=>{
    if(!card.dataset.kind)card.dataset.kind=classify((card.textContent||'').replace(/\s+/g,' '));
    if(!card.dataset.storySeen){card.dataset.storySeen='1';if(!prefersReduced.matches&&revealWords.test(card.textContent||''))card.classList.add('story-reveal');}
  });
}
function summarizeYear(block){
  if(!block||block.dataset.recap==='1')return null;const body=block.querySelector('.yr-body'),head=block.querySelector('.yr-head');if(!body||!head||!body.children.length)return null;
  const cards=[...body.querySelectorAll(':scope > .card')];if(!cards.length)return null;
  const stat=cards.findLast?cards.findLast(c=>/球季數據|年度大賽/.test(c.textContent||'')):[...cards].reverse().find(c=>/球季數據|年度大賽/.test(c.textContent||''));
  const notable=[];cards.forEach(c=>{const h=c.querySelector('h4')?.textContent?.trim();if(!h||/球季數據|季末結算|健康回報|季初特訓/.test(h))return;if(!notable.includes(h))notable.push(h);});
  const recap=document.createElement('section');recap.className='season-recap';recap.setAttribute('aria-label','球季總結');
  const statText=stat?(stat.querySelector('.statline')?.textContent||stat.textContent||'').replace(/\s+/g,' ').trim():'';
  recap.innerHTML=`<div class="recap-kicker">Season recap</div><h4>${escapeHtml(head.textContent.trim())}・球季總結</h4>`+(statText?`<div class="recap-line">${escapeHtml(statText.slice(0,240))}</div>`:'')+(notable.length?`<div class="recap-tags">${notable.slice(0,7).map(x=>`<span class="recap-tag">${escapeHtml(x)}</span>`).join('')}</div>`:'');
  body.appendChild(recap);block.dataset.recap='1';return recap;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function decorateDetail(){
  const board=$('board'),detail=$('bd-detail');if(!board||!detail)return;const open=board.classList.contains('detail-open');document.body.classList.toggle('mobile-detail-open',phone.matches&&open);
  if(!phone.matches||!open)return;if(!detail.querySelector('.mobile-detail-head')){const head=document.createElement('div');head.className='mobile-detail-head';head.innerHTML='<b>生涯資訊</b><button type="button">關閉</button>';head.querySelector('button').onclick=()=>$('bd-more')?.click();detail.prepend(head);}
}
function setupObservers(){
  ensureMobileHud();const act=$('act');if(act)new MutationObserver(syncActions).observe(act,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['style','disabled']});
  const board=$('board');if(board)new MutationObserver(()=>{syncMobileHud();decorateDetail();}).observe(board,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});
  const log=$('log');if(log)new MutationObserver(records=>{decorateCards(log);let newYear=false;records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1&&n.classList?.contains('yr-block'))newYear=true;}));if(newYear){const years=[...log.querySelectorAll('.yr-block')];if(years.length>1)summarizeYear(years[years.length-2]);}}).observe(log,{childList:true,subtree:true});
  phone.addEventListener?.('change',()=>{syncActions();syncMobileHud();decorateDetail();});syncActions();syncMobileHud();decorateCards();decorateDetail();
}
function setupNetworkState(){const paint=()=>document.documentElement.classList.toggle('offline',!navigator.onLine);addEventListener('online',paint);addEventListener('offline',paint);paint();}
async function registerSW(){
  if(!('serviceWorker'in navigator)||!/^https?:$/.test(location.protocol))return;const hadController=!!navigator.serviceWorker.controller;let refreshing=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController||refreshing)return;refreshing=true;location.reload();});
  try{const reg=await navigator.serviceWorker.register('./sw.js?v=5',{scope:'./'});await reg.update();if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});}catch(err){console.warn('PWA service worker registration failed',err);}
}
document.addEventListener('DOMContentLoaded',()=>{setupInstall();setupObservers();setupNetworkState();registerSW();});
