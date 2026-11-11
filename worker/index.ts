import {generateCharacter} from '../src/character';
import {analyzeGemini,GenerationError} from './gemini';
import {ASSETS} from './assets.generated';
type Env={GEMINI_API_KEY?:string};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const quota=new Map<string,{until:number,count:number}>();
function isImage(mime:string,b:Uint8Array){return mime==='image/png'?b.length>8&&[137,80,78,71,13,10,26,10].every((n,i)=>b[i]===n):
  mime==='image/jpeg'?b[0]===255&&b[1]===216&&b[2]===255:
  mime==='image/webp'?String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP':false;}
function decode(base64:string){const binary=atob(base64),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes;}
export default {async fetch(request:Request,env:Env):Promise<Response>{
  const url=new URL(request.url),path=url.pathname;
  if(path==='/api/ai/status'&&request.method==='GET')return json({ready:Boolean(env.GEMINI_API_KEY),provider:'gemini-free',mode:'character-analysis-to-UV',authenticated:Boolean(request.headers.get('oai-authenticated-user-id'))});
  if(path==='/api/ai/generate'&&request.method==='POST'){
    const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'다른 사이트에서 생성 요청을 보낼 수 없습니다.'},403);
    const user=request.headers.get('oai-authenticated-user-id');
    if(!user)return json({error:'로그인이 필요합니다.'},401);
    const now=Date.now(),entry=quota.get(user)||{until:now+3600000,count:0};if(now>entry.until){entry.until=now+3600000;entry.count=0;}
    if(entry.count>=5)return json({error:'AI 생성은 한 시간에 5회까지 가능합니다.'},429);
    if(Number(request.headers.get('content-length')||0)>2.8*1024*1024)return json({error:'이미지 크기는 최대 2MB입니다.'},413);
    try{
      const body=await request.text();if(body.length>2.8*1024*1024)return json({error:'이미지 크기는 최대 2MB입니다.'},413);
      const payload=JSON.parse(body) as {mime:string;base64:string;model:string;apiKey?:string};
      const apiKey=env.GEMINI_API_KEY||payload.apiKey;
      if(!apiKey||!/^AIza[\w-]{25,200}$/.test(apiKey))throw new GenerationError('Gemini 무료 API 키를 연결해 주세요.',400);
      if(!['default','slim'].includes(payload.model)||typeof payload.base64!=='string'||payload.base64.length>2.8*1024*1024||!/^[-A-Za-z0-9+/]*={0,2}$/.test(payload.base64))throw new GenerationError('이미지 데이터가 올바르지 않습니다.',400);
      const bytes=decode(payload.base64);if(bytes.length>2*1024*1024||!isImage(payload.mime,bytes))throw new GenerationError('PNG, JPG, WebP 이미지(최대 2MB)만 지원합니다.',400);
      entry.count++;quota.set(user,entry);
      const spec=await analyzeGemini(payload.mime,payload.base64,apiKey);
      return json({spec,pixels:Array.from(generateCharacter(spec,payload.model as 'default'|'slim'))});
    }catch(error){return json({error:error instanceof Error?error.message:'AI 생성에 실패했습니다.'},error instanceof GenerationError?error.status:error instanceof SyntaxError?400:502);}
  }
  if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
  const key=path==='/'?'/index.html':path;const asset=ASSETS[key as keyof typeof ASSETS];
  if(!asset)return new Response('Not found',{status:404});
  const bytes=decode(asset.base64);return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':asset.type,'X-Content-Type-Options':'nosniff','Cache-Control':key==='/index.html'?'no-cache':'public, max-age=31536000, immutable'}});
}};
