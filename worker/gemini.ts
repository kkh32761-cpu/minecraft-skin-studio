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
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',{
    method:'POST',headers:{'x-goog-api-key':key,'Content-Type':'application/json'},signal:AbortSignal.timeout(45000),
    body:JSON.stringify({contents:[{role:'user',parts:[
      {text:'Analyze the visible character for a Minecraft skin. Preserve visually confirmed hair, eye and outfit colors. Return concise Korean descriptions. Put inferred back/side appearance separately. All color values must be #RRGGBB. Classify a Minecraft screenshot separately. Do not invent visible traits. Return only the requested JSON.'},
      {inline_data:{mime_type:mime,data:base64}}
    ]}],generationConfig:{responseMimeType:'application/json',responseSchema:schema,maxOutputTokens:2048,thinkingConfig:{thinkingBudget:0}}})
  });
  if(!response.ok){
    if(response.status===429)throw new GenerationError('Gemini 무료 제공량이 소진되었습니다. 한도가 초기화된 뒤 다시 시도하세요.',429);
    if(response.status===401||response.status===403)throw new GenerationError('Gemini 무료 프로젝트의 API 키 권한을 확인해야 합니다.',503);
    throw new GenerationError(`Gemini 분석 오류 (${response.status}). 잠시 후 다시 시도하세요.`,502);
  }
  const result=await response.json().catch(()=>null) as {candidates?:{content?:{parts?:{text?:string}[]}}[]}|null;
  const raw=result?.candidates?.[0]?.content?.parts?.find(p=>typeof p.text==='string')?.text;
  if(!raw)throw new GenerationError('Gemini가 캐릭터 분석 내용을 반환하지 않았습니다.',502);
  try{return validateCharacterSpec(JSON.parse(raw));}
  catch{throw new GenerationError('Gemini 분석 형식이 올바르지 않습니다. 다시 시도하세요.',502);}
}
