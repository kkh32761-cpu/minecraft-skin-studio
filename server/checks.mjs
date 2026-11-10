import test from 'node:test';import assert from 'node:assert/strict';import {validateImageInput,validateSpec,analyzeWithOpenAI} from './analyze.mjs';
const img={mime:'image/png',base64:Buffer.from([137,80,78,71,13,10,26,10,0]).toString('base64')};
test('image input validates signature and size',()=>{assert.equal(validateImageInput(img).bytes,9);assert.throws(()=>validateImageInput({...img,mime:'image/jpeg'}));assert.throws(()=>validateImageInput({...img,base64:'AA'.repeat(4*1024*1024)}));});
test('provider key is mandatory and no fake analysis is returned',async()=>{await assert.rejects(()=>analyzeWithOpenAI(img),/OPENAI_API_KEY/);});
test('provider adapter sends schema request and checks returned fields',async()=>{
  const spec={imageType:'anime',visible:{hair:'검정',eyes:'붉음',skin:'밝음',top:'검정',bottom:'검정',shoes:'검정',distinctive:'앞머리'},inferred:{back:'추론',sides:'추론'},palette:['#101010','#aa0000'],notes:'visible/inferred separated'};
  const fetchImpl=async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/responses');assert.match(options.headers.Authorization,/Bearer test/);const body=JSON.parse(options.body);assert.equal(body.store,false);assert.equal(body.input[0].content[1].type,'input_image');return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:JSON.stringify(spec)}]}]})};};
  assert.deepEqual(await analyzeWithOpenAI(img,{apiKey:'test',fetchImpl}),spec);assert.throws(()=>validateSpec({...spec,palette:['invalid']}));
});
