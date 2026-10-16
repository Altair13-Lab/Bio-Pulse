/** Shared numeric notation used in both Kazakh and Russian; independent of ICU locale coverage. */
export function formatNumber(value:number,digits=1):string{
 if(!Number.isFinite(value))return '—';
 const [whole,fraction]=value.toFixed(digits).split('.');
 return whole.replace(/\B(?=(\d{3})+(?!\d))/g,'\u00a0')+(fraction===undefined?'':','+fraction);
}
export function formatTime(value:string,full=false):string{
 const date=new Date(Date.parse(value)+5*3600000);
 if(!Number.isFinite(date.getTime()))return '—';
 const p=(n:number)=>String(n).padStart(2,'0');
 return (full?`${p(date.getUTCDate())}.${p(date.getUTCMonth()+1)} `:'')+`${p(date.getUTCHours())}:${p(date.getUTCMinutes())}`;
}
