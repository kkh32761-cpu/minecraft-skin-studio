import {readFile,readdir,writeFile,unlink,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {build} from 'esbuild';
const files=await readdir('dist/assets');
const assets={'/index.html':{type:'text/html; charset=utf-8',base64:(await readFile('dist/index.html')).toString('base64')}};
for(const name of files){const type=name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'application/octet-stream';assets[`/assets/${name}`]={type,base64:(await readFile(join('dist/assets',name))).toString('base64')}}
await mkdir('worker',{recursive:true});await writeFile('worker/assets.generated.ts',`export const ASSETS = ${JSON.stringify(assets)} as const;\n`);
await mkdir('dist/server',{recursive:true});
try{await build({entryPoints:['worker/index.ts'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/server/index.js',minify:true});}
finally{await unlink('worker/assets.generated.ts');}
