const IMAGE_TYPES=new Set(['image/png','image/jpeg','image/webp']);
const MAX_BYTES=5*1024*1024;
export function validateImageInput(input){
  if(!input||typeof input!=='object'||!IMAGE_TYPES.has(input.mime)||typeof input.base64!=='string')throw new Error('PNG, JPG 또는 WebP 이미지를 제공하세요.');
  if(input.base64.length>Math.ceil(MAX_BYTES*4/3)+4||!/^[-A-Za-z0-9+/]*={0,2}$/.test(input.base64))throw new Error('이미지 인코딩 또는 크기가 잘못되었습니다.');
  const data=Buffer.from(input.base64,'base64');if(!data.length||data.length>MAX_BYTES)throw new Error('이미지는 최대 5MB입니다.');
  const png=data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpg=data.length>3&&data[0]===0xff&&data[1]===0xd8&&data[2]===0xff;
  const webp=data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP';
  if(!({ 'image/png':png,'image/jpeg':jpg,'image/webp':webp })[input.mime])throw new Error('파일 내용과 이미지 형식이 일치하지 않습니다.');
  return {mime:input.mime,bytes:data.length,base64:input.base64};
}
const schema={type:'object',additionalProperties:false,required:['imageType','visible','inferred','palette','notes'],properties:{
  imageType:{type:'string',enum:['photo','anime','virtual','game','minecraft_screenshot']},
  visible:{type:'object',additionalProperties:false,required:['hair','eyes','skin','top','bottom','shoes','distinctive'],properties:Object.fromEntries(['hair','eyes','skin','top','bottom','shoes','distinctive'].map(k=>[k,{type:'string'}]))},
  inferred:{type:'object',additionalProperties:false,required:['back','sides'],properties:{back:{type:'string'},sides:{type:'string'}}},
  palette:{type:'array',items:{type:'string',pattern:'^#[0-9A-Fa-f]{6}$'}},notes:{type:'string'}
}};
export function validateSpec(raw){
  if(!raw||!['photo','anime','virtual','game','minecraft_screenshot'].includes(raw.imageType))throw Error('AI 응답의 이미지 종류가 올바르지 않습니다.');
  for(const section of ['visible','inferred'])if(!raw[section]||typeof raw[section]!=='object')throw Error('AI 응답에 필요한 정보가 없습니다.');
  for(const field of ['hair','eyes','skin','top','bottom','shoes','distinctive'])if(typeof raw.visible[field]!=='string'||raw.visible[field].length>500)throw Error('AI 응답의 특징 정보가 올바르지 않습니다.');
  for(const field of ['back','sides'])if(typeof raw.inferred[field]!=='string'||raw.inferred[field].length>500)throw Error('AI 응답의 추론 정보가 올바르지 않습니다.');
  if(!Array.isArray(raw.palette)||raw.palette.length>16||raw.palette.some(v=>typeof v!=='string'||!/^#[0-9a-f]{6}$/i.test(v)))throw Error('AI 색상 팔레트가 올바르지 않습니다.');
  if(typeof raw.notes!=='string'||raw.notes.length>1000)throw Error('AI 응답 메모가 올바르지 않습니다.');
  return raw;
}
export async function analyzeWithOpenAI(image,{apiKey,model='gpt-4.1-mini',fetchImpl=fetch}={}){
  if(!apiKey)throw Error('OPENAI_API_KEY가 설정되지 않았습니다.');
  const response=await fetchImpl('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(45000),body:JSON.stringify({model,store:false,max_output_tokens:1200,
    input:[{role:'user',content:[{type:'input_text',text:'Describe only visible character features for an exact Minecraft pixel-skin design. Separate unseen back/side inference. Preserve distinctive hair, eye and outfit traits. Do not invent visible details. Return concise Korean JSON.'},{type:'input_image',image_url:`data:${image.mime};base64,${image.base64}`,detail:'high'}]}],
    text:{format:{type:'json_schema',name:'skin_character_spec',strict:true,schema}}})});
  if(!response.ok)throw Error(`AI 제공자 응답 오류 (${response.status})`);
  const body=await response.json();const text=body.output?.flatMap(v=>v.content||[]).find(v=>v.type==='output_text')?.text;
  if(!text)throw Error('AI 응답에 구조화된 분석 내용이 없습니다.');
  let parsed;try{parsed=JSON.parse(text)}catch{throw Error('AI 응답 JSON을 해석할 수 없습니다.')}
  return validateSpec(parsed);
}
export {MAX_BYTES};
