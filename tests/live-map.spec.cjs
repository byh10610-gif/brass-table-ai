// Browser checks of the map against real recorded actions and controlled era fixtures.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.BRASS_TEST_URL||'http://127.0.0.1:8000/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({locale:'ko-KR',viewport:{width:1440,height:1050}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForFunction(()=>navigator.serviceWorker.controller);await page.waitForTimeout(300);
  // Geometry must cover every logical space and route without changing saved state.
  const geometry=await page.evaluate(()=>({
   slots:Object.entries(CITY_SLOTS).map(([city,slots])=>({city,logical:slots.length,points:BOARD_SLOTS[city]})),
   routes:ROUTES.map(([a,b])=>({a,b,matches:BOARD_ROUTES.filter(([x,y])=>sameLink(a,b,x,y)).length})),
   extra:BOARD_ROUTES.filter(([a,b])=>!ROUTES.some(([x,y])=>sameLink(a,b,x,y))).length,
   duplicates:BOARD_ROUTES.length-new Set(BOARD_ROUTES.map(([a,b])=>[a,b].sort().join('|'))).size
  }));
  for(const s of geometry.slots){assert.equal(s.points.length,s.logical,s.city);for(const [x,y]of s.points)assert.ok(x>30&&x<1506&&y>30&&y<1506,s.city)}
  for(const r of geometry.routes)assert.equal(r.matches,1,r.a+'–'+r.b);
  assert.equal(geometry.extra,0);assert.equal(geometry.duplicates,0);
  const savedBefore=await page.evaluate(()=>localStorage.getItem(KEY));
  await page.locator('[data-act=map]').first().click();
  assert.equal(await page.locator('#modal .board-tile').count(),8);
  assert.equal(await page.locator('#modal .board-link').count(),6);
  assert.equal(await page.locator('[data-map-mode=live]').isDisabled(),true);
  // Keyboard and list selection provide alternatives to hitting small tiles.
  await page.locator('[data-map-item="tile:demo-1"]').focus();await page.keyboard.press('Enter');
  assert.match(await page.locator('[data-map-inspector]').innerText(),/버밍엄[\s\S]*면직물[\s\S]*뒤집힘/);
  await page.locator('[data-map-select]').selectOption('tile:demo-7');
  assert.match(await page.locator('[data-map-inspector]').innerText(),/농장 양조장\(우스터\)[\s\S]*맥주 1개/);
  await page.locator('[data-map-mode=rail]').click();
  assert.equal(await page.locator('#modal .board-link.rail').count(),7);
  await page.locator('[data-map-item="link:3:1"]').click();
  assert.match(await page.locator('[data-map-inspector]').innerText(),/우스터[\s\S]*글로스터[\s\S]*철도/);
  await page.locator('[data-map-zoom="50"]').click();assert.equal(await page.locator('[data-map-percent]').innerText(),'150%');
  await page.locator('[data-map-fit]').click();
  assert.ok(await page.evaluate(()=>{const v=document.querySelector('.board-viewport'),m=v.querySelector('.board-map');return m.clientWidth<=v.clientWidth&&m.clientHeight<=v.clientHeight}),'Fit must show the complete board');
  assert.equal(await page.evaluate(()=>localStorage.getItem(KEY)),savedBefore);
  await page.locator('[data-close]').click();
  console.log('PASS: all spaces/routes mapped; examples, farm details, double rail, keyboard and fit preserve saves');
  // Build and connect through the existing rule-checked record() path.
  await page.locator('.home-actions [data-act=new]').click();await page.locator('#setup-form [name=count]').selectOption('2');
  await page.locator('#setup-form [name=kind1]').selectOption('human');
  await page.locator('#randomize-start-order').click();await page.locator('#merchant-form button.primary').click();await page.locator('#hands-form button.primary').click();
  await page.evaluate(()=>{game.order=[0,1];game.turn=0;game.round=2;game.used=0;game.players[0].cash=100;render()});
  await page.locator('[data-act=map]').first().click();
  await page.evaluate(()=>record({type:'건설',card:'지역 · Coalbrookdale',city:'Coalbrookdale',industry:'탄광',level:1,resource:0,cost:5,detail:'콜브룩데일 · 탄광 1레벨'}));
  assert.equal(await page.locator('#modal .board-tile').count(),1);
  assert.equal(await page.locator('.map-thumb .board-tile').count(),1);
  assert.equal(await page.evaluate(()=>game.buildings[0].stock),2);
  await page.evaluate(()=>record({type:'연결',card:'지역 · Birmingham',from:'Coalbrookdale',to:'Shrewsbury',links:1,resource:0,cost:3,detail:'콜브룩데일 ↔ 슈루즈베리'}));
  assert.equal(await page.locator('#modal .board-link.canal').count(),1);
  assert.equal(await page.locator('.map-thumb .board-link').count(),1);
  await page.locator('[data-close]').click();await page.locator('[data-act=undo]').click();
  assert.equal(await page.locator('.map-thumb .board-link').count(),0);
  assert.equal(await page.locator('.map-thumb .board-tile').count(),1);
  await page.locator('[data-act=undo]').click();assert.equal(await page.locator('.map-thumb .board-tile').count(),0);
  console.log('PASS: real recorded build/link update thumbnail and open map; undo removes the matching pieces');
  // Consuming the last iron during an actual build must flip its existing tile on the map.
  await page.evaluate(()=>{
   game.buildings=[{id:'iron-source',player:1,city:'Coalbrookdale',industry:'제철소',level:1,slot:1,stock:1,flipped:false,sold:false,builtEra:'canal'}];
   game.players[0].cash=100;game.turn=0;game.used=0;game.awaiting=null;game.pendingDraw=null;render();
   record({type:'건설',card:'지역 · Walsall',city:'Walsall',industry:'양조장',level:1,resource:0,cost:5,detail:'월솔 · 양조장 1레벨',sources:['tile:iron-source']});
  });
  assert.equal(await page.locator('.map-thumb .board-tile.flipped').count(),1);
  await page.locator('[data-act=map]').first().click();await page.locator('[data-map-select]').selectOption('tile:iron-source');
  assert.match(await page.locator('[data-map-inspector]').innerText(),/뒤집힘[\s\S]*철 0개/);
  await page.locator('[data-close]').click();await page.locator('[data-act=undo]').click();
  assert.equal(await page.locator('.map-thumb .board-tile.flipped').count(),0);
  assert.equal(await page.evaluate(()=>game.buildings[0].stock),1);
  // Real double-rail action consumes two coal and one beer; both segments must appear.
  const railResult=await page.evaluate(()=>{
   game.era='rail';game.round=2;game.turn=0;game.used=0;game.awaiting=null;game.pendingDraw=null;game.links=[];game.players[0].cash=100;
   game.buildings=[{id:'rail-coal',player:0,city:'Coalbrookdale',industry:'탄광',level:2,slot:2,stock:2,flipped:false,sold:false,builtEra:'rail'},{id:'rail-beer',player:0,city:'Farm Brewery (Cannock)',industry:'양조장',level:2,slot:0,stock:2,flipped:false,sold:false,builtEra:'rail'}];
   const a={type:'연결',card:'지역 · Birmingham',from:'Coalbrookdale',to:'Shrewsbury',from2:'Coalbrookdale',to2:'Wolverhampton',links:2,resource:0,cost:15,detail:'철도 2개'};
   const plan=resourcePlan(game,game.players[0],a);a.sources=plan.steps.map(s=>s.choice);record(a);
   return {links:game.links.length,stock:game.buildings.map(b=>b.stock),error:plan.error};
  });
  assert.equal(railResult.error,undefined);assert.equal(railResult.links,1);assert.deepEqual(railResult.stock,[0,1]);
  assert.equal(await page.locator('.map-thumb .board-link.rail').count(),2);
  console.log('PASS: actual resource consumption flips tiles, undo restores stock, and real double rail draws both segments');
  await page.locator('[data-act=settings]').first().click();
  await page.locator('#stats-form [name="tile-rail-beer"]').fill('2');
  await page.locator('#stats-form button.primary').click();
  await page.locator('[data-act=map]').first().click();await page.locator('[data-map-select]').selectOption('tile:rail-beer');
  assert.match(await page.locator('[data-map-inspector]').innerText(),/맥주 2개/);
  await page.locator('[data-close]').click();await page.locator('[data-act=undo]').click();
  assert.equal(await page.evaluate(()=>game.buildings.find(b=>b.id==='rail-beer').stock),1);
  console.log('PASS: editing resources in the actual settings form updates the map and can be undone');
  // Example browsing, localization and map selection may never save or mutate the current game.
  await page.evaluate(()=>{game.players[0].name='석탄 <이름>';save();render()});
  const liveSave=await page.evaluate(()=>localStorage.getItem(KEY));
  await page.locator('[data-act=map]').first().click();await page.locator('[data-map-mode=canal]').click();await page.locator('[data-map-mode=rail]').click();await page.locator('[data-map-mode=live]').click();
  await page.locator('[data-map-select]').selectOption('tile:rail-beer');
  await page.evaluate(()=>setUiLang('en'));
  const inspector=await page.locator('[data-map-inspector]').innerText();
  assert.match(inspector,/Farm Brewery \(Cannock\)/);assert.ok(inspector.includes('석탄 <이름>'));
  assert.ok(!/[가-힣]/.test(inspector.replaceAll('석탄 <이름>','')),inspector);
  const untranslated=await page.evaluate(()=>{
   const d=document.getElementById('modal'),w=document.createTreeWalker(d,NodeFilter.SHOW_TEXT),bad=[];let n;
   while(n=w.nextNode())if(!n.parentElement.closest('[data-i18n-ignore]')&&/[가-힣]/.test(n.nodeValue))bad.push(n.nodeValue);
   for(const el of d.querySelectorAll('[aria-label],[alt],[title]'))if(!el.closest('[data-i18n-ignore]'))for(const attr of ['aria-label','alt','title'])if(/[가-힣]/.test(el.getAttribute(attr)||''))bad.push(el.getAttribute(attr));
   return bad;
  });assert.deepEqual(untranslated,[]);
  assert.equal(await page.evaluate(()=>localStorage.getItem(KEY)),liveSave);
  await page.locator('[data-map-mode=rail]').click();await page.locator('[data-map-select]').selectOption('tile:demo-3');
  await page.screenshot({path:process.env.BRASS_MAP_SCREENSHOT||'/tmp/brass-live-map-en.png'});
  for(const viewport of [{width:390,height:844},{width:820,height:1180}]){
   await page.setViewportSize(viewport);await page.waitForTimeout(80);
   assert.ok(await page.evaluate(()=>{const d=document.getElementById('modal');return d.scrollWidth<=d.clientWidth&&document.documentElement.scrollWidth<=innerWidth}),'map dialog overflow');
   await page.locator('[data-map-zoom="50"]').click();await page.locator('[data-map-fit]').click();
   assert.ok(await page.evaluate(()=>{const v=document.querySelector('.board-viewport'),m=v.querySelector('.board-map');return m.clientWidth<=v.clientWidth&&m.clientHeight<=v.clientHeight}),'responsive Fit');
  }
  await page.locator('[data-close]').click();
  console.log('PASS: examples and language changes preserve saves/names; English labels and phone/tablet map layouts');
  // Use a state after confirmed Canal scoring to exercise the real era cleanup path.
  await page.evaluate(()=>{
   game.era='canal';game.awaiting='era-scored';game.setupStep=null;game.buildings=[{id:'keep',player:0,city:'Birmingham',industry:'제조품',level:2,slot:0,stock:0,flipped:true,sold:true,builtEra:'canal'},{id:'remove',player:1,city:'Birmingham',industry:'제조품',level:1,slot:1,stock:0,flipped:true,sold:true,builtEra:'canal'}];
   game.links=[{player:0,era:'canal',from:'Birmingham',to:'Walsall'}];next();
  });
  await page.locator('[data-act=map]').first().click();
  assert.equal(await page.locator('#modal .board-tile').count(),1);assert.equal(await page.locator('#modal .board-link').count(),0);
  assert.equal(await page.evaluate(()=>game.era),'rail');assert.ok(await page.locator('[data-map-item="tile:keep"]').count());
  await page.locator('[data-close]').click();
  await context.setOffline(true);await page.reload();await page.locator('[data-act=map]').first().click();
  assert.equal(await page.locator('#modal .board-tile').count(),1);
  assert.deepEqual(errors,[]);
  console.log('PASS: actual era cleanup keeps Level 2+ tiles, removes canals/Level 1, and offline reload restores map');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
