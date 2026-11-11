import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import worker from '../dist/server/index.js';
const base='https://studio.example';
const sampleKey='AIza'+'X'.repeat(35);
const authKey='AQ.'+'Y'.repeat(48);
const spec={imageType:'anime',hairStyle:'fringe',eyeStyle:'large',outfitStyle:'jacket',colors:{skin:'#d4ad92',hair:'#161622',hairShade:'#292535',eyes:'#ba252d',top:'#364574',topShade:'#202c50',bottom:'#34313d',shoes:'#161a20',accent:'#f0d6b7'},visible:{hair:'검은 앞머리',eyes:'붉은 눈',clothes:'파란 재킷',distinctive:'붉은 눈'},inferred:{back:'검은 머리',sides:'어두운 옆머리'}};
test('worker serves the built editor and reports missing AI configuration',async()=>{
  const home=await worker.fetch(new Request(base+'/'),{});assert.equal(home.status,200);assert.match(await home.text(),/root/);
  const status=await (await worker.fetch(new Request(base+'/api/ai/status'),{OPENAI_API_KEY:'unused-paid-key'})).json();assert.equal(status.ready,false);assert.equal(status.provider,'gemini-free');
  const denied=await worker.fetch(new Request(base+'/api/ai/generate',{method:'POST'}),{});assert.equal(denied.status,401);
  const noFreeKey=await worker.fetch(new Request(base+'/api/ai/generate',{method:'POST',headers:{'oai-authenticated-user-id':'owner'},body:JSON.stringify({mime:'image/png',base64:'',model:'default'})}),{OPENAI_API_KEY:'unused-paid-key'});assert.equal(noFreeKey.status,400);
});
test('authenticated generation uses Gemini image analysis to return actual UV pixels',async()=>{
  const original=globalThis.fetch;globalThis.fetch=async(url,options)=>{
    assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent');
    assert.equal(options.headers['x-goog-api-key'],sampleKey);
    const body=JSON.parse(options.body);assert.equal(body.contents[0].parts[1].inline_data.mime_type,'image/png');
    assert.equal(body.generationConfig.responseMimeType,'application/json');
    assert.equal(body.generationConfig.thinkingConfig.thinkingLevel,'low');
    return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(spec)}]}}]}),{status:200});
  };
  try{
    const image=Buffer.from([137,80,78,71,13,10,26,10,1,2,3]).toString('base64');
    const request=new Request(base+'/api/ai/generate',{method:'POST',headers:{'oai-authenticated-user-id':'test-user','Content-Type':'application/json'},body:JSON.stringify({mime:'image/png',base64:image,model:'slim'})});
    const response=await worker.fetch(request,{GEMINI_API_KEY:sampleKey});assert.equal(response.status,200);
    const result=await response.json();assert.equal(result.pixels.length,64*64*4);assert.equal(result.spec.colors.eyes,'#ba252d');
  }finally{globalThis.fetch=original;}
});
test('free-tier quota exhaustion is reported without generating pixels or using paid fallback',async()=>{
  const original=globalThis.fetch;let attempts=0;
  globalThis.fetch=async(url)=>{attempts++;assert.match(url,/generativelanguage\.googleapis\.com/);return new Response(JSON.stringify({error:{status:'RESOURCE_EXHAUSTED'}}),{status:429});};
  try{
    const image=Buffer.from([137,80,78,71,13,10,26,10,1,2,3]).toString('base64');
    const request=new Request(base+'/api/ai/generate',{method:'POST',headers:{'oai-authenticated-user-id':'quota-test'},body:JSON.stringify({mime:'image/png',base64:image,model:'default'})});
    const response=await worker.fetch(request,{GEMINI_API_KEY:sampleKey,OPENAI_API_KEY:'unused-paid-key'});
    assert.equal(response.status,429);
    const result=await response.json();assert.match(result.error,/무료 제공량/);assert.equal(result.pixels,undefined);
    for(let i=0;i<6;i++){
      const retry=new Request(base+'/api/ai/generate',{method:'POST',headers:{'oai-authenticated-user-id':'quota-test'},body:JSON.stringify({mime:'image/png',base64:image,model:'default'})});
      assert.equal((await worker.fetch(retry,{GEMINI_API_KEY:sampleKey})).status,429);
    }
    assert.equal(attempts,7,'failed provider requests must not consume the local success quota');
  }finally{globalThis.fetch=original;}
});
test('model access errors are distinguished from a successful skin',async()=>{
  const original=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({error:{status:'NOT_FOUND'}}),{status:404});
  try{
    const image=Buffer.from([137,80,78,71,13,10,26,10,1,2,3]).toString('base64');
    const request=new Request(base+'/api/ai/generate',{method:'POST',headers:{'oai-authenticated-user-id':'model-test'},body:JSON.stringify({mime:'image/png',base64:image,model:'default'})});
    const response=await worker.fetch(request,{GEMINI_API_KEY:sampleKey});assert.equal(response.status,503);
    const result=await response.json();assert.match(result.error,/모델/);assert.equal(result.pixels,undefined);
  }finally{globalThis.fetch=original;}
});
test('owner can supply a temporary new-format auth key without storing it in the Site environment',async()=>{
  const original=globalThis.fetch;globalThis.fetch=async(_url,options)=>{
    assert.equal(options.headers['x-goog-api-key'],authKey);
    return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(spec)}]}}]}),{status:200});
  };
  try{
    const image=Buffer.from([137,80,78,71,13,10,26,10,1,2,3]).toString('base64');
    const payload={mime:'image/png',base64:image,model:'default',apiKey:authKey};
    const request=new Request(base+'/api/ai/generate',{method:'POST',headers:{'oai-authenticated-user-id':'temporary-key-owner','Content-Type':'application/json'},body:JSON.stringify(payload)});
    const response=await worker.fetch(request,{});assert.equal(response.status,200);
    const result=await response.json();assert.equal(result.pixels.length,64*64*4);
    const unauthenticated=await worker.fetch(new Request(base+'/api/ai/generate',{method:'POST',body:JSON.stringify(payload)}),{});assert.equal(unauthenticated.status,401);
  }finally{globalThis.fetch=original;}
});

test('400 structured configuration gets one compatibility retry without switching model',async()=>{
  const original=globalThis.fetch;let attempts=0;
  globalThis.fetch=async(url,options)=>{
    attempts++;
    assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent');
    const body=JSON.parse(options.body);
    if(attempts===1){
      assert.ok(body.generationConfig.responseSchema);
      return new Response(JSON.stringify({error:{status:'INVALID_ARGUMENT',message:'Unknown name "additionalProperties"'}}),{status:400});
    }
    assert.equal(body.generationConfig.responseSchema,undefined);
    assert.equal(body.generationConfig.thinkingConfig,undefined);
    return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(spec)}]}}]}),{status:200});
  };
  try{
    const image=Buffer.from([137,80,78,71,13,10,26,10,1,2,3]).toString('base64');
    const req=new Request(base+'/api/ai/generate',{method:'POST',headers:{'oai-authenticated-user-id':'compatibility-test'},body:JSON.stringify({mime:'image/png',base64:image,model:'default'})});
    const response=await worker.fetch(req,{GEMINI_API_KEY:sampleKey});
    assert.equal(response.status,200);
    assert.equal((await response.json()).pixels.length,64*64*4);
    assert.equal(attempts,2);
  }finally{globalThis.fetch=original;}
});

test('Gemini 503 is retried twice with the same model before a successful skin',async()=>{
  const original=globalThis.fetch;let attempts=0;
  globalThis.fetch=async(url,options)=>{
    attempts++;
    assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent');
    assert.equal(options.headers['x-goog-api-key'],sampleKey);
    if(attempts<3)return new Response(JSON.stringify({error:{status:'UNAVAILABLE'}}),{status:503});
    return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(spec)}]}}]}),{status:200});
  };
  try{
    const image=Buffer.from([137,80,78,71,13,10,26,10,1,2,3]).toString('base64');
    const req=new Request(base+'/api/ai/generate',{method:'POST',headers:{'oai-authenticated-user-id':'503-recovery-test'},body:JSON.stringify({mime:'image/png',base64:image,model:'default'})});
    const response=await worker.fetch(req,{GEMINI_API_KEY:sampleKey});
    assert.equal(response.status,200);
    assert.equal((await response.json()).pixels.length,64*64*4);
    assert.equal(attempts,3);
  }finally{globalThis.fetch=original;}
});
test('persistent Gemini 503 fails clearly after at most three same-model attempts',async()=>{
  const original=globalThis.fetch;let attempts=0;
  globalThis.fetch=async(url)=>{
    attempts++;
    assert.match(url,/models\/gemini-3\.8-flash:generateContent$/);
    return new Response(JSON.stringify({error:{status:'UNAVAILABLE'}}),{status:503});
  };
  try{
    const image=Buffer.from([137,80,78,71,13,10,26,10,1,2,3]).toString('base64');
    const req=new Request(base+'/api/ai/generate',{method:'POST',headers:{'oai-authenticated-user-id':'503-exhausted-test'},body:JSON.stringify({mime:'image/png',base64:image,model:'default'})});
    const response=await worker.fetch(req,{GEMINI_API_KEY:sampleKey});
    assert.equal(response.status,503);
    const result=await response.json();
    assert.match(result.error,/자동 재시도 2회/);
    assert.equal(result.pixels,undefined);
    assert.equal(attempts,3);
  }finally{globalThis.fetch=original;}
});
