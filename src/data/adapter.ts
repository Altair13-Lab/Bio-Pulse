import {generateDemo} from './demo';
import type {Period,SensorMessage,SourceMode} from '../lib/types';
export type DataResult={status:'demo'|'not-connected';rows:SensorMessage[]};
export interface DataAdapter{read(period:Period,cursor:number):DataResult;}
export const demoAdapter:DataAdapter={read:(period,cursor)=>({status:'demo',rows:generateDemo(period,cursor)})};
export const liveAdapter:DataAdapter={read:()=>({status:'not-connected',rows:[]})};
export const adapterFor=(mode:SourceMode):DataAdapter=>mode==='demo'?demoAdapter:liveAdapter;
