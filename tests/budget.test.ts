import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateBudget,parsePrice,restoreBudget} from '../src/lib/budget.ts';
const defaults=[{id:'a',quantity:1,priceMinor:null},{id:'b',quantity:3,priceMinor:null}];
test('money uses minor units; accepts commas and distinguishes missing prices from zero',()=>{
 assert.equal(parsePrice('0.10'),10);assert.equal(parsePrice('0,20'),20);assert.equal(parsePrice(''),null);assert.equal(parsePrice('0'),0);
 const sum=calculateBudget([{id:'a',quantity:1,priceMinor:parsePrice('0.10')},{id:'b',quantity:1,priceMinor:parsePrice('0.20')}],10);
 assert.deepEqual(sum,{subtotal:30,reserve:3,total:33,unknown:0});
});
test('quantity, reserve and incomplete totals are separate; reserve is rounded to a tiyn',()=>{
 assert.deepEqual(calculateBudget([{id:'a',quantity:3,priceMinor:105},{id:'b',quantity:2,priceMinor:null}],15),{subtotal:315,reserve:47,total:362,unknown:1});
 assert.deepEqual(calculateBudget(defaults,10),{subtotal:0,reserve:0,total:0,unknown:2});
 assert.equal(calculateBudget([{id:'a',quantity:1,priceMinor:0}],0).unknown,0);
});
test('invalid money and invalid quantities do not produce misleading totals',()=>{
 for(const value of ['-1','1.001','1e3','NaN','Infinity','abc','100000000'])assert.throws(()=>parsePrice(value));
 for(const quantity of [0,-1,101,1.5,NaN])assert.throws(()=>calculateBudget([{id:'a',quantity,priceMinor:100}],10));
 for(const reserve of [-1,101,1.5,NaN])assert.throws(()=>calculateBudget(defaults,reserve));
});
test('untrusted saved settings are validated against the actual component IDs',()=>{
 for(const value of [null,'broken',{rows:[]},{rows:[defaults[0],defaults[0]],reservePct:10},{rows:[{id:'alien',quantity:1,priceMinor:20},defaults[1]],reservePct:10},{rows:defaults,reservePct:Infinity}])assert.deepEqual(restoreBudget(value,defaults),{rows:defaults,reservePct:10});
 const saved={rows:[{...defaults[1],priceMinor:50},{...defaults[0],priceMinor:200}],reservePct:20};
 assert.deepEqual(restoreBudget(saved,defaults).rows.map(r=>r.id),['a','b']);assert.equal(restoreBudget(saved,defaults).rows[1].priceMinor,50);
});
