import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import worker from '../dist/server/index.js';
const base='https://studio.example';
const spec={imageType:'anime',hairStyle:'fringe',eyeStyle:'large',outfitStyle:'jacket',colors:{skin:'#d4ad92',hair:'#161622',hairShade:'#292535',eyes:'#ba252d',top:'#364574',topShade:'#202c50',bottom:'#34313d',shoes:'#161a20',accent:'#f0d6b7'},visible:{hair:'검은 앞머리',eyes:'붉은 눈',clothes:'파란 재킷',distinctive:'붉은 눈'},inferred:{back:'검은 머리',sides:'어두운 옆머리'}};
test('worker serves the built editor and reports missing AI configuration',async()=>{
  const home=await worker.fetch(new Request(base+'/'),{});assert.equal(home.status,200);assert.match(await home.text(),/root/);
  const status=await (await worker.fetch(new Request(base+'/api/ai/status'),{})).json();assert.equal(status.ready,false);
  const denied=await worker.fetch(new Request(base+'/api/ai/generate',{method:'POST'}),{});assert.equal(denied.status,401);
});
test('authenticated generation uses provider response to return actual UV pixels',async()=>{
  const original=globalThis.fetch;globalThis.fetch=async(url,options)=>{
    assert.equal(url,'https://api.openai.com/v1/responses');assert.match(options.headers.Authorization,/Bearer test-key/);
    return new Response(JSON.stringify({output:[{content:[{type:'output_text',text:JSON.stringify(spec)}]}]}),{status:200});
  };
  try{
    const image=Buffer.from([137,80,78,71,13,10,26,10,1,2,3]).toString('base64');
    const request=new Request(base+'/api/ai/generate',{method:'POST',headers:{'oai-authenticated-user-id':'test-user','Content-Type':'application/json'},body:JSON.stringify({mime:'image/png',base64:image,model:'slim'})});
    const response=await worker.fetch(request,{OPENAI_API_KEY:'test-key'});assert.equal(response.status,200);
    const result=await response.json();assert.equal(result.pixels.length,64*64*4);assert.equal(result.spec.colors.eyes,'#ba252d');
  }finally{globalThis.fetch=original;}
});
test('provider credit exhaustion is reported without claiming a generated skin',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>new Response(JSON.stringify({error:{code:'insufficient_quota'}}),{status:429});
  try{
    const image=Buffer.from([137,80,78,71,13,10,26,10,1,2,3]).toString('base64');
    const request=new Request(base+'/api/ai/generate',{method:'POST',headers:{'oai-authenticated-user-id':'credit-test'},body:JSON.stringify({mime:'image/png',base64:image,model:'default'})});
    const response=await worker.fetch(request,{OPENAI_API_KEY:'test-key'});
    assert.equal(response.status,503);
    const result=await response.json();assert.match(result.error,/크레딧/);assert.equal(result.pixels,undefined);
  }finally{globalThis.fetch=original;}
});
