export type Language='kk'|'ru';
export type SensorMessage={timestamp:string;deviceId:string;source:'demo'|'live';temperatureC:number|null;humidityPct:number|null;pressureHpa:number|null;illuminanceLux:number|null;soilRaw:number|null;soilRelativePct:number|null;audioRms:number|null;qualityFlags:string[]};
export type MetricKey='temperatureC'|'humidityPct'|'pressureHpa'|'illuminanceLux'|'soilRelativePct'|'audioEnergy';
export type SourceMode='demo'|'live';
export type Period='hour'|'day'|'week';
export type ViewMode='closed'|'open'|'exploded';
export type BudgetRow={id:string;quantity:number;priceMinor:number|null};
