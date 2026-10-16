import type {SensorMessage} from './types';
const ranges={temperatureC:[-100,150],humidityPct:[0,100],pressureHpa:[100,1500],illuminanceLux:[0,2000000],soilRaw:[0,Number.MAX_SAFE_INTEGER],soilRelativePct:[0,100],audioRms:[0,1]} as const;
export type ValidationResult={ok:true;data:SensorMessage}|{ok:false;issues:string[]};
/** Structural checks, not a claim about sensor accuracy or final hardware ranges. */
export function validateMessage(input:unknown):ValidationResult{
 const issues:string[]=[];
 if(!input||typeof input!=='object'||Array.isArray(input))return {ok:false,issues:['message']};
 const v=input as Record<string,unknown>;
 if(typeof v.timestamp!=='string'||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v.timestamp)||!Number.isFinite(Date.parse(v.timestamp)))issues.push('timestamp');
 if(typeof v.deviceId!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(v.deviceId))issues.push('deviceId');
 if(v.source!=='demo'&&v.source!=='live')issues.push('source');
 for(const [key,[min,max]] of Object.entries(ranges)){const value=v[key];if(value!==null&&(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max))issues.push(key);}
 if(!Array.isArray(v.qualityFlags)||v.qualityFlags.length>32||!v.qualityFlags.every(f=>typeof f==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(f)))issues.push('qualityFlags');
 return issues.length?{ok:false,issues}:{ok:true,data:v as SensorMessage};
}
