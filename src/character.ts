import {pixelIndex,regions,SIZE,type Model} from './skin';

export type CharacterSpec={
  imageType:'photo'|'anime'|'virtual'|'game'|'minecraft_screenshot';
  hairStyle:'short'|'long'|'fringe'|'side_swept';
  eyeStyle:'soft'|'sharp'|'large';
  outfitStyle:'plain'|'jacket'|'dress'|'uniform';
  colors:{skin:string;hair:string;hairShade:string;eyes:string;top:string;topShade:string;bottom:string;shoes:string;accent:string};
  visible:{hair:string;eyes:string;clothes:string;distinctive:string};
  inferred:{back:string;sides:string};
};
const hex=/^#[0-9a-fA-F]{6}$/;
export function validateCharacterSpec(value:unknown):CharacterSpec {
  if(!value||typeof value!=='object')throw Error('AI 캐릭터 분석 결과가 없습니다.');
  const v=value as CharacterSpec;
  if(!['photo','anime','virtual','game','minecraft_screenshot'].includes(v.imageType)||
    !['short','long','fringe','side_swept'].includes(v.hairStyle)||
    !['soft','sharp','large'].includes(v.eyeStyle)||
    !['plain','jacket','dress','uniform'].includes(v.outfitStyle))throw Error('AI 캐릭터 유형이 올바르지 않습니다.');
  if(!v.colors||Object.keys(v.colors).length!==9||Object.values(v.colors).some(c=>typeof c!=='string'||!hex.test(c)))throw Error('AI 색상이 올바르지 않습니다.');
  for(const field of ['hair','eyes','clothes','distinctive'] as const)if(typeof v.visible?.[field]!=='string'||v.visible[field].length>300)throw Error('AI 특징 분석이 올바르지 않습니다.');
  for(const field of ['back','sides'] as const)if(typeof v.inferred?.[field]!=='string'||v.inferred[field].length>300)throw Error('AI 추론 정보가 올바르지 않습니다.');
  return v;
}
function rgb(h:string):[number,number,number,number]{return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16)).concat(255) as [number,number,number,number]}
function shade(c:readonly number[],delta:number):[number,number,number,number]{return [Math.max(0,Math.min(255,c[0]+delta)),Math.max(0,Math.min(255,c[1]+delta)),Math.max(0,Math.min(255,c[2]+delta)),255]}
export function generateCharacter(spec:CharacterSpec,model:Model):Uint8ClampedArray{
  const s=validateCharacterSpec(spec),out=new Uint8ClampedArray(SIZE*SIZE*4);
  const c=Object.fromEntries(Object.entries(s.colors).map(([key,value])=>[key,rgb(value)])) as Record<keyof CharacterSpec['colors'],[number,number,number,number]>;
  function dot(x:number,y:number,color:readonly number[]){out.set(color,pixelIndex(x,y));}
  const armWidth=model==='slim'?3:4;
  for(const {part,layer,face,rect:r} of regions(model))for(let dy=0;dy<r.h;dy++)for(let dx=0;dx<r.w;dx++){
    let color:readonly number[]|null=null;
    if(layer==='base'){
      color=part==='head'?c.skin:part.includes('Leg')?c.bottom:c.top;
      if(part==='head'){
        if(face==='top'||face==='back'||(face==='front'&&(dy<2||dy===2&&(dx<2||dx>5)))||
          ((face==='left'||face==='right')&&(dy<3||s.hairStyle==='long'&&dy<7)))color=c.hair;
        if(face==='front'){
          const eyesY=s.eyeStyle==='large'?4:4;
          if(dy===eyesY&&(dx===2||dx===5))color=c.eyes;
          if(s.eyeStyle==='large'&&dy===5&&(dx===2||dx===5))color=c.eyes;
          if(dy===6&&(dx===3||dx===4))color=shade(c.skin,-45);
        }
      }else if(part==='body'){
        if(face==='front'&&s.outfitStyle!=='plain'){
          if((dx===3||dx===4)&&dy>=2&&dy<=9)color=s.outfitStyle==='uniform'?c.accent:c.topShade;
          if(s.outfitStyle==='jacket'&&dx===4&&dy>=3&&dy<=9)color=c.accent;
          if(s.outfitStyle==='dress'&&dy>=9)color=c.bottom;
        }
        if(face==='top')color=c.topShade;
      }else if(part.includes('Arm')){
        if(dy>=8)color=c.skin;
        if(face==='front'&&dy===1&&dx===Math.floor(armWidth/2))color=c.accent;
      }else if(part.includes('Leg')){
        if(dy>=9)color=c.shoes;
        if(face==='front'&&dy===0)color=c.topShade;
      }
      if(face==='back'||face==='left')color=shade(color,-12);
      if(face==='top')color=shade(color,9);
      if((dx+dy)%7===0&&face!=='front')color=shade(color,-4);
    }else if(part==='head'){
      if(face==='front'&&dy<=2&&(dy===0||s.hairStyle==='fringe'&&dx>=1&&dx<=6||s.hairStyle==='side_swept'&&dx<5))color=c.hairShade;
      if(face==='top'||face==='back'&&dy<=6||((face==='left'||face==='right')&&dy<5))color=c.hairShade;
      if(s.hairStyle==='long'&&(face==='back'||face==='left'||face==='right')&&dy<8)color=c.hairShade;
    }else if(part==='body'&&s.outfitStyle==='jacket'&&face==='front'&&dy>=2&&dy<=10&&(dx===1||dx===6))color=c.topShade;
    if(color)dot(r.x+dx,r.y+dy,color);
  }
  // A small face-art pass produces readable pixel eyes and hair highlights.
  // All coordinates remain inside the mapped head faces; the actual atlas is
  // still the single source of truth for the 3D viewer and exported PNG.
  const front=regions(model).find(r=>r.part==='head'&&r.layer==='base'&&r.face==='front')!.rect;
  const overlay=regions(model).find(r=>r.part==='head'&&r.layer==='overlay'&&r.face==='front')!.rect;
  const eyeY=s.eyeStyle==='soft'?4:4;
  const eyeWhite=shade(c.skin,36), eyeDark=shade(c.eyes,-42);
  for(const eyeX of [2,5]){
    dot(front.x+eyeX,front.y+eyeY, c.eyes);
    if(s.eyeStyle==='large'){
      dot(front.x+eyeX,front.y+eyeY+1,c.eyes);
      dot(front.x+eyeX,front.y+eyeY-1,eyeDark);
      dot(front.x+eyeX,front.y+eyeY+2,shade(c.skin,-9));
    }else{
      dot(front.x+eyeX,front.y+eyeY-1,shade(c.hair,-20));
      dot(front.x+eyeX,front.y+eyeY+1,shade(c.skin,-12));
    }
    // Tiny corner highlight preserves the observed iris hue at the central pixel.
    const corner=eyeX===2?eyeX-1:eyeX+1;
    dot(front.x+corner,front.y+eyeY,eyeWhite);
  }
  // Texture continuity: use sparse accent pixels, not noisy all-over patterns.
  for(const x of [1,3,6]){
    dot(overlay.x+x,overlay.y+(x===3?1:0),c.hairShade);
  }
  if(s.hairStyle==='fringe'){
    for(const x of [1,2,5,6])dot(overlay.x+x,overlay.y+2,c.hair);
    dot(overlay.x+2,overlay.y+3,c.hairShade);
  }
  if(s.hairStyle==='side_swept'){
    for(const [x,y] of [[1,2],[2,2],[3,2],[1,3]] as const)dot(overlay.x+x,overlay.y+y,c.hairShade);
  }
  if(s.outfitStyle==='uniform'||s.outfitStyle==='jacket'){
    const chest=regions(model).find(r=>r.part==='body'&&r.layer==='base'&&r.face==='front')!.rect;
    for(const [x,y] of [[2,2],[5,2],[3,5],[4,5]] as const)dot(chest.x+x,chest.y+y,c.topShade);
    for(const y of [6,9])dot(chest.x+4,chest.y+y,c.accent);
  }
  return out;
}
