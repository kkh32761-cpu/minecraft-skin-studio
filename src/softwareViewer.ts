import {pixelIndex,regions,type Face,type Layer,type Model,type Part} from './skin';
type Vec=[number,number,number];
type Pose={part:Part;center:Vec;size:Vec;pivot?:Vec;swing?:number};
type Settings={model:Model;outer:boolean;yaw:number;pitch:number;zoom:number;motion:number};
const FACE_NORMAL:Record<Face,Vec>={front:[0,0,1],back:[0,0,-1],left:[-1,0,0],right:[1,0,0],top:[0,1,0],bottom:[0,-1,0]};
const clamp=(n:number,a:number,b:number)=>Math.min(b,Math.max(a,n));
export function drawSoftwareViewer(canvas:HTMLCanvasElement,data:Uint8ClampedArray,s:Settings){
  const w=canvas.clientWidth||400,h=canvas.clientHeight||500,dpr=Math.min(devicePixelRatio||1,2);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  const ctx=canvas.getContext('2d')!;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#233747');sky.addColorStop(1,'#111d29');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  const scale=Math.min(w/36,h/40)*s.zoom;
  const cy=Math.cos(s.yaw),sy=Math.sin(s.yaw),cp=Math.cos(s.pitch),sp=Math.sin(s.pitch);
  function view(p:Vec):Vec {const x=cy*p[0]+sy*p[2],z=-sy*p[0]+cy*p[2];return [x,cp*p[1]-sp*z,sp*p[1]+cp*z];}
  function project(p:Vec):[number,number]{const q=view(p);return [w/2+q[0]*scale,h/2-(q[1]-16)*scale];}
  const arm=s.model==='slim'?3:4,m=s.motion;
  const poses:Pose[]=[
    {part:'body',center:[0,18,0],size:[8,12,4]},
    {part:'head',center:[0,28,0],size:[8,8,8]},
    {part:'rightArm',center:[-4-arm/2,18,0],size:[arm,12,4],pivot:[-4-arm/2,24,0],swing:m},
    {part:'leftArm',center:[4+arm/2,18,0],size:[arm,12,4],pivot:[4+arm/2,24,0],swing:-m},
    {part:'rightLeg',center:[-2,6,0],size:[4,12,4],pivot:[-2,12,0],swing:-m},
    {part:'leftLeg',center:[2,6,0],size:[4,12,4],pivot:[2,12,0],swing:m}
  ];
  const projected:{depth:number;points:[number,number][];rgba:number[];layer:Layer}[]=[];
  function transform(p:Vec,pose:Pose):Vec {
    if(!pose.pivot||!pose.swing)return p;
    const dy=p[1]-pose.pivot[1],dz=p[2]-pose.pivot[2],c=Math.cos(pose.swing),sn=Math.sin(pose.swing);
    return [p[0],pose.pivot[1]+dy*c-dz*sn,pose.pivot[2]+dy*sn+dz*c];
  }
  function facePoint(face:Face,pose:Pose,a:number,b:number,inflate:number):Vec {
    const [x,y,z]=pose.center,[sx,sh,sz]=pose.size;
    const X=sx/2+inflate,Y=sh/2+inflate,Z=sz/2+inflate;
    switch(face){
      case 'front':return transform([x-X+a*(sx+2*inflate),y+Y-b*(sh+2*inflate),z+Z],pose);
      case 'back':return transform([x+X-a*(sx+2*inflate),y+Y-b*(sh+2*inflate),z-Z],pose);
      case 'left':return transform([x-X,y+Y-b*(sh+2*inflate),z-Z+a*(sz+2*inflate)],pose);
      case 'right':return transform([x+X,y+Y-b*(sh+2*inflate),z+Z-a*(sz+2*inflate)],pose);
      case 'top':return transform([x-X+a*(sx+2*inflate),y+Y,z-Z+b*(sz+2*inflate)],pose);
      case 'bottom':return transform([x-X+a*(sx+2*inflate),y-Y,z+Z-b*(sz+2*inflate)],pose);
    }
  }
  for(const pose of poses)for(const region of regions(s.model).filter(r=>r.part===pose.part&&(s.outer||r.layer==='base'))){
    const {face,layer,rect:r}=region;let n=FACE_NORMAL[face];
    if(pose.swing){const c=Math.cos(pose.swing),sn=Math.sin(pose.swing);n=[n[0],n[1]*c-n[2]*sn,n[1]*sn+n[2]*c];}
    if(view(n)[2]<.005)continue;
    const inf=layer==='overlay'?.25:0;
    for(let py=0;py<r.h;py++)for(let px=0;px<r.w;px++){
      const color=Array.from(data.slice(pixelIndex(r.x+px,r.y+py),pixelIndex(r.x+px,r.y+py)+4));if(color[3]===0)continue;
      const a=px/r.w,b=py/r.h,da=1/r.w,db=1/r.h;
      const corners:[number,number][]=[facePoint(face,pose,a,b,inf),facePoint(face,pose,a+da,b,inf),facePoint(face,pose,a+da,b+db,inf),facePoint(face,pose,a,b+db,inf)].map(project);
      const mid=facePoint(face,pose,a+da/2,b+db/2,inf);projected.push({depth:view(mid)[2],points:corners,rgba:color,layer});
    }
  }
  projected.sort((a,b)=>a.depth-b.depth || (a.layer==='base'?-1:1));
  for(const poly of projected){const [r,g,b,a]=poly.rgba;ctx.fillStyle=`rgba(${r},${g},${b},${a/255})`;ctx.beginPath();ctx.moveTo(...poly.points[0]);for(let i=1;i<4;i++)ctx.lineTo(...poly.points[i]);ctx.closePath();ctx.fill();}
  ctx.fillStyle='#e5c08c';ctx.font='11px system-ui';ctx.fillText('CANVAS 3D · WebGL 사용 불가 환경',14,h-14);
}
export function bindSoftwareControls(canvas:HTMLCanvasElement,onChange:(yaw:number,pitch:number,zoom:number)=>void,initial:{yaw:number;pitch:number;zoom:number}){
  const state={...initial}, pointers=new Map<number,{x:number;y:number}>();let lastDistance=0;
  const down=(e:PointerEvent)=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});};
  const move=(e:PointerEvent)=>{const old=pointers.get(e.pointerId);if(!old)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===1){state.yaw+=(e.clientX-old.x)*.012;state.pitch=clamp(state.pitch+(e.clientY-old.y)*.008,-.5,1.25);}
    else{const p=[...pointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(lastDistance)state.zoom=clamp(state.zoom*d/lastDistance,.5,1.8);lastDistance=d;}
    onChange(state.yaw,state.pitch,state.zoom);
  };
  const up=(e:PointerEvent)=>{pointers.delete(e.pointerId);lastDistance=0;};
  const wheel=(e:WheelEvent)=>{e.preventDefault();state.zoom=clamp(state.zoom*(e.deltaY>0?.92:1.08),.5,1.8);onChange(state.yaw,state.pitch,state.zoom);};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:false});
  return {set(yaw:number,pitch:number,zoom:number){Object.assign(state,{yaw,pitch,zoom});onChange(state.yaw,state.pitch,state.zoom);},dispose(){canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('wheel',wheel);}};
}
