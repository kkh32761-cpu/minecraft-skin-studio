import {validateCharacterSpec} from '../src/character';

export class GenerationError extends Error {
  constructor(message:string,readonly status:number){super(message);}
}

const colors=['skin','hair','hairShade','eyes','top','topShade','bottom','shoes','accent'];
const strings=(keys:string[])=>Object.fromEntries(keys.map(key=>[key,{type:'string'}]));
// Keep the provider schema minimal. Some Google Generative Language API versions
// reject additionalProperties in responseSchema even though it is valid JSON Schema.
// We enforce the precise fields and colors independently in validateCharacterSpec.
const schema={type:'object',required:['imageType','hairStyle','eyeStyle','outfitStyle','colors','visible','inferred'],properties:{
  imageType:{type:'string',enum:['photo','anime','virtual','game','minecraft_screenshot']},
  hairStyle:{type:'string',enum:['short','long','fringe','side_swept']},
  eyeStyle:{type:'string',enum:['soft','sharp','large']},
  outfitStyle:{type:'string',enum:['plain','jacket','dress','uniform']},
  colors:{type:'object',required:colors,properties:strings(colors)},
  visible:{type:'object',required:['hair','eyes','clothes','distinctive'],properties:strings(['hair','eyes','clothes','distinctive'])},
  inferred:{type:'object',required:['back','sides'],properties:strings(['back','sides'])}
}};
const prompt=`Analyze the reference character and preserve clearly VISIBLE features rather than inventing them. Design a Minecraft Java 64x64 skin. Return one JSON object with these fields exactly:
imageType: photo|anime|virtual|game|minecraft_screenshot
hairStyle: short|long|fringe|side_swept
eyeStyle: soft|sharp|large
outfitStyle: plain|jacket|dress|uniform
colors: skin,hair,hairShade,eyes,top,topShade,bottom,shoes,accent (each a #RRGGBB hex color)
visible: hair,eyes,clothes,distinctive (concise Korean observations; mention accessories explicitly)
inferred: back,sides (concise Korean descriptions for details not visible).
Use actual observed colors. Hair shade should be a distinct nearby darker/lighter shade. If a side is hidden, label it as inferred. All values must be strings. No markdown.`;

type ProviderFailure={error?:{status?:string;message?:string}};
const requestBody=(mime:string,base64:string,strict:boolean)=>({
  contents:[{role:'user',parts:[{text:prompt},{inline_data:{mime_type:mime,data:base64}}]}],
  generationConfig:strict
    ?{responseMimeType:'application/json',responseSchema:schema,maxOutputTokens:4096,thinkingConfig:{thinkingLevel:'low'}}
    :{responseMimeType:'application/json',maxOutputTokens:4096}
});
function requestGemini(mime:string,base64:string,key:string,strict:boolean){
  return fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',{
    method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},signal:AbortSignal.timeout(45000),
    body:JSON.stringify(requestBody(mime,base64,strict))
  });
}
function describe400(message:string|undefined){
  const unsupported=message?.match(/Unknown name ["']([^"']+)["']/i);
  if(unsupported)return `Gemini API가 요청 필드 '${unsupported[1].slice(0,45)}'를 지원하지 않습니다. 개발자에게 오류를 알려주세요.`;
  if(/schema|response.mime|generation.config/i.test(message||''))return 'Gemini 응답 형식 설정이 현재 API와 호환되지 않습니다.';
  return 'Gemini 요청이 거부되었습니다 (400 · INVALID_ARGUMENT). API 키의 모델 사용 권한과 요청 설정을 확인하세요.';
}

// A paid model or fallback provider must never be selected without user consent.
export async function analyzeGemini(mime:string,base64:string,key:string){
  let response=await requestGemini(mime,base64,key,true);
  // A compatibility retry uses the same model and JSON output, but omits
  // responseSchema/thinkingConfig when Google rejects the structured request.
  // HTTP 400 is rejected before inference, so this does not retry a successful call.
  if(response.status===400)response=await requestGemini(mime,base64,key,false);
  if(!response.ok){
    const failure=await response.json().catch(()=>null) as ProviderFailure|null;
    const code=failure?.error?.status;
    if(response.status===429)throw new GenerationError('Gemini 무료 제공량이 소진되었습니다. 한도가 초기화된 뒤 다시 시도하세요.',429);
    if(response.status===401||response.status===403)throw new GenerationError(`Gemini API 키가 거부되었습니다 (${response.status}${code?` · ${code}`:''}). Google AI Studio에서 키 상태를 확인하세요.`,503);
    if(response.status===404)throw new GenerationError('선택한 Gemini 모델을 이 프로젝트에서 사용할 수 없습니다 (404).',503);
    if(response.status===400)throw new GenerationError(describe400(failure?.error?.message),502);
    throw new GenerationError(`Gemini 서버 오류 (${response.status}${code?` · ${code}`:''}). 잠시 후 다시 시도하세요.`,502);
  }
  const result=await response.json().catch(()=>null) as {candidates?:{content?:{parts?:{text?:string}[]}}[]}|null;
  const raw=result?.candidates?.[0]?.content?.parts?.find(p=>typeof p.text==='string')?.text;
  if(!raw)throw new GenerationError('Gemini가 캐릭터 분석 내용을 반환하지 않았습니다.',502);
  try{return validateCharacterSpec(JSON.parse(raw.replace(/^\s*```(?:json)?\s*|\s*```\s*$/gi,'')));}
  catch{throw new GenerationError('Gemini 분석 형식이 올바르지 않습니다. 다시 시도하세요.',502);}
}
