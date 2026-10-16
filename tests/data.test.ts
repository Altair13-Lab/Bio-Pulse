import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemo,sampleAt,sampleCounts,SAMPLE_MS} from '../src/data/demo.ts';
import {adapterFor} from '../src/data/adapter.ts';
import {validateMessage} from '../src/lib/validation.ts';
import {toCsv} from '../src/lib/csv.ts';
import {ru} from '../src/i18n/ru.ts';
import {kk} from '../src/i18n/kk.ts';
import {materials,isAvailable} from '../src/config/materials.ts';
import {existsSync,readdirSync} from 'node:fs';
import path from 'node:path';
test('synthetic values are deterministic, all periods end at the same cursor',()=>{
 assert.deepEqual(generateDemo('day',12),generateDemo('day',12));
 for(const period of ['hour','day','week'] as const){const rows=generateDemo(period,100);assert.equal(rows.length,sampleCounts[period]);assert.deepEqual(rows.at(-1),sampleAt(100));assert.equal(Date.parse(rows[1].timestamp)-Date.parse(rows[0].timestamp),SAMPLE_MS);assert(rows.every(r=>r.source==='demo'&&validateMessage(r).ok));}
 assert.throws(()=>generateDemo('day',-1));
});
test('gaps are null and carry quality flags; they are not replaced by zero',()=>{
 const rows=generateDemo('week',0);assert(rows.some(r=>r.temperatureC===null));assert(rows.some(r=>r.audioRms===null));assert(rows.some(r=>r.soilRelativePct===null));
 const missing=rows.find(r=>r.temperatureC===null)!;assert(missing.qualityFlags.includes('synthetic_gap'));
 assert(rows.every(r=>r.audioRms===null||(r.audioRms>=0&&r.audioRms<=1)));
});
test('live adapter is disconnected and does not supply synthetic data',()=>{
 assert.deepEqual(adapterFor('live').read('day',0),{status:'not-connected',rows:[]});assert.equal(adapterFor('demo').read('hour',0).status,'demo');
});
test('future sensor messages reject malformed fields and accept explicit nulls',()=>{
 const valid=sampleAt(0);assert(validateMessage(valid).ok);
 for(const bad of [null,[],{}, {...valid,temperatureC:NaN},{...valid,audioRms:1.1},{...valid,humidityPct:101},{...valid,soilRelativePct:-1},{...valid,pressureHpa:'1000'},{...valid,source:'fake'},{...valid,timestamp:'not-a-date'},{...valid,timestamp:'2026-10-01T12:00:00'},{...valid,deviceId:'email@example.com'},{...valid,qualityFlags:[{}]},{...valid,soilRaw:undefined}])assert.equal(validateMessage(bad).ok,false);
 const empty={...valid,temperatureC:null,humidityPct:null,pressureHpa:null,illuminanceLux:null,soilRaw:null,soilRelativePct:null,audioRms:null};assert(validateMessage(empty).ok);
});
test('CSV retains source=demo, translated headings, units, gaps and Unicode',()=>{
 const rows=[{...sampleAt(0),temperatureC:null}];
 const csv=toCsv(rows,'kk');assert(csv.startsWith('\uFEFF'));assert(csv.includes('"demo"'));assert(csv.includes(kk['metric.temperatureC']));assert(csv.includes('[°C]'));assert(csv.includes(',"",'));assert(csv.includes('qualityFlags'));assert(csv.endsWith('\r\n'));
 const russian=toCsv(rows,'ru');assert(russian.includes(ru['metric.humidityPct']));assert(!russian.includes(kk['metric.humidityPct']));assert.equal(csv.split('\r\n').length,3);
 assert.equal(toCsv([],'kk').split('\r\n').length,2);
});
test('translation dictionaries have identical nonempty keys and preserve Kazakh characters',()=>{
 assert.deepEqual(Object.keys(ru).sort(),Object.keys(kk).sort());assert(Object.values(kk).every(v=>typeof v==='string'&&v.length));
 for(const letter of ['Ә','Ғ','Қ','Ң','Ө','Ұ','Ү','І'])assert(Object.values(kk).join(' ').toLocaleUpperCase('kk').includes(letter));
});
test('available materials exist; absent CAD/STL/PPTX/PDF/GLB never yield a download',()=>{
 const root=path.join(process.cwd(),'public');const files=(dir:string,base=''):string[]=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name),base+'/'+e.name):[base+'/'+e.name]);const publicFiles=files(root);
 for(const item of materials){for(const file of Object.values(item.file)){assert.equal(isAvailable(file,publicFiles),existsSync(path.join(root,file)));}}
 assert(isAvailable('/materials/BOM-kk.csv',publicFiles));assert(!isAvailable('/models/biopulse.glb',publicFiles));
});

test('browser storage failures and malformed JSON have safe fallbacks',async()=>{
 const {safeRead,safeWrite}=await import('../src/lib/storage.ts');
 const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 try{
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>'{broken',setItem:()=>{throw new Error('quota');}}});
  assert.equal(safeRead('test'),null);assert.equal(safeWrite('test',{}),false);
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('denied');}});
  assert.equal(safeRead('test'),null);assert.equal(safeWrite('test',{}),false);
 }finally{if(original)Object.defineProperty(globalThis,'localStorage',original);else Reflect.deleteProperty(globalThis,'localStorage');}
});

test('date and number display avoids untranslated ICU fallback month names',async()=>{
 const {formatNumber,formatTime}=await import('../src/lib/format.ts');
 assert.equal(formatNumber(1011.25,2),'1\u00a0011,25');assert.equal(formatTime('2026-10-01T07:15:00Z',true),'01.10 12:15');assert.equal(formatTime('invalid'),'—');
});

test('relative audio energy is derived from RMS; missing sound stays null',async()=>{
 const {metricValue}=await import('../src/lib/metrics.ts');
 assert.equal(metricValue({...sampleAt(0),audioRms:.5},'audioEnergy'),.25);
 assert.equal(metricValue({...sampleAt(0),audioRms:null},'audioEnergy'),null);
 assert.equal(metricValue(undefined,'audioEnergy'),null);
});
