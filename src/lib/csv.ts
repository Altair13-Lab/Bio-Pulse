import type {Language,SensorMessage} from './types';
import {metricValue} from './metrics';
import {metrics} from '../config/metrics';
import {ru,type TranslationKey} from '../i18n/ru';
import {kk} from '../i18n/kk';
const escape=(value:unknown)=>{const s=value===null?'':String(value);return '"'+s.replaceAll('"','""')+'"';};
export function toCsv(rows:SensorMessage[],language:Language):string{
 const dict=language==='kk'?kk:ru;
 const unit=(u:TranslationKey|'°C'|'%')=>u==='°C'||u==='%'?u:dict[u];
 const headings=['timestamp [ISO 8601]','deviceId','source',...metrics.map(m=>`${m.key} — ${dict[m.label]} [${unit(m.unit)}]`),`soilRaw [${dict['common.raw']}]`,`audioRms — ${dict['metric.audioRms']} [0–1]`,'qualityFlags'];
 const records=rows.map(r=>[r.timestamp,r.deviceId,r.source,...metrics.map(m=>metricValue(r,m.key)),r.soilRaw,r.audioRms,r.qualityFlags.join('|')]);
 return '\uFEFF'+[headings,...records].map(row=>row.map(escape).join(',')).join('\r\n')+'\r\n';
}
export function downloadCsv(csv:string,name:string){
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
