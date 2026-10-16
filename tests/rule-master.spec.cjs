// Rule Master must remain read-only and keep every next-step guide in its dialog.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.BRASS_TEST_URL||'http://127.0.0.1:8000/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({locale:'en-US',viewport:{width:1440,height:1050}}),page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!==new URL(base).origin)external.push(r.url())});
  await page.goto(base);await page.waitForFunction(()=>navigator.serviceWorker.controller);await page.waitForTimeout(300);
  const snapshot=()=>page.evaluate(()=>({saved:localStorage.getItem(KEY),records:localStorage.getItem(RECORDS_KEY),game:JSON.stringify(game),history:JSON.stringify(history),completed:JSON.stringify(completedGames)}));
  async function audit(label){
   const bad=await page.evaluate(()=>{
    const d=document.getElementById('modal'),w=document.createTreeWalker(d,NodeFilter.SHOW_TEXT),out=[];let n;
    while(n=w.nextNode())if(!n.parentElement.closest('[data-i18n-ignore]')&&/[가-힣]/.test(n.nodeValue))out.push(n.nodeValue);
    for(const el of d.querySelectorAll('[aria-label],[alt],[title]'))if(!el.closest('[data-i18n-ignore]'))for(const a of ['aria-label','alt','title'])if(/[가-힣]/.test(el.getAttribute(a)||''))out.push(el.getAttribute(a));
    return out;
   });assert.deepEqual(bad,[],label);
  }
  async function guide(){await page.locator('header [data-act=rule-master]').click();await page.locator('.rule-toolbar [data-rule-guide-tab]').click()}
  async function close(){await page.locator('.rule-heading [data-close]').click();assert.equal(await page.locator('[data-rule-guide]:visible').count(),0);assert.equal(await page.evaluate(()=>root.querySelectorAll('[data-rule-guide]').length),0)}
  assert.equal(await page.locator('dialog[open]').count(),0);assert.equal(await page.locator('[data-rule-guide]').count(),0);
  assert.equal(await page.locator('header [data-act=rule-master]').innerText(),'Rule Master');
  const before=await snapshot();await page.locator('header [data-act=rule-master]').click();
  const lessons=await page.evaluate(()=>RULE_MASTER_LESSONS.map(l=>l.id));assert.equal(lessons.length,13);
  for(const id of lessons){
   await page.locator(`.rule-toc [data-rule-topic="${id}"]`).click();
   for(const stage of [0,1]){
    await page.locator(`[data-rule-scene="${stage}"]`).click();
    assert.equal(await page.locator('.rule-figure svg[role=img]').count(),1);
    assert.ok(await page.locator('.rule-figure svg rect,.rule-figure svg circle').count(),id+' scene');
    assert.equal(await page.locator('.rule-figure svg').getAttribute('data-scene'),String(stage));
    await audit(id+' stage '+stage);
    if(id==='scout'){
     assert.equal(await page.locator('.rule-figure [data-kind=normal]').count(),stage===0?3:0);
     assert.equal(await page.locator('.rule-figure [data-kind=wild]').count(),stage===0?0:2);
     assert.equal(await page.locator('.rule-figure .rm-discard[data-card-count="3"]').count(),stage===0?0:1);
    }
    if(id==='eras'){
     assert.equal(await page.locator('.rule-figure .rm-industry-tile').count(),stage===0?2:1);
     assert.equal(await page.locator('.rule-figure .rm-link-piece').count(),stage===0?1:0);
    }
    if(id==='sell'||id==='scoring'||id==='resources'){
     const expected=id==='resources'?[{vp:1,income:4,links:2},{vp:3,income:3,links:1},{vp:4,income:4,links:2}]:[{vp:5,income:id==='sell'?4:5,links:id==='sell'?2:1}];
     const flipped=id==='scoring'||stage===1;
     const tiles=await page.locator('.rule-figure .rm-industry-tile').evaluateAll(nodes=>nodes.map(n=>({vp:Number(n.dataset.vp),income:Number(n.dataset.income),links:Number(n.dataset.links),flipped:n.dataset.flipped,printed:n.querySelector('.rm-printed-links').dataset.iconCount,face:n.querySelector('.rm-tile-face').getAttribute('fill'),visible:n.textContent})));
     assert.equal(tiles.length,expected.length);
     for(const [i,tile]of tiles.entries()){
      assert.deepEqual({vp:tile.vp,income:tile.income,links:tile.links},expected[i],id+' physical component values');
      assert.equal(tile.flipped,String(flipped));assert.equal(Number(tile.printed),expected[i].links);
      assert.equal(tile.face,flipped?'url(#rm-flipped-face)':'url(#rm-purple-face)');
      assert.ok(tile.visible.includes('VP'));assert.ok(tile.visible.includes('+'+expected[i].income));
     }
     assert.equal(await page.locator('[data-tile-explanation]').count(),expected.length);
     assert.match(await page.locator('[data-tile-explanation]').first().textContent(),/Industry VP is counted at the end of the era/);
    }
   }
  }
  assert.equal(await page.locator('.rule-official-link').getAttribute('href'),'https://roxley.com/products/brass-birmingham');
  assert.equal(await page.locator('.rule-official-link').getAttribute('target'),'_blank');
  assert.ok((await page.locator('.rule-official-link').getAttribute('rel')).includes('noopener'));
  assert.equal(await page.locator('[data-rule-master] iframe,[data-rule-master] object,[data-rule-master] embed').count(),0);
  await page.locator('.rule-toolbar [data-rule-guide-tab]').click();await audit('no game guide');
  assert.match(await page.locator('.rule-guide h3').innerText(),/Prepare the Game/);
  assert.deepEqual(await snapshot(),before);await close();
  console.log('PASS: 26 English tabletop scenes, correct three-for-two Scout exchange and era cleanup, official external link, no automatic guide or save changes');
  // A real setup supplies the baseline. Remaining cases are controlled UI states.
  await page.locator('.home-actions [data-act=new]').click();await page.locator('#setup-form [name=count]').selectOption('2');await page.locator('#randomize-start-order').click();
  const merchantSave=await snapshot();await guide();assert.match(await page.locator('.rule-guide h3').innerText(),/Merchants/);await audit('merchant setup');assert.deepEqual(await snapshot(),merchantSave);await close();
  await page.locator('#merchant-form button.primary').click();
  await guide();assert.match(await page.locator('.rule-guide h3').innerText(),/Starting Hands/);await close();
  await page.locator('#hands-form button.primary').click();
  await page.evaluate(()=>{game.order=[0,1];game.turn=0;game.players[0].name='석탄 <이름>';game.aiProposal=null;save();render();window.rmTestBaseline=structuredClone(game)});
  const cases=[
   {id:'resources',set:{inventoryReady:false},title:'Check Board Resources'},
   {id:'draw',set:{pendingDraw:{player:1,count:2}},title:'Refill the AI Hand'},
   {id:'shortfall',set:{awaiting:'shortfall',shortfallPlayer:0},title:'Income Shortfall'},
   {id:'round',set:{awaiting:'round'},title:'Settle the Round'},
   {id:'era',set:{awaiting:'era'},title:'Prepare Canal Era'},
   {id:'canal-score',set:{awaiting:'era-score'},title:'Scores Before'},
   {id:'cleanup',set:{awaiting:'era-scored'},title:'Prepare the Rail Era'},
   {id:'rail-hands',set:{era:'rail',setupStep:'hands'},title:'Starting Hands'},
   {id:'rail-score',set:{era:'rail',awaiting:'rail-score'},title:'Scores Before'},
   {id:'final',set:{era:'rail',awaiting:'end'},title:'Check Final Scores'},
   {id:'finished',set:{era:'rail',awaiting:'finished',completed:true},title:'Completed Game'},
   {id:'ai',set:{turn:1,aiProposal:null},title:'Carry Out the AI Action'}
  ];
  for(const c of cases){
   await page.evaluate(changes=>{game=structuredClone(window.rmTestBaseline);Object.assign(game,changes);view='game';render();save()},c.set);
   const current=await snapshot();await guide();assert.ok((await page.locator('.rule-guide h3').innerText()).includes(c.title),c.id);await audit(c.id);
   assert.equal(await page.evaluate(()=>root.querySelectorAll('[data-rule-guide]').length),0,c.id);
   await page.locator('[data-rule-related]').click();assert.equal(await page.locator('.rule-figure').count(),1);await audit(c.id+' related');
   assert.deepEqual(await snapshot(),current,c.id+' changed game');await close();
  }
  console.log('PASS: setup, resources, refill, income shortfall, round/era scoring, rail setup, game end and AI guidance stay inside Rule Master');
  await page.evaluate(()=>{game=structuredClone(window.rmTestBaseline);view='game';render();save()});
  for(const [type,topic] of [['건설','build'],['연결','network'],['개발','develop'],['판매','sell'],['대출','loan'],['정찰','scout'],['패스','pass']]){
   await page.locator(`#action-form [name=type][value="${type}"]`).locator('..').locator('span').click();
   const current=await snapshot();await guide();assert.equal(await page.locator('[data-rule-related]').getAttribute('data-rule-related'),topic);
   await audit(type+' guide');assert.ok((await page.locator('.rule-guide-person').innerText()).includes('석탄 <이름>'));
   assert.deepEqual(await snapshot(),current);await close();
  }
  console.log('PASS: each human action links to its lesson; names and game/history/records remain intact');
  await page.locator('header [data-act=rule-master]').click();await page.locator('.rule-toc [data-rule-topic=build]').click();
  await page.screenshot({path:process.env.BRASS_RULE_SCREENSHOT||'/tmp/brass-rule-master-en.png'});
  const current=await snapshot();await page.evaluate(()=>setUiLang('ko'));assert.equal(await page.locator('.rule-lesson h3').innerText(),'건설');assert.deepEqual(await snapshot(),current);
  for(const viewport of [{width:390,height:844},{width:820,height:1180}]){
   await page.setViewportSize(viewport);
   assert.ok(await page.evaluate(()=>{const d=document.getElementById('modal');return d.scrollWidth<=d.clientWidth&&document.documentElement.scrollWidth<=innerWidth}),'lesson horizontal overflow');
   if(viewport.width<700)await page.locator('[data-rule-select]').selectOption('sell');
   await page.locator('.rule-toolbar [data-rule-guide-tab]').click();
   assert.ok(await page.evaluate(()=>{const d=document.getElementById('modal');return d.scrollWidth<=d.clientWidth}),'guide horizontal overflow');
   await page.locator('.rule-toolbar [data-rule-learn]').click();
  }
  await page.evaluate(()=>setUiLang('en'));await audit('English restored');await close();
  await context.setOffline(true);await page.reload();assert.equal(await page.locator('[data-rule-guide]:visible').count(),0);
  await page.locator('header [data-act=rule-master]').click();await audit('offline lessons');assert.equal(await page.locator('.rule-figure svg').count(),1);
  assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
  console.log('PASS: Korean/English switching, mobile/tablet layouts, offline lessons and zero external requests during learning');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
