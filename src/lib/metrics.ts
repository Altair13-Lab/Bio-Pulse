import type {MetricKey,SensorMessage} from './types';
/** Mean-square digital signal as a dimensionless relative-energy indicator, not calibrated SPL. */
export function metricValue(row:SensorMessage|undefined,key:MetricKey):number|null{
 if(!row)return null;
 if(key==='audioEnergy')return row.audioRms===null?null:Number((row.audioRms**2).toFixed(6));
 return row[key];
}
