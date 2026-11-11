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
      // Flat, coherent pixel clusters look cleaner than periodic shading noise.
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
  // Art-direction pass: intentional 2–4 pixel clusters instead of scattered
  // noise. All details stay inside official base/overlay UV face rectangles.
  type ArtPart='head'|'body'|'rightArm'|'leftArm'|'rightLeg'|'leftLeg';
  type ArtLayer='base'|'overlay';
  type ArtFace='front'|'back'|'left'|'right'|'top'|'bottom';
  const table=new Map(regions(model).map(r=>[r.part+'/'+r.layer+'/'+r.face,r.rect]));
  const put=(part:ArtPart,layer:ArtLayer,face:ArtFace,x:number,y:number,color:readonly number[]|null)=>{
    const r=table.get(part+'/'+layer+'/'+face)!;
    if(x>=0&&y>=0&&x<r.w&&y<r.h)dot(r.x+x,r.y+y,color||[0,0,0,0]);
  };
  const mix=(a:readonly number[],b:readonly number[],ratio:number):[number,number,number,number]=>[
    Math.round(a[0]*(1-ratio)+b[0]*ratio),
    Math.round(a[1]*(1-ratio)+b[1]*ratio),
    Math.round(a[2]*(1-ratio)+b[2]*ratio),255
  ];
  const light=(color:readonly number[])=>mix(color,[255,247,245,255],.19);
  const deep=(color:readonly number[])=>mix(color,[26,32,47,255],.24);
  const blush=mix(c.skin,[231,121,141,255],.20);
  const fabricLight=light(c.top),fabricDark=deep(c.topShade);
  // More readable face: small cheeks and restrained brows; observed iris remains
  // the exact provider color at x=2/5, y=4 for both arm models.
  for(const x of [1,6])put('head','base','front',x,6,blush);
  for(const x of [2,5])put('head','base','front',x,3,deep(c.hair));
  put('head','base','front',3,6,mix(c.skin,[105,63,76,255],.3));
  put('head','base','front',4,6,c.skin);
  put('head','base','front',3,7,deep(c.skin));
  put('head','base','front',4,7,c.skin);

  // Replace the old full forehead overlay with different, connected bang
  // silhouettes. Sparse highlights are clustered along hair strands.
  for(let y=0;y<8;y++)for(let x=0;x<8;x++)put('head','overlay','front',x,y,null);
  for(let x=0;x<8;x++)put('head','overlay','front',x,0,deep(c.hair));
  for(let x=0;x<8;x++)if(x!==3&&x!==4)put('head','overlay','front',x,1,c.hair);
  const fringe=s.hairStyle==='fringe';
  const swept=s.hairStyle==='side_swept';
  for(const x of fringe?[0,1,2,5,6,7]:swept?[0,1,2,3,4,7]:[0,1,6,7]){
    put('head','overlay','front',x,2,x%2?c.hair:c.hairShade);
  }
  if(fringe){for(const [x,y] of [[1,3],[2,3],[5,3],[6,3]] as const)put('head','overlay','front',x,y,c.hair);}
  if(swept){for(const [x,y] of [[0,3],[1,3],[2,3],[1,4]] as const)put('head','overlay','front',x,y,c.hairShade);}
  const sideLength=s.hairStyle==='long'?8:5;
  for(let y=2;y<sideLength;y++){
    put('head','overlay','front',0,y,y%3===0?deep(c.hair):c.hair);
    put('head','overlay','front',7,y,y%3===1?c.hairShade:c.hair);
  }
  for(const [x,y] of [[1,0],[2,1],[5,0],[6,1]] as const)put('head','overlay','front',x,y,light(c.hair));
  for(const face of ['back','left','right'] as const){
    for(let x=0;x<8;x++)for(let y=0;y<8;y++){
      const isLong=s.hairStyle==='long';
      // Connected hair panel with a soft strand edge rather than all-over specks.
      if(y<(isLong?8:face==='back'?6:5)){
        const color=(x===0||x===7)?deep(c.hair):(x===2&&y>1&&y<6)?light(c.hair):c.hair;
        put('head','overlay',face,x,y,color);
      }else put('head','overlay',face,x,y,null);
    }
    if(face==='back')for(const x of [1,5])for(let y=3;y<7;y++)put('head','overlay',face,x,y,c.hairShade);
  }
  // Top panels form soft stripes rather than a noisy checkerboard.
  for(let y=1;y<7;y++)for(const x of [2,5])put('head','overlay','top',x,y,light(c.hair));

  // Fabric construction: collar, lapels, seams, restrained accent buttons,
  // jacket hem and sleeve cuffs. No guessed accessories outside the skin UV.
  for(let y=0;y<12;y++){
    for(const x of [0,7])put('body','base','front',x,y,y>9?fabricDark:deep(c.top));
    if(y>2&&y<10){
      put('body','base','front',3,y,mix(c.top,c.topShade,.56));
      put('body','base','front',4,y,y%3===0?fabricLight:c.top);
    }
  }
  for(const x of [2,3,4,5])put('body','base','front',x,0,fabricLight);
  for(const [x,y] of [[2,1],[3,2],[5,1],[4,2]] as const)put('body','base','front',x,y,c.topShade);
  for(const y of [5,8])put('body','base','front',4,y,c.accent);
  for(let x=1;x<7;x++)put('body','base','front',x,10,deep(c.bottom));
  for(let y=2;y<9;y++){
    for(const x of [1,6])put('body','overlay','front',x,y,
      s.outfitStyle==='plain'?null:y%3===0?fabricLight:c.topShade);
  }
  if(s.outfitStyle==='jacket'||s.outfitStyle==='uniform'){
    for(const [x,y] of [[2,2],[2,3],[3,4],[5,2],[5,3],[4,4]] as const)
      put('body','overlay','front',x,y,y===4?c.topShade:fabricLight);
  }
  if(s.outfitStyle==='dress'){
    for(let x=1;x<7;x++)put('body','overlay','front',x,10,x===1||x===6?deep(c.bottom):light(c.bottom));
    for(const x of [1,6])put('body','overlay','front',x,11,deep(c.bottom));
  }
  for(const part of ['rightArm','leftArm'] as const){
    const w=model==='slim'?3:4;
    for(const face of ['front','back','left','right'] as const){
      const width=table.get(part+'/base/'+face)!.w;
      for(let x=0;x<width;x++){
        for(const y of [0,8])put(part,'base',face,x,y,fabricDark);
        for(const y of [1,9])put(part,'base',face,x,y,fabricLight);
        for(const y of [10,11])put(part,'base',face,x,y,x===0?deep(c.skin):c.skin);
      }
      if(face==='front'){
        put(part,'base',face,Math.floor(w/2),3,fabricLight);
        put(part,'base',face,Math.floor(w/2),5,deep(c.top));
        // Outer sleeve stripe follows the actual 3px/4px arm width.
        for(let y=3;y<7;y++)put(part,'overlay',face,0,y,s.outfitStyle==='plain'?null:fabricLight);
      }
    }
  }
  for(const part of ['rightLeg','leftLeg'] as const)for(const face of ['front','back','left','right'] as const){
    const w=table.get(part+'/base/'+face)!.w;
    for(let x=0;x<w;x++){
      for(const y of [0,1,2])put(part,'base',face,x,y,y===2?deep(c.bottom):c.bottom);
      for(const y of [8,9])put(part,'base',face,x,y,y===8?light(c.shoes):c.shoes);
      put(part,'base',face,x,11,deep(c.shoes));
    }
    if(face==='front'){
      put(part,'base',face,1,9,light(c.shoes));
      put(part,'base',face,2,9,c.shoes);
    }
  }
  return out;
}
