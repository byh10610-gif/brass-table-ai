const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const context = vm.createContext({});
vm.runInContext("let uiLang='en';"+html.slice(html.indexOf('const LANGUAGE_PACKS ='),html.indexOf('const LANG_KEY=')),context);
const t=s=>vm.runInContext('translateUiText('+JSON.stringify(s)+')',context);
test('complete instructions, validation messages and industry names',()=>{
 assert.equal(t('양조장'),'Brewery');
 assert.equal(t('산업 · 양조장'),'Industry · Brewery');
 assert.equal(t('현금이 부족합니다.'),'Not enough cash.');
 assert.equal(t('은행에서 £30을 받으세요.'),'Take £30 from the bank.');
 assert.equal(t('내 산업 타일 제철소 1레벨을 콜브룩데일에 놓으세요.'),'Place your Level 1 Iron Works industry tile in Coalbrookdale.');
});
test('composed saved action details and occupied board spaces',()=>{
 assert.equal(t('버밍엄 · 제조품 2레벨 · 시장에 철 2개 판매 +£4'),'Birmingham · Manufacturer Level 2 · Sell 2 Iron to Market +£4');
 assert.equal(t('1번 칸: 제조품 또는 양조장 · Friend의 양조장 점유 중'),"Space 1: Manufacturer or Brewery · Occupied by Friend's Brewery");
});
test('user names that equal a game term remain verbatim',()=>{
 assert.equal(t('석탄 이름 수정'),'Rename 석탄');
 assert.equal(t('버밍엄 · 석탄 맥주'),'Birmingham · 석탄 Beer');
 assert.equal(t('버밍엄 · 석탄의 양조장에서 맥주 2개 (잔량 2→0)'),"Birmingham · 2 Beer from 석탄's Brewery (remaining 2→0)");
});
test('every English catalog entry contains English text and matching parameters',()=>{
 const entries=vm.runInContext('Object.entries(LANGUAGE_PACKS.en.messages)',context);
 for(const [source,target]of entries){
  assert.ok(!/[가-힣]/.test(target),source);
  const slots=s=>[...new Set([...s.matchAll(/\{(\d+)\}/g)].map(m=>m[1]))].sort();
  assert.deepEqual(slots(source),slots(target),source);
 }
});
test('Korean text is restored without changing canonical identifiers',()=>{
 vm.runInContext("uiLang='ko'",context);assert.equal(t('시작 순서 뽑기'),'시작 순서 뽑기');vm.runInContext("uiLang='en'",context);
 assert.ok(html.includes("KEY='brass-birmingham-table-ai-v1'"));
 assert.ok(html.includes("RECORDS_KEY='brass-birmingham-completed-games-v1'"));
});
test('application, PWA and release versions agree',()=>{
 const release=JSON.parse(fs.readFileSync(path.join(__dirname,'../version.json'))).version;
 const sw=fs.readFileSync(path.join(__dirname,'../service-worker.js'),'utf8');
 assert.ok(html.includes("APP_VERSION='"+release+"'"));assert.ok(sw.includes("APP_VERSION = '"+release+"'"));assert.ok(html.includes('const PWA_APP_VERSION = APP_VERSION;'));
 for(const [i,m]of [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].entries())assert.doesNotThrow(()=>new vm.Script(m[1]),'script '+i);
});
