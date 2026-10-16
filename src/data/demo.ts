import type {Period,SensorMessage} from '../lib/types';
export const SAMPLE_MS=5*60*1000;
export const DEMO_EPOCH=Date.parse('2026-10-01T12:00:00+05:00');
export const sampleCounts:Record<Period,number>={hour:12,day:288,week:2016};
const noise=(i:number,seed:number)=>{let x=Math.imul(i+seed,1597334677);x^=x>>>13;return (x>>>0)/4294967295-.5;};
const round=(n:number,d=1)=>Number(n.toFixed(d));
export function sampleAt(index:number):SensorMessage{
 const time=DEMO_EPOCH+index*SAMPLE_MS;const phase=(index%288)/288*Math.PI*2;
 const gap=(offset:number)=>Math.abs(index+offset)%43===0;
 return {timestamp:new Date(time).toISOString(),deviceId:'biopulse-demo-01',source:'demo',
  temperatureC:gap(3)?null:round(23+3.2*Math.sin(phase)+noise(index,9)*.6),
  humidityPct:gap(8)?null:round(58-8*Math.sin(phase+.3)+noise(index,7)*2),
  pressureHpa:gap(17)?null:round(1011+2.8*Math.sin(index/110)+noise(index,3)*.3),
  illuminanceLux:gap(21)?null:Math.round(Math.max(0,1200+950*Math.sin(phase+.5)+noise(index,12)*70)),
  soilRaw:gap(12)?null:Math.round(2050+180*Math.sin(index/150)+noise(index,1)*20),
  soilRelativePct:gap(12)?null:round(48-7*Math.sin(index/150)+noise(index,1)),
  audioRms:gap(6)?null:round(.13+.035*Math.sin(index/12)+Math.abs(noise(index,5))*.07,3),
  qualityFlags:[gap(3)||gap(8)||gap(17)||gap(21)||gap(12)||gap(6)?'synthetic_gap':'synthetic_sample']};
}
export function generateDemo(period:Period,cursor:number):SensorMessage[]{
 if(!Number.isSafeInteger(cursor)||cursor<0)throw new Error('Invalid cursor');
 return Array.from({length:sampleCounts[period]},(_,i)=>sampleAt(cursor-sampleCounts[period]+i+1));
}
