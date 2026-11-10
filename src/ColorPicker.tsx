import {useEffect,useRef,useState} from 'react';
type Props={hex:string;alpha:number;allowAlpha:boolean;onChange:(hex:string,alpha:number)=>void};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,Math.round(n)));
export function hsvToRgb(h:number,s:number,v:number):[number,number,number]{
  const c=v*s,x=c*(1-Math.abs(h/60%2-1)),m=v-c;
  const [r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return [r,g,b].map(n=>clamp((n+m)*255,0,255)) as [number,number,number];
}
export function rgbToHsv(r:number,g:number,b:number):[number,number,number]{
  r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  let h=0;if(d){if(max===r)h=60*(((g-b)/d+6)%6);else if(max===g)h=60*((b-r)/d+2);else h=60*((r-g)/d+4);}
  return [h,max?d/max:0,max];
}
const hexOf=(values:number[])=>'#'+values.slice(0,3).map(v=>clamp(v,0,255).toString(16).padStart(2,'0')).join('');
const rgbaHex=(hex:string,alpha:number)=>hex.toUpperCase()+alpha.toString(16).padStart(2,'0').toUpperCase();
export default function ColorPicker({hex,alpha,allowAlpha,onChange}:Props){
  const [tab,setTab]=useState<'RGBA'|'HSVA'>('RGBA');
  const [hexDraft,setHexDraft]=useState(rgbaHex(hex,alpha));
  const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  const [derivedHue,s,v]=rgbToHsv(rgb[0],rgb[1],rgb[2]);
  const [hue,setHue]=useState(derivedHue);
  const h=s<.005?hue:derivedHue;
  const ring=useRef<HTMLCanvasElement>(null),square=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{if(s>.005)setHue(derivedHue)},[derivedHue,s]);
  useEffect(()=>setHexDraft(rgbaHex(hex,alpha)),[hex,alpha]);
  useEffect(()=>{const canvas=ring.current;if(!canvas)return;const ctx=canvas.getContext('2d')!,image=ctx.createImageData(220,220);
    for(let y=0;y<220;y++)for(let x=0;x<220;x++){
      const dx=x-110,dy=y-110,r=Math.hypot(dx,dy),i=(y*220+x)*4;
      if(r>=82&&r<=106){const angle=(Math.atan2(dy,dx)*180/Math.PI+360)%360;const c=hsvToRgb(angle,1,1);image.data.set([...c,255],i);}
    }ctx.putImageData(image,0,0);
  },[]);
  useEffect(()=>{const canvas=square.current;if(!canvas)return;const ctx=canvas.getContext('2d')!,image=ctx.createImageData(140,140);
    for(let y=0;y<140;y++)for(let x=0;x<140;x++)image.data.set([...hsvToRgb(h,x/139,1-y/139),255],(y*140+x)*4);
    ctx.putImageData(image,0,0);
  },[h]);
  function ringPick(e:React.PointerEvent<HTMLCanvasElement>){const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*220-110,y=(e.clientY-r.top)/r.height*220-110;
    if(Math.hypot(x,y)<74)return;const next=(Math.atan2(y,x)*180/Math.PI+360)%360;setHue(next);onChange(hexOf(hsvToRgb(next,s,v)),alpha);
  }
  function squarePick(e:React.PointerEvent<HTMLCanvasElement>){const r=e.currentTarget.getBoundingClientRect(),nextS=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),nextV=1-Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));onChange(hexOf(hsvToRgb(h,nextS,nextV)),alpha);}
  const channels=tab==='RGBA'?[
    ['R',rgb[0],255,'#ff6b6b'],['G',rgb[1],255,'#7fd886'],['B',rgb[2],255,'#7b9dff'],['A',alpha,255,'#d9d9e4']
  ] as const:[['H',Math.round(h),359,'#d1a1f5'],['S',Math.round(s*100),100,'#92d9f7'],['V',Math.round(v*100),100,'#f4ce8b'],['A',alpha,255,'#d9d9e4']] as const;
  function channelChange(label:string,value:number){const n=Number.isFinite(value)?value:0;
    if(label==='A'){onChange(hex,clamp(n,0,255));return;}
    if(tab==='RGBA'){const next=[...rgb];next['RGB'.indexOf(label)]=clamp(n,0,255);onChange(hexOf(next),alpha);}
    else{const hh=label==='H'?clamp(n,0,359):h,ss=label==='S'?clamp(n,0,100)/100:s,vv=label==='V'?clamp(n,0,100)/100:v;setHue(hh);onChange(hexOf(hsvToRgb(hh,ss,vv)),alpha);}
  }
  return <div className="advanced-color">
    <div className="color-tabs"><button className={tab==='RGBA'?'active':''} onClick={()=>setTab('RGBA')}>RGBA</button><button className={tab==='HSVA'?'active':''} onClick={()=>setTab('HSVA')}>HSVA</button></div>
    <div className="color-wheel"><canvas className="hue-ring" ref={ring} width={220} height={220} aria-label="색상환" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);ringPick(e)}} onPointerMove={e=>{if(e.buttons)ringPick(e)}}/>
      <canvas className="sv-square" ref={square} width={140} height={140} aria-label="채도와 밝기" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);squarePick(e)}} onPointerMove={e=>{if(e.buttons)squarePick(e)}}/>
      <span className="wheel-marker" style={{left:`calc(50% + ${Math.cos(h*Math.PI/180)*94}px)`,top:`calc(50% + ${Math.sin(h*Math.PI/180)*94}px)`}}/>
      <span className="square-marker" style={{left:`calc(50% - 70px + ${s*140}px)`,top:`calc(50% - 70px + ${(1-v)*140}px)`}}/>
    </div>
    <div className="color-channels">{channels.map(([label,value,max,tint])=><label key={label}><span>{label}</span><input aria-label={`${label} 채널`} type="range" min="0" max={max} value={value} disabled={label==='A'&&!allowAlpha} style={{accentColor:tint}} onChange={e=>channelChange(label,Number(e.target.value))}/><input aria-label={`${label} 값`} type="number" min="0" max={max} value={value} disabled={label==='A'&&!allowAlpha} onChange={e=>channelChange(label,Number(e.target.value))}/></label>)}</div>
    <div className="hex-row"><label htmlFor="hex-color">HEX</label><input id="hex-color" aria-label="HEX 색상" value={hexDraft} maxLength={9} onChange={e=>{const value=e.target.value.toUpperCase();setHexDraft(value);if(/^#[0-9A-F]{8}$/.test(value))onChange(value.slice(0,7),allowAlpha?parseInt(value.slice(7),16):255);else if(/^#[0-9A-F]{6}$/.test(value))onChange(value,alpha)}} onBlur={()=>setHexDraft(rgbaHex(hex,alpha))}/><div className="color-preview" style={{backgroundColor:`rgba(${rgb.join(',')},${alpha/255})`}}/></div>
  </div>;
}
