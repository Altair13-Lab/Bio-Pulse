import {createContext,useContext,useEffect,useState,type Dispatch,type SetStateAction,type ReactNode} from 'react';
import type {MetricKey,Period,SourceMode} from '../lib/types';
type Simulation={cursor:number;setCursor:Dispatch<SetStateAction<number>>;paused:boolean;setPaused:Dispatch<SetStateAction<boolean>>;mode:SourceMode;setMode:Dispatch<SetStateAction<SourceMode>>;period:Period;setPeriod:Dispatch<SetStateAction<Period>>;visible:MetricKey[];setVisible:Dispatch<SetStateAction<MetricKey[]>>};
const Context=createContext<Simulation|null>(null);
export function SimulationProvider({children,active}:{children:ReactNode;active:boolean}){
 const [cursor,setCursor]=useState(0),[paused,setPaused]=useState(false),[mode,setMode]=useState<SourceMode>('demo'),[period,setPeriod]=useState<Period>('day'),[visible,setVisible]=useState<MetricKey[]>(['temperatureC','humidityPct']);
 useEffect(()=>{if(paused||mode!=='demo'||!active)return;const timer=setInterval(()=>setCursor(v=>v+1),4000);return()=>clearInterval(timer);},[paused,mode,active]);
 return <Context.Provider value={{cursor,setCursor,paused,setPaused,mode,setMode,period,setPeriod,visible,setVisible}}>{children}</Context.Provider>;
}
export function useSimulation(){const value=useContext(Context);if(!value)throw new Error('Missing simulation');return value;}
