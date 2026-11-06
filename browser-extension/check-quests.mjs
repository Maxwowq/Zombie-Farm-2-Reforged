import assert from 'node:assert/strict';
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await fs.mkdir(path.join(root, 'tmp'), {recursive:true});
const directory = await fs.mkdtemp(path.join(root, 'tmp/quest-check-'));
try {
  for (const [entry, file] of [['browser-extension/src/translate.ts', 'translate'], ['src/quest/periodic/generate.ts', 'generate']]) {
    await build({entryPoints:[path.join(root,entry)],outfile:path.join(directory,file+'.mjs'),bundle:true,platform:'node',format:'esm'});
  }
  const { translate } = await import(pathToFileURL(path.join(directory,'translate.mjs')));
  const { generatePeriodicSet } = await import(pathToFileURL(path.join(directory,'generate.mjs')));
  const cases = new Set();
  for (const file of ['quests.json','quests_reforged.json']) {
    const catalog = JSON.parse(await fs.readFile(path.join(root,'public/assets',file),'utf8'));
    for (const quest of Object.values(catalog)) {
      for (const text of [quest.title,quest.tip,quest.messageComplete]) if(text) cases.add(text);
      cases.add(`${quest.title} (0/${quest.requirements.length})`);
      for (const objective of quest.requirements) {
        cases.add(objective.text);
        cases.add(`◆ ${objective.text}  (0/${objective.countTotal})`);
        cases.add(`✓ ${objective.text}  (${objective.countTotal}/${objective.countTotal})`);
      }
    }
  }
  for (const level of [5,9,10,14,15,20,25,30,35,40,44,45]) for (let period=20000;period<20064;period++) {
    for (const scope of level<15?['daily']:['daily','weekly']) {
      const set = generatePeriodicSet({accountId:'extension-test',scope,period,level,xpToNext:1000});
      for (const quest of set.quests) {
        cases.add(quest.text);
        cases.add(`◆ ${quest.text} (0/${quest.countTotal})`);
      }
    }
  }
  const untranslated = [...cases].map(source=>({source,result:translate(source)})).filter(({result})=>/[A-Za-z]{3}/.test(result));
  assert.deepEqual(untranslated,[],JSON.stringify(untranslated.slice(0,10),null,2));
  assert.equal(translate('Claim'),'领取');
  assert.equal(translate('Claimed'),'已领取');
  assert.equal(translate('Daily'),'每日任务');
  assert.equal(translate('Weekly'),'每周任务');
  assert(translate('✓ Claimed').includes('已领取'));
  assert.equal(translate('Reward: 20 XP'),'奖励：20经验值');
  assert.equal(translate('Resets in 2h 05m'),'2小时 05分钟后重置');
  assert(translate('◆ Harvest 12 Carrots  (3/12)').endsWith('  (3/12)'));
  assert.equal(translate('◆ an unknown quest  (3/12)'),'◆ an unknown quest  (3/12)');
  console.log(`PASS: ${cases.size} distinct catalog/generated quest strings, decorated objectives, title counters; Claim/Claimed, reward XP and reset durations.`);
} finally { await fs.rm(directory,{recursive:true,force:true}); }
