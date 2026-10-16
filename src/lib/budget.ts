import type {BudgetRow} from './types';
export function parsePrice(value:string):number|null{
 if(!value.trim())return null;
 const v=value.trim().replace(',','.');
 if(!/^\d{1,8}(\.\d{1,2})?$/.test(v))throw new Error('price');
 const [whole,fraction='']=v.split('.');return Number(whole)*100+Number(fraction.padEnd(2,'0'));
}
export function isBudgetRow(row:unknown):row is BudgetRow{
 if(!row||typeof row!=='object')return false;const r=row as BudgetRow;
 return typeof r.id==='string'&&Number.isInteger(r.quantity)&&r.quantity>=1&&r.quantity<=100&&(r.priceMinor===null||(Number.isSafeInteger(r.priceMinor)&&r.priceMinor>=0&&r.priceMinor<=9999999999));
}
export function calculateBudget(rows:BudgetRow[],reservePct:number){
 if(!rows.every(isBudgetRow)||!Number.isInteger(reservePct)||reservePct<0||reservePct>100)throw new Error('budget');
 const subtotal=rows.reduce((sum,row)=>sum+row.quantity*(row.priceMinor??0),0);
 const reserve=Math.round(subtotal*reservePct/100);const unknown=rows.filter(r=>r.priceMinor===null).length;
 return {subtotal,reserve,total:subtotal+reserve,unknown};
}
export function restoreBudget(input:unknown,defaults:BudgetRow[]):{rows:BudgetRow[];reservePct:number}{
 if(!input||typeof input!=='object')return {rows:defaults,reservePct:10};
 const {rows,reservePct}=input as {rows:unknown;reservePct:unknown};
 if(!Array.isArray(rows)||rows.length!==defaults.length||!rows.every(isBudgetRow)||new Set(rows.map(r=>r.id)).size!==defaults.length||!defaults.every(d=>rows.some(r=>r.id===d.id))||!Number.isInteger(reservePct)||Number(reservePct)<0||Number(reservePct)>100)return {rows:defaults,reservePct:10};
 return {rows:defaults.map(d=>rows.find(r=>r.id===d.id)!),reservePct:Number(reservePct)};
}
