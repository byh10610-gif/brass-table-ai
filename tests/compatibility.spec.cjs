const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const base=process.env.BRASS_TEST_URL||'http://127.0.0.1:8010/brass-table-ai/';
const legacy=process.env.BRASS_LEGACY_URL||'http://127.0.0.1:8010/onboarding/legacy-v33/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
 const context=await browser.newContext({locale:'en-US'}),page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(legacy);await page.waitForFunction(()=>navigator.serviceWorker.controller);await page.waitForTimeout(300);
 await page.locator('.home-actions [data-act=new]').click();await page.locator('#setup-form [name=count]').selectOption('2');
 await page.locator('#setup-form button.primary').click();await page.locator('#merchant-form button.primary').click();await page.locator('#hands-form button.primary').click();
 const oldSave=await page.evaluate(()=>localStorage.getItem(KEY));
 assert.equal(JSON.parse(oldSave).game.players.length,2);
 await page.goto(base);await page.waitForFunction(()=>navigator.serviceWorker.controller);await page.waitForTimeout(300);
 await page.evaluate(saved=>{localStorage.setItem(KEY,saved);localStorage.setItem(LANG_KEY,'en')},oldSave);await page.reload();
 await page.locator('.home-actions [data-act=continue]').click();
 const oldGame=JSON.parse(oldSave).game;
 assert.deepEqual(await page.evaluate(()=>game.players.map(p=>({name:p.name,hand:p.hand,cash:p.cash}))),oldGame.players.map(p=>({name:p.name,hand:p.hand,cash:p.cash})));
 console.log('PASS: actual v1.0.33 save loads with player names, cash and AI cards intact');
 // Existing human names must be displayed exactly, including names matching game terminology.
 await page.evaluate(()=>{game.players[0].name='석탄';game.turn=0;game.order=[0,1];game.aiProposal=null;render()});
 assert.equal(await page.locator('.turn-hero h2 [data-i18n-ignore]').innerText(),'석탄');
 assert.equal(await page.locator('#log-player option[value="0"]').innerText(),'석탄');
 assert.equal(await page.locator('[data-rename="0"]').first().getAttribute('aria-label'),'Rename 석탄');
 // Exercise branch-specific AI instructions and build guidance.
 const texts=await page.evaluate(()=>{
  const p=game.players[0],outputs=[];p.kind='ai';p.hand=['지역 · Birmingham','산업 · 양조장','산업 · 탄광'];game.aiStrategyVersion=3;
  for(const type of ['건설','연결','개발','판매','대출','정찰','패스']){
   game.aiProposal={type,card:p.hand[0],city:'Birmingham',industry:'제조품',level:1,from:'Birmingham',to:'Worcester',links:1,resource:0,detail:'버밍엄 · 제조품 1레벨',sales:[{buildingLabel:'버밍엄 · 제조품 1레벨',merchant:'Oxford-1'}]};
   root.innerHTML=aiPanel();applyLanguage(root);outputs.push(root.innerText);
  }
  game.buildings=[{id:1,player:0,city:'Coalbrookdale',industry:'제철소',level:1,stock:2,flipped:false}];
  for(const industry of ['탄광','제철소'])for(const market of [0,8,14]){
   game.market={coal:market,iron:Math.min(10,market)};root.innerHTML=buildGuide({type:'건설',city:'Coalbrookdale',industry,level:2,replaceId:1});applyLanguage(root);outputs.push(root.innerText);
  }
  return outputs;
 });
 for(const text of texts)assert.ok(!/[가-힣]/.test(text.replaceAll('석탄','')),text);
 console.log('PASS: all AI action instruction branches and overbuild/market guidance translate');
 await page.evaluate(()=>{game.players[0].kind='human';view='home';render()});
 for(const viewport of [{width:390,height:844},{width:820,height:1180}]){
  await page.setViewportSize(viewport);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'home overflow');
  await page.locator('.home-actions [data-act=new]').click();await page.locator('#setup-form [name=count]').selectOption('4');
  assert.ok(await page.evaluate(()=>document.querySelector('dialog').scrollWidth<=document.querySelector('dialog').clientWidth),'setup overflow');
  await page.locator('[data-close]').click();
  await page.locator('.home-actions [data-act=continue]').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'game overflow');
  await page.locator('[data-act=home]').first().click();
 }
 if(process.env.BRASS_SCREENSHOT_PATH)await page.screenshot({path:process.env.BRASS_SCREENSHOT_PATH,fullPage:false});
 console.log('PASS: English home and 4-player setup fit phone/tablet widths');
 await context.setOffline(true);await page.reload();assert.equal(await page.locator('.home-actions [data-act=new]').innerText(),'New Game');
 assert.equal(await page.evaluate(()=>navigator.serviceWorker.controller.scriptURL),new URL('service-worker.js',base).href);
 assert.deepEqual(errors,[]);
 console.log('PASS: GitHub Pages subdirectory and offline service-worker scope');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
