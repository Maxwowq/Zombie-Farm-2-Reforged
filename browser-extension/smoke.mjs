import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const extension = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(extension);
const { chromium } = process.env.ZF_PLAYWRIGHT_MODULE
  ? await import(pathToFileURL(process.env.ZF_PLAYWRIGHT_MODULE).href) : await import('playwright');
const dist = process.env.ZF_TEST_DIST;
if (!dist) throw Error('Set ZF_TEST_DIST to the directory served at http://localhost:4180.');
const fixture = `<!doctype html><meta http-equiv="Content-Security-Policy" content="script-src 'self'; style-src 'self' 'unsafe-inline'"><title>Settings</title>
<p id="timer">2h</p><p id="level">🔒 Lvl 13</p><h1 id="heading">Settings</h1><p id="dynamic">Level 8</p><button id="button" title="Harvest">Market</button>
<input id="input" value="Carrots" placeholder="Search"><select id="select"><option>Harvest</option></select>
<div class="fr-friend-name">Carrots</div><div class="zcard-board">Daisy</div><div class="ann-body">Carrots</div>
<section class="qdetail" id="quest-fixture"><h2>Tomato Farmin'</h2><div class="qobj">◆ Plant 10 Tomatoes  (0/10)</div><div class="qobj done">✓ Harvest 10 Tomatoes  (10/10)</div><div class="qlog-reward">Reward: 20 XP</div><button class="pq-claim">Claim</button><span class="pq-claimed">✓ Claimed</span></section><pre>Settings</pre><canvas width="240" height="64" id="canvas"></canvas>`;
await fs.writeFile(path.join(dist, 'extension-fixture.html'), fixture);
await fs.mkdir(path.join(root, 'tmp'), {recursive:true});
const profile = await fs.mkdtemp(path.join(root, 'tmp/edge-extension-smoke-'));
const context = await chromium.launchPersistentContext(profile, {
  executablePath: process.env.ZF_BROWSER_EXECUTABLE || '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  headless:true, viewport:{width:1280,height:800}, locale:'en-US',
  ignoreDefaultArgs:['--disable-extensions'],
  args:['--enable-unsafe-extension-debugging','--disable-background-networking'],
});
const errors = [];
const page = context.pages()[0];
page.on('pageerror', e=>errors.push(e.message));
try {
  const cdp = await context.browser().newBrowserCDPSession();
  const loaded = await cdp.send('Extensions.loadUnpacked', {path:path.join(extension,'dist')});
  assert(loaded.id);
  await page.addInitScript(()=>{localStorage.setItem('zf2r.play-mode.v1','local');localStorage.setItem('zf-extension-canary','Carrots');});
  await page.goto('http://localhost:4180/extension-fixture.html');
  await page.waitForFunction(()=>document.querySelector('#heading').textContent==='设置');
  assert.equal(await page.locator('#button').innerText(),'市场');
  assert.equal(await page.locator('#button').getAttribute('title'),'收获');
  assert.equal(await page.locator('#input').inputValue(),'Carrots');
  assert.equal(await page.locator('#input').getAttribute('placeholder'),'搜索');
  assert.equal(await page.locator('#select').inputValue(),'Harvest');
  assert.equal(await page.locator('#select option').innerText(),'收获');
  assert.equal(await page.locator('.fr-friend-name').innerText(),'Carrots');
  assert.equal(await page.locator('.zcard-board').innerText(),'Daisy');
  assert.equal(await page.locator('.ann-body').innerText(),'Carrots');
  assert.equal(await page.locator('pre').innerText(),'Settings');
  assert(!/[A-Za-z]{3}/.test(await page.locator('#quest-fixture').innerText()));
  assert((await page.locator('#quest-fixture .qobj').first().textContent()).endsWith('  (0/10)'));
  assert.equal(await page.locator('#quest-fixture .pq-claim').innerText(),'领取');
  assert.equal(await page.locator('#dynamic').innerText(),'8级');
  assert.equal(await page.locator('#timer').innerText(),'2小时');
  assert.equal(await page.locator('#level').innerText(),'🔒 13级');
  await page.evaluate(()=>document.querySelector('#dynamic').textContent='Level 12');
  await page.waitForFunction(()=>document.querySelector('#dynamic').textContent==='12级');
  const canvas = await page.evaluate(()=>{
    function compare(Context, a, b){
      const left=new Context(240,64),right=new Context(240,64);
      const l=left.getContext('2d'),r=right.getContext('2d');
      l.font=r.font='22px sans-serif';
      const lw=l.measureText(a).width,rw=r.measureText(b).width;
      l.fillText(a,8,28);r.fillText(b,8,28);l.strokeText(a,8,56);r.strokeText(b,8,56);
      const ld=l.getImageData(0,0,240,64).data,rd=r.getImageData(0,0,240,64).data;
      return {widthEqual:lw===rw,pixelsEqual:ld.every((v,i)=>v===rd[i]),width:lw};
    }
    function HtmlCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
    const result={html:compare(HtmlCanvas,'Plow','犁'),offscreen:compare(OffscreenCanvas,'Harvest','收获')};
    const c=document.querySelector('#canvas').getContext('2d');c.font='22px sans-serif';c.fillText('Plow',8,28);c.fillText('Harvest',8,56);
    return result;
  });
  assert(canvas.html.widthEqual&&canvas.html.pixelsEqual);
  assert(canvas.offscreen.widthEqual&&canvas.offscreen.pixelsEqual);
  assert.equal(await page.evaluate(()=>localStorage.getItem('zf-extension-canary')),'Carrots');
  assert.equal(await page.evaluate(()=>localStorage.getItem('zf2r.play-mode.v1')),'local');
  await page.screenshot({path:path.join(root,'tmp/extension-fixture.png')});
  console.log('PASS: actual unpacked extension under page CSP; DOM, attributes, dynamic updates, input/option values, names, announcements, Canvas + OffscreenCanvas pixels/metrics, localStorage canary.',canvas);
  await page.goto('http://localhost:4180/');
  await page.locator('#bootStatus.ready').waitFor({timeout:90000});
  assert.equal(await page.evaluate(()=>typeof window.ZF),'undefined');
  await page.locator('#boot').click();await page.waitForTimeout(700);
  if(await page.locator('.tut-skip').count()) {await page.locator('.tut-skip').click();await page.locator('.tut-skip').click();}
  await page.waitForTimeout(700);
  await page.locator('[data-menu="Market"]').click();await page.waitForTimeout(700);
  const market=await page.locator('.mkt').innerText();
  assert(market.includes('市场')&&market.includes('胡萝卜'));
  assert(!/Lvl \d|\b\d+[dhms]\b/.test(market));
  await fs.writeFile(path.join(root,'tmp/extension-market.txt'),market);
  await page.screenshot({path:path.join(root,'tmp/extension-market.png')});
  await page.locator('.mkt-close').click();
  await page.evaluate(()=>{
    window.__extensionDrawCalls=[];
    for(const prototype of [CanvasRenderingContext2D.prototype,OffscreenCanvasRenderingContext2D.prototype]) {
      const original=prototype.fillText;
      prototype.fillText=function(text,...args){if(typeof text==='string'&&/[A-Za-z]{2}/.test(text)) window.__extensionDrawCalls.push({text,font:this.font});return Reflect.apply(original,this,[text,...args]);};
    }
  });
  await page.keyboard.press('4');
  for(const [x,y]of [[810,360],[850,460],[780,420],[630,520],[800,530],[600,530]]) {
    await page.mouse.click(x,y);await page.waitForTimeout(500);
    if(await page.evaluate(()=>window.__extensionDrawCalls.some(c=>c.text==='Plow'&&c.font.includes('15px')))) break;
  }
  await page.waitForFunction(()=>window.__extensionDrawCalls.some(c=>c.text==='Plow'&&c.font.includes('15px')),null,{timeout:15000});
  await page.screenshot({path:path.join(root,'tmp/extension-plow.png')});
  console.log('PASS: actual upstream farming work bar passed Plow through the installed Canvas translator.');
  // Raise only the generated offline test farm, then let the real client author
  // daily/weekly quests. No debug game handle or production account is used.
  await page.waitForTimeout(1800);
  await page.addInitScript(()=>{
    if(localStorage.getItem('extension-test-level-seeded')) return;
    const key='zf2r.local.save.v1::'+JSON.parse(localStorage.getItem('zf2r.profiles.v1')).activeId;
    if(!key)throw Error('Missing generated test save');
    const save=JSON.parse(localStorage.getItem(key));save.player.xp=4500;
    delete save.periodicQuests;delete save.farmJobs;localStorage.setItem(key,JSON.stringify(save));
    localStorage.setItem('extension-test-level-seeded','1');
  });
  async function reopen(){
    await page.reload();await page.locator('#bootStatus.ready').waitFor({timeout:90000});
    await page.locator('#boot').click();await page.waitForTimeout(1000);
  }
  await reopen();
  await page.keyboard.press('q');await page.locator('.questlog').waitFor();await page.waitForTimeout(500);
  const objectives=await page.locator('.qlog-obj').allTextContents();
  assert(objectives.length>0&&objectives.every(t=>!/[A-Za-z]{3}/.test(t)),JSON.stringify(objectives));
  await page.screenshot({path:path.join(root,'tmp/extension-quests.png')});
  await page.locator('.questlog .panelclose').click();
  await page.waitForFunction(()=>{
    const key='zf2r.local.save.v1::'+JSON.parse(localStorage.getItem('zf2r.profiles.v1')).activeId;
    return key&&JSON.parse(localStorage.getItem(key)).periodicQuests?.daily;
  },null,{timeout:10000});
  await page.addInitScript(()=>{
    if(localStorage.getItem('extension-test-completion-seeded')) return;
    const key='zf2r.local.save.v1::'+JSON.parse(localStorage.getItem('zf2r.profiles.v1')).activeId;
    const save=JSON.parse(localStorage.getItem(key));
    save.periodicQuests.daily.counts[0]=save.periodicQuests.daily.quests[0].countTotal;
    save.periodicQuests.daily.claimed=[];localStorage.setItem(key,JSON.stringify(save));
    localStorage.setItem('extension-test-completion-seeded','1');
  });
  await reopen();await page.locator('.qperiodic').click();await page.locator('.pq-daily').waitFor();
  await page.waitForTimeout(500);
  const periodic=await page.locator('.pq-text').allTextContents();
  assert(periodic.length>=5&&periodic.every(t=>!/[A-Za-z]{3}/.test(t)),JSON.stringify(periodic));
  assert.deepEqual(await page.locator('.pq-title').allTextContents(),['每日任务','每周任务']);
  assert.equal(await page.locator('.pq-daily .pq-claim').first().innerText(),'领取');
  await page.screenshot({path:path.join(root,'tmp/extension-daily.png')});
  await page.locator('.pq-daily .pq-claim').first().click();
  await page.waitForFunction(()=>[...document.querySelectorAll('.pq-daily .pq-claimed')].some(e=>e.textContent.includes('已领取')));
  await page.screenshot({path:path.join(root,'tmp/extension-daily-claimed.png')});
  const canonical=await page.evaluate(()=>{
    const key='zf2r.local.save.v1::'+JSON.parse(localStorage.getItem('zf2r.profiles.v1')).activeId;
    return JSON.parse(localStorage.getItem(key)).periodicQuests.daily.quests[0].text;
  });
  assert(/[A-Za-z]{3}/.test(canonical));
  console.log('PASS: actual quest log objectives, daily/weekly tasks, Claim → 领取, live claim → 已领取, canonical English saved objective preserved.');
  console.log('PASS: unmodified upstream production build, no window.ZF, translated Market + Carrots; errors:',errors);
  assert.deepEqual(errors,[]);
} catch(error) {
  await page.screenshot({path:path.join(root,'tmp/extension-quest-failure.png')});
  await fs.writeFile(path.join(root,'tmp/extension-quest-failure.txt'),await page.locator('body').innerText());
  throw error;
} finally {
  await context.close();
  await fs.rm(profile,{recursive:true,force:true});
}
