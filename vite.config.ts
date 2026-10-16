import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
function files(dir:string,base=''):string[]{return readdirSync(dir,{withFileTypes:true}).flatMap(f=>f.isDirectory()?files(path.join(dir,f.name),base+'/'+f.name):[base+'/'+f.name]);}
export default defineConfig({plugins:[react()],define:{__PUBLIC_FILES__:JSON.stringify(files(path.join(root,'public')))},build:{rolldownOptions:{output:{codeSplitting:{groups:[{name:'charts',test:/node_modules\/(recharts|d3-|victory|react-smooth)/}]}}}}});
