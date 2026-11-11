import {validateCharacterSpec} from '../src/character';

export class GenerationError extends Error {
  constructor(message:string,readonly status:number){super(message);}
}

const colors=['skin','hair','hairShade','eyes','top','topShade','bottom','shoes','accent'];
const strings=(keys:string[])=>Object.fromEntries(keys.map(key=>[key,{type:'string'}]));
const schema={type:'object',additionalProperties:false,required:['imageType','hairStyle','eyeStyle','outfitStyle','colors','visible','inferred'],properties:{
  imageType:{type:'string',enum:['photo','anime','virtual','game','minecraft_screenshot']},
  hairStyle:{type:'string',enum:['short','long','fringe','side_swept']},
  eyeStyle:{type:'string',enum:['soft','sharp','large']},
  outfitStyle:{type:'string',enum:['plain','jacket','dress','uniform']},
  colors:{type:'object',additionalProperties:false,required:colors,properties:strings(colors)},
  visible:{type:'object',additionalProperties:false,required:['hair','eyes','clothes','distinctive'],properties:strings(['hair','eyes','clothes','distinctive'])},
  inferred:{type:'object',additionalProperties:false,required:['back','sides'],properties:strings(['back','sides'])}
}};

// A no-billing Gemini project cannot silently switch to paid inference. The model is
// deliberately fixed instead of accepting a client-supplied or runtime model name.
export async function analyzeGemini(mime:string,base64:string,key:string){
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',{
    method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},signal:AbortSignal.timeout(45000),
    body:JSON.stringify({contents:[{role:'user',parts:[
      {text:'Analyze the visible character for a Minecraft skin. Preserve visually confirmed hair, eye and outfit colors. Return concise Korean descriptions. Put inferred back/side appearance separately. All color values must be #RRGGBB. Classify a Minecraft screenshot separately. Do not invent visible traits. Return only the requested JSON.'},
      {inline_data:{mime_type:mime,data:base64}}
    ]}],generationConfig:{responseMimeType:'application/json',responseSchema:schema,maxOutputTokens:2048,thinkingConfig:{thinkingLevel:'low'}}})
  });
  if(!response.ok){
    const failure=await response.json().catch(()=>null) as {error?:{status?:string;message?:string}}|null;
    const code=failure?.error?.status;
    if(response.status===429)throw new GenerationError('Gemini 무료 제공량이 소진되었습니다. 한도가 초기화된 뒤 다시 시도하세요.',429);
    if(response.status===401||response.status===403)throw new GenerationError(`Gemini API 키가 거부되었습니다 (${response.status}${code?` · ${code}`:''}). Google AI Studio에서 키 상태를 확인하세요.`,503);
    if(response.status===404)throw new GenerationError('선택한 Gemini 모델을 이 프로젝트에서 사용할 수 없습니다 (404).',503);
    if(response.status===400)throw new GenerationError(`Gemini 요청 형식 오류 (400${code?` · ${code}`:''}). 생성 설정을 점검해야 합니다.`,502);
    throw new GenerationError(`Gemini 서버 오류 (${response.status}${code?` · ${code}`:''}). 잠시 후 다시 시도하세요.`,502);
  }
  const result=await response.json().catch(()=>null) as {candidates?:{content?:{parts?:{text?:string}[]}}[]}|null;
  const raw=result?.candidates?.[0]?.content?.parts?.find(p=>typeof p.text==='string')?.text;
  if(!raw)throw new GenerationError('Gemini가 캐릭터 분석 내용을 반환하지 않았습니다.',502);
  try{return validateCharacterSpec(JSON.parse(raw));}
  catch{throw new GenerationError('Gemini 분석 형식이 올바르지 않습니다. 다시 시도하세요.',502);}
}
