// Browser regression checks. Run against the local static server; see README.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('playwright');
const base = process.env.BRASS_TEST_URL || 'http://127.0.0.1:8000/';
const korean = /[가-힣]/;
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const failures=[],errors=[];
 try{
 const context=await browser.newContext({locale:'en-US'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 async function audit(label){
  await page.locator("body").waitFor();
  await page.waitForTimeout(50);
  const remaining=await page.evaluate(()=>{
   const names=[...(game?.players||[]).map(p=>p.name),...completedGames.flatMap(r=>r.players.map(p=>p.name))];
   const hasKorean=s=>{for(const name of names)if(name)s=s.replaceAll(name,'');return /[가-힣]/.test(s)};
   const bad=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
   while(n=w.nextNode()){
    const e=n.parentElement;if(!e||e.closest('script,style,[data-i18n-ignore]'))continue;
    if(e.closest('dialog:not([open])'))continue;
    // Include hidden select options: the user can open them later.
    if(!e.closest('select')&&!e.getClientRects().length)continue;
    if(hasKorean(n.nodeValue))bad.push(n.nodeValue.trim());
   }
   for(const e of document.querySelectorAll('[aria-label],[title],[placeholder],[alt]')){
    if(e.closest('[data-i18n-ignore],dialog:not([open])'))continue;
    for(const attr of ['aria-label','title','placeholder','alt'])if(hasKorean(e.getAttribute(attr)||''))bad.push(attr+': '+e.getAttribute(attr));
   }
   return [...new Set(bad)];
  });
  if(remaining.length)failures.push({label,remaining});
 }
 await page.goto(base);await page.waitForFunction(()=>navigator.serviceWorker.controller);await page.waitForTimeout(300);await page.locator('.home-actions').waitFor();
 await audit('home');
 await page.locator('[data-act=help]').click();await audit('help');await page.locator('[data-close]').click();
 await page.locator('.home-actions [data-act=new]').click();await audit('setup 3');
 await page.locator('#setup-form [name=count]').selectOption('4');await audit('setup 4');
 await page.locator('#setup-form [name=count]').selectOption('2');await audit('setup 2');
 assert.equal(await page.locator('#randomize-start-order').innerText(),'Randomize Starting Order');
 await page.locator('#randomize-start-order').click();await audit('merchants');
 await page.locator('#merchant-form button.primary').click();await audit('AI hands');
 await page.locator('#hands-form button.primary').click();
 await page.evaluate(()=>{game.order=[0,1];game.turn=0;game.aiProposal=null;render()});
 await audit('human build');
 for(const type of ['연결','개발','판매','대출','정찰','패스']){
  await page.locator(`#action-form [name=type][value="${type}"]`).locator('..').locator('span').click();await audit('human '+type);
 }
 await page.locator('#action-form button[type=submit]').click();await audit('AI turn');
 await page.locator('[data-act=hand]').click();await audit('AI hand editor');await page.locator('[data-close]').click();
 await page.locator('[data-act=difficulty]').click();await audit('difficulty');await page.locator('[data-close]').click();
 await page.locator('[data-act=settings]').first().click();await audit('settings');await page.locator('[data-close]').click();
 await page.locator('[data-act=ai-done]').click();await audit('AI after action');
 if(await page.locator('#draw-form').count()){
  await audit('AI refill');await page.locator('#draw-form button.primary').click();
 }
 await audit('round end');
 if(await page.evaluate(()=>game.awaiting==='round'))await page.locator('[data-act=advance]').click();
 await audit('next round');
 // Show varied resource/industry/link/score states with fixtures, without changing rules.
 await page.evaluate(()=>{
  game.buildings=[{id:101,player:0,city:'Birmingham',industry:'제조품',level:2,slot:0,stock:0,sold:false,flipped:false,builtEra:'canal'},{id:102,player:1,city:'Farm Brewery (Worcester)',industry:'양조장',level:2,slot:0,stock:1,sold:false,flipped:false,builtEra:'canal'},{id:103,player:0,city:'Coalbrookdale',industry:'제철소',level:1,slot:1,stock:0,sold:true,flipped:true,builtEra:'canal'}];
  game.links=[{player:0,era:'canal',from:'Birmingham',to:'Worcester',count:1}];
  game.turn=0;game.order=[0,1];game.used=0;game.pendingDraw=null;game.awaiting=null;game.aiProposal=null;
  game.log.push({era:'canal',round:1,player:0,playerName:game.players[0].name,type:'건설',detail:'버밍엄 · 제조품 2레벨',card:'산업 · 제조품/면직물',cost:10,at:Date.now(),resources:[{type:'beer',source:'tile',id:'tile:102',owner:1,ownerName:game.players[1].name,city:'Farm Brewery (Worcester)',industry:'양조장',count:1,before:2,after:1}],bonusDevelopment:[{industry:'탄광',level:1}],incomePositions:[{id:0,name:game.players[0].name,pos:15}]});
  render();
 });
 await audit('resources and action log');
 await page.locator('#action-form [name=type][value="판매"]').locator('..').locator('span').click();await audit('sale and blocked merchants');
 await page.evaluate(()=>{game.players[0].cash=-5;game.shortfallPlayer=0;game.awaiting='shortfall';render()});await audit('shortfall');
 await page.evaluate(()=>{game.players[0].cash=17;game.awaiting='era-score';render()});await audit('Canal scoring');
 await page.locator('[data-act=confirm-era-score]').click();await audit('Canal scores confirmed');
 await page.locator('[data-act=advance]').click();await audit('Rail hand setup');
 await page.locator('#hands-form button.primary').click();await audit('Rail turn');
 await page.evaluate(()=>{game.awaiting='rail-score';render()});await audit('Rail scoring');
 await page.locator('[data-act=confirm-era-score]').click();await audit('final score form');
 await page.locator('#finish-form button.primary').click();await audit('finished');
 await page.locator('[data-act=home]').first().click();await audit('completed records');
 await page.locator('[data-archive]').click();await audit('archive');
 await page.locator('[data-act=review-canal-score]').count();
 await page.evaluate(()=>eraScoreReview('canal'));await audit('review scoring');await page.locator('[data-close]').click();
 // Switching languages must preserve names, game state, history and stored backups.
 await page.locator('[data-act=home]').first().click();
 const saved=await page.evaluate(()=>localStorage.getItem(KEY));
 await page.locator('[data-lang=ko]').click();assert.equal(await page.locator('.home-actions [data-act=new]').innerText(),'새 게임');
 assert.equal(await page.evaluate(()=>localStorage.getItem(KEY)),saved);
 await page.locator('[data-lang=en]').click();await audit('English restored');
 assert.equal(await page.evaluate(()=>localStorage.getItem(KEY)),saved);
 await page.reload();assert.equal(await page.evaluate(()=>uiLang),'en');await audit('language persistence');
 // Korean starting-order regression check.
 await page.locator('[data-lang=ko]').click();await page.locator('.home-actions [data-act=new]').click();
 assert.equal(await page.locator('#randomize-start-order').innerText(),'시작 순서 뽑기');
 await page.locator('#randomize-start-order').click();assert.equal(await page.locator('#merchant-form').count(),1);
 await page.locator('[data-act=home]').first().click();await page.locator('[data-lang=en]').click();
 const event=page.waitForEvent('download');await page.locator('[data-act=backup]').first().click();
 const downloaded=await event,backup=fs.readFileSync(await downloaded.path());
 const chooserEvent=page.waitForEvent('filechooser');await page.locator('[data-act=import]').first().click();
 page.once('dialog',async d=>{assert.ok(!korean.test(d.message()),d.message());await d.accept()});
 const chooser=await chooserEvent;await chooser.setFiles({name:'backup.json',mimeType:'application/json',buffer:backup});
 await page.waitForFunction(()=>document.querySelector('#toast')?.textContent==='Game imported.');await audit('backup import');
 assert.ok(await page.evaluate(()=>localStorage.getItem(KEY)));
 await context.setOffline(true);await page.reload();await audit('offline PWA');
 assert.deepEqual(errors,[]);
 
 assert.deepEqual(failures,[],JSON.stringify(failures,null,2));
 console.log('PASS: English text/attributes across setup, all human actions, AI, resources, scoring, records, help, backup/import and offline PWA');
 console.log('PASS: Korean/English starting order, saved-state preservation and language persistence');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
