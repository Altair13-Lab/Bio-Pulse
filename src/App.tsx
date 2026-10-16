import {Component,Suspense,lazy,useEffect,useState,type ReactNode} from 'react';
import {I18nProvider,useI18n} from './i18n';
import {Layout,routes,type Page} from './components/Layout';
import {Home} from './pages/Home';
import {SimulationProvider} from './data/Simulation';
import s from './App.module.css';
const Dashboard=lazy(()=>import('./pages/Dashboard').then(m=>({default:m.Dashboard})));
const Construction=lazy(()=>import('./pages/Construction').then(m=>({default:m.Construction})));
const How=lazy(()=>import('./pages/How').then(m=>({default:m.How})));
const Research=lazy(()=>import('./pages/Research').then(m=>({default:m.Research})));
const Ai=lazy(()=>import('./pages/Research').then(m=>({default:m.Ai})));
const Budget=lazy(()=>import('./pages/Budget').then(m=>({default:m.Budget})));
const Materials=lazy(()=>import('./pages/Materials').then(m=>({default:m.Materials})));
const Team=lazy(()=>import('./pages/Team').then(m=>({default:m.Team})));
function currentPage():Page{const hash=window.location.hash.slice(1);return routes.some(r=>r.id===hash)?hash as Page:'project';}
class Boundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?this.props.fallback:this.props.children;}}
function Shell(){const {t}=useI18n();const [page,setPage]=useState<Page>(currentPage);useEffect(()=>{const update=()=>{setPage(currentPage());window.scrollTo({top:0,behavior:'instant'});};window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
 const content={project:<Home/>,dashboard:<Dashboard/>,construction:<Construction/>,how:<How/>,research:<Research/>,ai:<Ai/>,budget:<Budget/>,materials:<Materials/>,team:<Team/>}[page];
 const fallback=<div className={`${s.wrap} ${s.empty}`} role="alert"><p>{t('common.error')}</p><button className={s.primaryButton} onClick={()=>window.location.reload()}>{t('common.reload')}</button></div>;
 return <Layout page={page}><SimulationProvider active={page==='dashboard'}><Boundary key={page} fallback={fallback}><Suspense fallback={<div className={`${s.wrap} ${s.page}`} role="status"><span className={s.loadingDot}/>{t('common.loading')}</div>}>{content}</Suspense></Boundary></SimulationProvider></Layout>;
}
export default function App(){return <I18nProvider><Shell/></I18nProvider>;}
