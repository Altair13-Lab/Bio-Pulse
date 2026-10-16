import type {MetricKey} from '../lib/types';
import type {TranslationKey} from '../i18n/ru';
export const metrics:{key:MetricKey;label:TranslationKey;unit:TranslationKey|'°C'|'%';color:string;digits:number}[]=[
 {key:'temperatureC',label:'metric.temperatureC',unit:'°C',color:'#187f6b',digits:1},
 {key:'humidityPct',label:'metric.humidityPct',unit:'%',color:'#328fa0',digits:1},
 {key:'pressureHpa',label:'metric.pressureHpa',unit:'common.hpa',color:'#8675a5',digits:1},
 {key:'illuminanceLux',label:'metric.illuminanceLux',unit:'common.lux',color:'#b18436',digits:0},
 {key:'soilRelativePct',label:'metric.soilRelativePct',unit:'%',color:'#71905b',digits:1},
 {key:'audioEnergy',label:'metric.audioEnergy',unit:'common.unitless',color:'#af7963',digits:3},
];
