export const SIZE = 64;
export type Model = 'default' | 'slim';
export type Part = 'head' | 'body' | 'rightArm' | 'leftArm' | 'rightLeg' | 'leftLeg';
export type Layer = 'base' | 'overlay';
export type Face = 'top' | 'bottom' | 'left' | 'front' | 'right' | 'back';
export type Rect = { x: number; y: number; w: number; h: number };
export type Region = { part: Part; layer: Layer; face: Face; rect: Rect };
export const parts: { id: Part; label: string }[] = [
  {id:'head',label:'머리'}, {id:'body',label:'몸통'}, {id:'rightArm',label:'오른팔'},
  {id:'leftArm',label:'왼팔'}, {id:'rightLeg',label:'오른다리'}, {id:'leftLeg',label:'왼다리'}
];
const faces: Face[] = ['top','bottom','left','front','right','back'];
// SkinViewer의 setSkinUVs와 동일한 베이스 좌표. 모든 사각형은 반열림 구간.
const origins: Record<Part, Record<Layer, [number,number]>> = {
  head: {base:[0,0],overlay:[32,0]},
  body: {base:[16,16],overlay:[16,32]},
  rightArm: {base:[40,16],overlay:[40,32]},
  leftArm: {base:[32,48],overlay:[48,48]},
  rightLeg: {base:[0,16],overlay:[0,32]},
  leftLeg: {base:[16,48],overlay:[0,48]}
};
export function regions(model: Model): Region[] {
  const out: Region[] = [];
  for (const {id:part} of parts) for (const layer of ['base','overlay'] as const) {
    const [u,v] = origins[part][layer];
    const w = part === 'head' || part === 'body' ? 8 : part.includes('Arm') && model === 'slim' ? 3 : 4;
    const h = part === 'head' ? 8 : 12;
    const d = part === 'head' ? 8 : 4;
    const rects: Rect[] = [
      {x:u+d,y:v,w,h:d}, {x:u+d+w,y:v,w,h:d},
      {x:u,y:v+d,w:d,h}, {x:u+d,y:v+d,w,h},
      {x:u+d+w,y:v+d,w:d,h}, {x:u+2*d+w,y:v+d,w,h}
    ];
    faces.forEach((face,i) => out.push({part,layer,face,rect:rects[i]}));
  }
  return out;
}
export function at(r: Rect, x: number, y: number): boolean { return x >= r.x && x < r.x+r.w && y >= r.y && y < r.y+r.h; }
export function findRegion(model: Model, x: number, y: number, layer?: Layer): Region | undefined {
  return regions(model).find(r => (!layer || r.layer === layer) && at(r.rect,x,y));
}
export function pixelIndex(x:number,y:number):number { return (y*SIZE+x)*4; }
export function paint(data: Uint8ClampedArray,x:number,y:number,rgba:readonly number[]):Uint8ClampedArray {
  const result = new Uint8ClampedArray(data);
  result.set(rgba,pixelIndex(x,y)); return result;
}
export function rgbaHex(data:Uint8ClampedArray,x:number,y:number):string {
  return '#'+Array.from(data.slice(pixelIndex(x,y),pixelIndex(x,y)+3)).map(n=>n.toString(16).padStart(2,'0')).join('');
}
export function hexRgba(hex:string,alpha=255):[number,number,number,number] {
  return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).concat(alpha) as [number,number,number,number];
}
export function fill(data:Uint8ClampedArray,x:number,y:number,color:readonly number[],region:Rect):Uint8ClampedArray {
  if(!at(region,x,y)) return data;
  const out=new Uint8ClampedArray(data), start=pixelIndex(x,y), source=Array.from(out.slice(start,start+4));
  if(source.every((v,i)=>v===color[i])) return out;
  const q=[y*SIZE+x], seen=new Uint8Array(SIZE*SIZE);
  while(q.length){
    const p=q.pop()!; if(seen[p]) continue; seen[p]=1;
    const px=p%SIZE, py=(p/SIZE)|0; if(!at(region,px,py)) continue;
    const i=p*4; if(!source.every((v,j)=>out[i+j]===v)) continue;
    out.set(color,i);
    if(px>region.x) q.push(p-1); if(px<region.x+region.w-1) q.push(p+1);
    if(py>region.y) q.push(p-SIZE); if(py<region.y+region.h-1) q.push(p+SIZE);
  }
  return out;
}
export function clearRegion(data:Uint8ClampedArray,part:Part,layer:Layer,model:Model):Uint8ClampedArray {
  const out=new Uint8ClampedArray(data);
  for(const {rect:r} of regions(model).filter(v=>v.part===part&&v.layer===layer))
    for(let y=r.y;y<r.y+r.h;y++) for(let x=r.x;x<r.x+r.w;x++) out.set([0,0,0,layer==='base'?255:0],pixelIndex(x,y));
  return out;
}
export function blankSkin():Uint8ClampedArray {
  const out=new Uint8ClampedArray(SIZE*SIZE*4);
  for(const {rect:r} of regions('default').filter(v=>v.layer==='base'))
    for(let y=r.y;y<r.y+r.h;y++) for(let x=r.x;x<r.x+r.w;x++) out.set([218,173,137,255],pixelIndex(x,y));
  return out;
}
export function sampleSkin(model:Model):Uint8ClampedArray {
  const out=new Uint8ClampedArray(SIZE*SIZE*4);
  const skin=[226,184,147,255], hair=[48,37,51,255], jacket=[45,81,103,255], pants=[52,58,78,255], shoes=[30,33,42,255];
  for(const {part,layer,face,rect:r} of regions(model)) {
    if(layer==='overlay' && part!=='head' && part!=='body') continue;
    if(layer==='overlay' && part==='body' && face!=='front') continue;
    const base = layer==='overlay' ? hair : part==='head' ? skin : part.includes('Leg') ? pants : jacket;
    for(let y=r.y;y<r.y+r.h;y++) for(let x=r.x;x<r.x+r.w;x++) {
      const dx=x-r.x,dy=y-r.y;
      let c = base;
      if(part==='head') {
        if(layer==='base' && (face==='top'||face==='back'||face==='left'||face==='right'||(face==='front'&&dy<2))) c=hair;
        if(layer==='overlay' && !(face==='front'&&dy<2 || face==='top' || face==='back' || (face==='left'||face==='right')&&dy<4)) continue;
        if(layer==='overlay'&&face==='front'&&dy===1&&dx>2&&dx<5) continue;
        if(layer==='base'&&face==='front'&&dy===4&&(dx===2||dx===5)) c=[94,50,92,255];
        if(layer==='base'&&face==='front'&&dy===5&&(dx===2||dx===5)) c=[255,241,224,255];
        if(layer==='base'&&face==='front'&&dy===6&&(dx===1||dx===6)) c=[225,132,139,255];
      }
      if(part.includes('Arm')&&layer==='base'&&dy>=8) c=skin;
      if(part.includes('Leg')&&dy>=9) c=shoes;
      if(part==='body'&&layer==='base'&&face==='front'&&dx===3&&dy>=3) c=[232,201,146,255];
      if(layer==='overlay'&&part==='body'&&!(dx===2||dx===4) || layer==='overlay'&&part==='body'&&dy<2) continue;
      const shade=(dx+dy)%5===0 ? -12 : face==='back' ? -18 : face==='top' ? 12 : 0;
      out.set([Math.max(0,c[0]+shade),Math.max(0,c[1]+shade),Math.max(0,c[2]+shade),255],pixelIndex(x,y));
    }
  }
  return out;
}
export function assertSkinDimensions(width:number,height:number):void {
  if(width!==64||height!==64) throw new Error('64×64 PNG 스킨만 불러올 수 있습니다.');
}
export function canvasFromData(data:Uint8ClampedArray):HTMLCanvasElement {
  const c=document.createElement('canvas'); c.width=c.height=SIZE;
  c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(data),SIZE,SIZE),0,0); return c;
}
