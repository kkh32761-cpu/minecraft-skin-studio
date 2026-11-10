import {createServer} from 'node:http';
import {analyzeWithOpenAI,validateImageInput} from './analyze.mjs';
const port=Number(process.env.PORT||8787), token=process.env.STUDIO_SERVER_TOKEN, key=process.env.OPENAI_API_KEY;
if(!token)throw Error('STUDIO_SERVER_TOKEN이 필요합니다. 인증 없이 서버를 시작하지 않습니다.');
const requests=new Map();
function json(res,status,payload){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(payload));}
createServer(async(req,res)=>{
  if(req.url==='/health'&&req.method==='GET')return json(res,200,{ready:Boolean(key),service:'skin-analysis'});
  if(req.url!=='/v1/analyze'||req.method!=='POST')return json(res,404,{error:'Not found'});
  if(!token||req.headers.authorization!==`Bearer ${token}`)return json(res,401,{error:'인증이 필요합니다.'});
  if(!key)return json(res,503,{error:'AI 제공자 키가 아직 설정되지 않았습니다.'});
  const now=Date.now(),address=req.socket.remoteAddress||'unknown',record=requests.get(address)||{start:now,count:0};
  if(now-record.start>3600000){record.start=now;record.count=0;}if(++record.count>10)return json(res,429,{error:'시간당 요청 한도를 초과했습니다.'});requests.set(address,record);
  if(Number(req.headers['content-length']||0)>7.2*1024*1024)return json(res,413,{error:'요청 크기가 너무 큽니다.'});
  try{let text='';for await(const chunk of req){text+=chunk;if(text.length>7.2*1024*1024)throw Error('요청 크기가 너무 큽니다.');}
    const image=validateImageInput(JSON.parse(text));const spec=await analyzeWithOpenAI(image,{apiKey:key,model:process.env.OPENAI_VISION_MODEL||'gpt-4.1-mini'});return json(res,200,{spec});
  }catch(e){const message=e instanceof Error?e.message:'알 수 없는 오류';return json(res,/too|크기|5MB/.test(message)?413:400,{error:message});}
}).listen(port,'127.0.0.1',()=>console.log(`Skin analysis server listening on 127.0.0.1:${port}`));
