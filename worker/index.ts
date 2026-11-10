import {generateCharacter,validateCharacterSpec} from '../src/character';
import {ASSETS} from './assets.generated';
type Env={OPENAI_API_KEY?:string;OPENAI_VISION_MODEL?:string};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const quota=new Map<string,{until:number,count:number}>();
const colors=['skin','hair','hairShade','eyes','top','topShade','bottom','shoes','accent'];
const schema={type:'object',additionalProperties:false,required:['imageType','hairStyle','eyeStyle','outfitStyle','colors','visible','inferred'],properties:{
  imageType:{type:'string',enum:['photo','anime','virtual','game','minecraft_screenshot']},
  hairStyle:{type:'string',enum:['short','long','fringe','side_swept']},eyeStyle:{type:'string',enum:['soft','sharp','large']},
  outfitStyle:{type:'string',enum:['plain','jacket','dress','uniform']},
  colors:{type:'object',additionalProperties:false,required:colors,properties:Object.fromEntries(colors.map(k=>[k,{type:'string',pattern:'^#[0-9A-Fa-f]{6}$'}]))},
  visible:{type:'object',additionalProperties:false,required:['hair','eyes','clothes','distinctive'],properties:Object.fromEntries(['hair','eyes','clothes','distinctive'].map(k=>[k,{type:'string'}]))},
  inferred:{type:'object',additionalProperties:false,required:['back','sides'],properties:{back:{type:'string'},sides:{type:'string'}}}
}};
function isImage(mime:string,b:Uint8Array){return mime==='image/png'?b.length>8&&[137,80,78,71,13,10,26,10].every((n,i)=>b[i]===n):
  mime==='image/jpeg'?b[0]===255&&b[1]===216&&b[2]===255:
  mime==='image/webp'?String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP':false;}
function decode(base64:string){const binary=atob(base64),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes;}
async function analyze(mime:string,base64:string,key:string,model:string){
  const res=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(45000),body:JSON.stringify({model,store:false,max_output_tokens:1200,
    input:[{role:'user',content:[{type:'input_text',text:'Analyze the visible character for a Minecraft skin. Preserve visually confirmed hair, eye and outfit colors. Return concise Korean descriptions. Put inferred back/side appearance separately. Color keys must match the visible design; choose harmonious shades. Classify a Minecraft screenshot separately. Do not invent visible traits.'},{type:'input_image',image_url:`data:${mime};base64,${base64}`,detail:'high'}]}],
    text:{format:{type:'json_schema',name:'skin_character_spec',strict:true,schema}}})});
  if(!res.ok)throw Error(`AI 제공자 오류 (${res.status})`);
  const result=await res.json() as {output?:{content?:{type:string;text?:string}[]}[]};
  const raw=result.output?.flatMap(v=>v.content||[]).find(v=>v.type==='output_text')?.text;
  if(!raw)throw Error('AI가 캐릭터 분석 내용을 반환하지 않았습니다.');
  return validateCharacterSpec(JSON.parse(raw));
}
export default {async fetch(request:Request,env:Env):Promise<Response>{
  const url=new URL(request.url),path=url.pathname;
  if(path==='/api/ai/status'&&request.method==='GET')return json({ready:Boolean(env.OPENAI_API_KEY),mode:'character-analysis-to-UV',authenticated:Boolean(request.headers.get('oai-authenticated-user-id'))});
  if(path==='/api/ai/generate'&&request.method==='POST'){
    const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'다른 사이트에서 생성 요청을 보낼 수 없습니다.'},403);
    const user=request.headers.get('oai-authenticated-user-id');
    if(!user)return json({error:'로그인이 필요합니다.'},401);
    if(!env.OPENAI_API_KEY)return json({error:'AI 제공자 연결 키가 아직 설정되지 않았습니다.'},503);
    const now=Date.now(),entry=quota.get(user)||{until:now+3600000,count:0};if(now>entry.until){entry.until=now+3600000;entry.count=0;}
    if(entry.count>=5)return json({error:'AI 생성은 한 시간에 5회까지 가능합니다.'},429);
    if(Number(request.headers.get('content-length')||0)>2.8*1024*1024)return json({error:'이미지 크기는 최대 2MB입니다.'},413);
    try{
      const body=await request.text();if(body.length>2.8*1024*1024)return json({error:'이미지 크기는 최대 2MB입니다.'},413);
      const payload=JSON.parse(body) as {mime:string;base64:string;model:string};
      if(!['default','slim'].includes(payload.model)||typeof payload.base64!=='string'||payload.base64.length>2.8*1024*1024||!/^[-A-Za-z0-9+/]*={0,2}$/.test(payload.base64))throw Error('이미지 데이터가 올바르지 않습니다.');
      const bytes=decode(payload.base64);if(bytes.length>2*1024*1024||!isImage(payload.mime,bytes))throw Error('PNG, JPG, WebP 이미지(최대 2MB)만 지원합니다.');
      entry.count++;quota.set(user,entry);
      const spec=await analyze(payload.mime,payload.base64,env.OPENAI_API_KEY,env.OPENAI_VISION_MODEL||'gpt-4.1-mini');
      return json({spec,pixels:Array.from(generateCharacter(spec,payload.model as 'default'|'slim'))});
    }catch(error){return json({error:error instanceof Error?error.message:'AI 생성에 실패했습니다.'},400);}
  }
  if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
  const key=path==='/'?'/index.html':path;const asset=ASSETS[key as keyof typeof ASSETS];
  if(!asset)return new Response('Not found',{status:404});
  const bytes=decode(asset.base64);return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':asset.type,'X-Content-Type-Options':'nosniff','Cache-Control':key==='/index.html'?'no-cache':'public, max-age=31536000, immutable'}});
}};
