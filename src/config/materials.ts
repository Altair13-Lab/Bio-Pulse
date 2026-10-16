import type {TranslationKey} from '../i18n/ru';
export const materials:{id:string;label:TranslationKey;format:string;file:Record<'kk'|'ru',string>}[]=[
{id:'stl',label:'materials.stl',format:'ZIP',file:{kk:'/materials/BioPulse_v2_sources.zip',ru:'/materials/BioPulse_v2_sources.zip'}},
{id:'obj',label:'materials.obj',format:'OBJ',file:{kk:'/models/BioPulse_v2/assembly_reference.obj',ru:'/models/BioPulse_v2/assembly_reference.obj'}},
{id:'glb',label:'materials.glb',format:'GLB',file:{kk:'/models/biopulse.glb',ru:'/models/biopulse.glb'}},
{id:'cad',label:'materials.cad',format:'PY',file:{kk:'/models/BioPulse_v2/build_models.py',ru:'/models/BioPulse_v2/build_models.py'}},
{id:'presentation',label:'materials.presentation',format:'PPTX',file:{kk:'/materials/biopulse-kk.pptx',ru:'/materials/biopulse-ru.pptx'}},
{id:'pdf',label:'materials.pdf',format:'PDF',file:{kk:'/materials/biopulse-kk.pdf',ru:'/materials/biopulse-ru.pdf'}},
{id:'bom',label:'materials.bom',format:'CSV',file:{kk:'/materials/BOM-kk.csv',ru:'/materials/BOM-ru.csv'}},
{id:'guide',label:'materials.guide',format:'MD',file:{kk:'/materials/guide-kk.md',ru:'/materials/guide-ru.md'}},
];
export function isAvailable(file:string,publicFiles:readonly string[]=__PUBLIC_FILES__){return publicFiles.includes(file);}
