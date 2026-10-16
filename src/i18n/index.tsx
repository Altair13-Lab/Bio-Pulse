import { useEffect,useState,type ReactNode } from 'react';
import { ru,type TranslationKey } from './ru';
import { kk } from './kk';
import type { Language } from '../lib/types';
import { safeRead,safeWrite } from '../lib/storage';
import {I18nContext} from './context';
export {useI18n} from './context';
export function I18nProvider({children}:{children:ReactNode}){
 const [language,setLanguage]=useState<Language>(()=>{const saved=safeRead('biopulse-language');return saved==='ru'?'ru':'kk';});
 const t=(key:TranslationKey)=>language==='kk'?kk[key]:ru[key];
 useEffect(()=>{document.documentElement.lang=language;document.title=t('meta.title');document.querySelector('meta[name="description"]')?.setAttribute('content',t('meta.description'));safeWrite('biopulse-language',language);},[language]);
 return <I18nContext.Provider value={{language,setLanguage,t,locale:language==='kk'?'kk-KZ':'ru-KZ'}}>{children}</I18nContext.Provider>;
}
export type {TranslationKey} from './ru';
