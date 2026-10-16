import {createContext,useContext} from 'react';
import type {Language} from '../lib/types';
import type {TranslationKey} from './ru';
export type I18n={language:Language;setLanguage:(l:Language)=>void;t:(key:TranslationKey)=>string;locale:string};
export const I18nContext=createContext<I18n|null>(null);
export function useI18n(){const value=useContext(I18nContext);if(!value)throw new Error('Missing I18nProvider');return value;}
