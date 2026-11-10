import {useEffect,useRef,useState} from 'react';
import {SkinViewer,IdleAnimation,WalkingAnimation,RunningAnimation} from 'skinview3d';
import {drawSoftwareViewer,bindSoftwareControls} from './softwareViewer';
import {assertSkinDimensions,blankSkin,canvasFromData,clearRegion,fill,findRegion,hexRgba,paint,parts,regions,rgbaHex,sampleSkin,SIZE,type Layer,type Model,type Part,type Region} from './skin';
const CACHE='minecraft-skin-studio-v1';
type Tool='pen'|'eraser'|'picker'|'fill';
type Animation='stop'|'idle'|'walk'|'run';
const palette=['#302633','#5e3e58','#a65872','#e0a7a1','#f1d5b5','#f9e7d3','#fcf8e8','#234b63','#4b7894','#98bac2','#343d53','#787b93','#f0c579','#404a2e','#76523e','#151820'];
const labels: Record<string,string>={top:'윗면',bottom:'아랫면',left:'왼쪽 면',front:'앞면',right:'오른쪽 면',back:'뒷면'};
function readSaved():{data:Uint8ClampedArray,model:Model}|null {
  try {const raw=JSON.parse(localStorage.getItem(CACHE)||'null'); if(!raw||!['slim','default'].includes(raw.model))return null;
    const bytes=Uint8Array.from(atob(raw.rgba),c=>c.charCodeAt(0));if(bytes.length!==64*64*4)return null;return {data:new Uint8ClampedArray(bytes),model:raw.model};
  }catch{return null;}
}
export default function App(){
  const [data,setData]=useState<Uint8ClampedArray>(()=>blankSkin());
  const [model,setModel]=useState<Model>('default');
  const [part,setPart]=useState<Part>('head');
  const [layer,setLayer]=useState<Layer>('base');
  const [tool,setTool]=useState<Tool>('pen');
  const [color,setColor]=useState('#5e3e58');
  const [grid,setGrid]=useState(true);
  const [outer,setOuter]=useState(true);
  const [zoom,setZoom]=useState(8);
  const [animation,setAnimation]=useState<Animation>('idle');
  const [softwareMode,setSoftwareMode]=useState(false);
  const softwareView=useRef({yaw:0,pitch:.12,zoom:.9});
  const softwareControls=useRef<ReturnType<typeof bindSoftwareControls>|null>(null);
  const [status,setStatus]=useState('새 스킨을 편집하거나 기존 64×64 PNG를 불러오세요.');
  const [hover,setHover]=useState<Region|null>(null);
  const [revision,setRevision]=useState(0);
  const [undoCount,setUndoCount]=useState(0);
  const [redoCount,setRedoCount]=useState(0);
  const [reference,setReference]=useState<string|null>(null);
  const viewerCanvas=useRef<HTMLCanvasElement>(null),uvCanvas=useRef<HTMLCanvasElement>(null),viewer=useRef<SkinViewer|null>(null);
  const fileInput=useRef<HTMLInputElement>(null),refInput=useRef<HTMLInputElement>(null);
  const current=useRef(data),history=useRef<Uint8ClampedArray[]>([]),future=useRef<Uint8ClampedArray[]>([]),drawing=useRef(false);
  const modelRef=useRef(model),partRef=useRef(part),layerRef=useRef(layer),toolRef=useRef(tool),colorRef=useRef(color);
  current.current=data;modelRef.current=model;partRef.current=part;layerRef.current=layer;toolRef.current=tool;colorRef.current=color;
  function commit(next:Uint8ClampedArray,saveHistory=true){
    if(next===current.current)return;
    if(saveHistory){history.current.push(new Uint8ClampedArray(current.current));if(history.current.length>40)history.current.shift();future.current=[];}
    current.current=next;setData(next);setRevision(n=>n+1);setUndoCount(history.current.length);setRedoCount(future.current.length);
  }
  function undo(){if(!history.current.length)return;future.current.push(new Uint8ClampedArray(current.current));const v=history.current.pop()!;current.current=v;setData(v);setRevision(n=>n+1);setUndoCount(history.current.length);setRedoCount(future.current.length);}
  function redo(){if(!future.current.length)return;history.current.push(new Uint8ClampedArray(current.current));const v=future.current.pop()!;current.current=v;setData(v);setRevision(n=>n+1);setUndoCount(history.current.length);setRedoCount(future.current.length);}
  useEffect(()=>{const saved=readSaved();if(saved){current.current=saved.data;setData(saved.data);setModel(saved.model);setStatus('브라우저에 저장된 이전 작업을 복원했습니다.');}},[]);
  useEffect(()=>{const id=window.setTimeout(()=>{try{localStorage.setItem(CACHE,JSON.stringify({rgba:btoa(String.fromCharCode(...data)),model}));}catch{setStatus('브라우저 저장 공간이 부족합니다. PNG를 다운로드해 보관하세요.');}},500);return()=>clearTimeout(id)},[data,model]);
  useEffect(()=>{const el=viewerCanvas.current;if(!el)return;try{
    const rect=el.parentElement!.getBoundingClientRect();const v=new SkinViewer({canvas:el,width:Math.max(280,Math.floor(rect.width)),height:Math.max(340,Math.floor(rect.height)),skin:canvasFromData(current.current),model:modelRef.current,zoom:0.81,background:0x151d28});
    v.animation=new IdleAnimation();viewer.current=v;
    const ro=new ResizeObserver(()=>{if(!v.disposed){const r=el.parentElement!.getBoundingClientRect();v.setSize(Math.max(280,Math.floor(r.width)),Math.max(340,Math.floor(r.height)));}});ro.observe(el.parentElement!);
    return()=>{ro.disconnect();v.dispose();viewer.current=null;};
  }catch(e){setSoftwareMode(true);setStatus('WebGL을 사용할 수 없어 PNG 기반 Canvas 3D 모드로 표시합니다.');console.warn('WebGL unavailable, using Canvas preview',e);}},[]);
  useEffect(()=>{if(!softwareMode||!viewerCanvas.current)return;const c=viewerCanvas.current;softwareControls.current=bindSoftwareControls(c,(yaw,pitch,zoom)=>{softwareView.current={yaw,pitch,zoom};drawSoftwareViewer(c,current.current,{...softwareView.current,model:modelRef.current,outer,motion:0});},softwareView.current);return()=>{softwareControls.current?.dispose();softwareControls.current=null;};},[softwareMode]);
  useEffect(()=>{if(!softwareMode||!viewerCanvas.current)return;const c=viewerCanvas.current;let frame=0,last=0;const tick=(now:number)=>{if(now-last>40){const motion=animation==='walk'?Math.sin(now/170)*.48:animation==='run'?Math.sin(now/100)*.75:animation==='idle'?Math.sin(now/700)*.03:0;drawSoftwareViewer(c,data,{...softwareView.current,model,outer,motion});last=now;}frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[softwareMode,data,model,outer,animation]);
  useEffect(()=>{const v=viewer.current;if(!v)return;v.loadSkin(canvasFromData(data),{model});v.playerObject.skin.setOuterLayerVisible(outer);},[data,model,outer]);
  useEffect(()=>{const v=viewer.current;if(!v)return;v.animation=animation==='idle'?new IdleAnimation():animation==='walk'?new WalkingAnimation():animation==='run'?new RunningAnimation():null;},[animation]);
  useEffect(()=>{const c=uvCanvas.current;if(!c)return;const ctx=c.getContext('2d')!;ctx.clearRect(0,0,512,512);
    ctx.fillStyle='#1d2934';ctx.fillRect(0,0,512,512);ctx.imageSmoothingEnabled=false;ctx.drawImage(canvasFromData(data),0,0,512,512);
    if(grid){ctx.beginPath();for(let i=0;i<=64;i++){ctx.moveTo(i*8+.5,0);ctx.lineTo(i*8+.5,512);ctx.moveTo(0,i*8+.5);ctx.lineTo(512,i*8+.5);}ctx.strokeStyle='rgba(255,255,255,.13)';ctx.lineWidth=.7;ctx.stroke();}
    ctx.strokeStyle='rgba(255,210,115,.85)';ctx.lineWidth=1.5;
    for(const {rect:r} of regions(model).filter(v=>v.part===part&&v.layer===layer))ctx.strokeRect(r.x*8+1,r.y*8+1,r.w*8-2,r.h*8-2);
  },[data,model,part,layer,grid]);
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo();}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);});
  function uvPoint(e:React.PointerEvent<HTMLCanvasElement>){const r=e.currentTarget.getBoundingClientRect();return{x:Math.floor((e.clientX-r.left)/r.width*SIZE),y:Math.floor((e.clientY-r.top)/r.height*SIZE)};}
  function apply(e:React.PointerEvent<HTMLCanvasElement>,first:boolean){
    const {x,y}=uvPoint(e);if(x<0||x>=64||y<0||y>=64)return;
    const region=findRegion(modelRef.current,x,y,layerRef.current);setHover(region||null);
    if(!region||region.part!==partRef.current)return;
    const t=toolRef.current;
    if(t==='picker'){setColor(rgbaHex(current.current,x,y));setStatus(`${x}, ${y} 색상을 선택했습니다.`);return;}
    const rgba=t==='eraser'?layerRef.current==='overlay'?[0,0,0,0]:[0,0,0,255]:hexRgba(colorRef.current);
    if(t==='fill'&&!first)return;
    const next=t==='fill'?fill(current.current,x,y,rgba,region.rect):paint(current.current,x,y,rgba);
    if(first){history.current.push(new Uint8ClampedArray(current.current));if(history.current.length>40)history.current.shift();future.current=[];setUndoCount(history.current.length);setRedoCount(0);}
    commit(next,false);
  }
  async function importSkin(file?:File){if(!file)return;
    if(file.size>15*1024*1024){setStatus('파일이 15MB를 초과합니다.');return;}
    try{const signature=new Uint8Array(await file.slice(0,8).arrayBuffer());if(signature.length!==8||![137,80,78,71,13,10,26,10].every((v,i)=>signature[i]===v))throw Error('스킨 파일은 PNG만 지원합니다.');
      const image=await createImageBitmap(file);assertSkinDimensions(image.width,image.height);
      const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);image.close();
      commit(new Uint8ClampedArray(ctx.getImageData(0,0,64,64).data));setStatus(`${file.name} 스킨을 불러왔습니다.`);
    }catch(e){setStatus(e instanceof Error?e.message:'PNG를 읽을 수 없습니다.');}
    if(fileInput.current)fileInput.current.value='';
  }
  async function importReference(file?:File){if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>15*1024*1024){setStatus('참고 이미지는 PNG·JPG·WebP, 최대 15MB입니다.');return;}
    try{const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>25000000)throw Error('이미지 해상도가 너무 큽니다 (최대 2,500만 픽셀).');
      const c=document.createElement('canvas');const scale=Math.min(1,800/Math.max(bitmap.width,bitmap.height));c.width=Math.round(bitmap.width*scale);c.height=Math.round(bitmap.height*scale);c.getContext('2d')!.drawImage(bitmap,0,0,c.width,c.height);bitmap.close();setReference(c.toDataURL('image/jpeg',.86));setStatus('참고 이미지를 표시했습니다. AI 자동 생성은 아직 연결되지 않았습니다.');
    }catch(e){setStatus(e instanceof Error?e.message:'이미지를 읽지 못했습니다.');}
    if(refInput.current)refInput.current.value='';
  }
  function download(){const c=canvasFromData(data);c.toBlob(blob=>{if(!blob){setStatus('PNG 생성에 실패했습니다.');return;}const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download=`minecraft-skin-${model==='slim'?'alex':'steve'}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus('64×64 PNG를 다운로드했습니다. 게임 업로드 시 같은 팔 모델을 선택하세요.');},'image/png');}
  const selected=hover&&hover.part===part&&hover.layer===layer?`${parts.find(p=>p.id===hover.part)?.label} · ${labels[hover.face]} · ${hover.rect.x},${hover.rect.y}`:'선택한 부위의 테두리 안에서 편집하세요';
  return <div className="app">
    <header className="topbar"><div className="brand"><div className="brand-mark">▦</div><div><strong>SKIN STUDIO</strong><small>MINECRAFT · 64×64</small></div></div><span className="version">ENGINE v0.1 · AI 연동 전</span><button className="primary download-top" onClick={download}>↓ PNG 다운로드</button></header>
    <main className="workspace">
      <aside className="side left"><div className="section-title"><span className="num">01</span><div><h2>시작하기</h2><p>스킨 텍스처 또는 참고 이미지</p></div></div>
        <div className="panel"><div className="panel-label">스킨 파일</div><p className="hint">64×64 PNG · 편집 가능한 실제 스킨</p><input ref={fileInput} type="file" accept="image/png" hidden onChange={e=>importSkin(e.target.files?.[0])}/><button className="wide-button" onClick={()=>fileInput.current?.click()}>↑ 기존 스킨 불러오기</button><div className="split"><button onClick={()=>{commit(blankSkin());setStatus('빈 스킨을 만들었습니다.');}}>빈 스킨</button><button onClick={()=>{commit(sampleSkin(model));setStatus('편집용 예시 스킨을 불러왔습니다. AI 생성 결과가 아닙니다.');}}>예시 스킨</button></div></div>
        <div className="panel"><div className="panel-label">원본 참고 <span className="badge">수동 비교</span></div><input ref={refInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>importReference(e.target.files?.[0])}/>{reference?<div className="reference"><img src={reference} alt="업로드한 참고 이미지"/><button onClick={()=>setReference(null)}>참고 이미지 제거</button></div>:<button className="reference-empty" onClick={()=>refInput.current?.click()}>+ 사진 · 일러스트 추가</button>}<p className="hint">이미지를 편집 참고로 표시합니다. 자동 변환 기능은 개발 중입니다.</p></div>
        <div className="panel info"><div className="panel-label">현재 작업</div><div className="info-row"><span>텍스처</span><strong>64 × 64 · RGBA</strong></div><div className="info-row"><span>팔 모델</span><strong>{model==='slim'?'Alex · 3px':'Steve · 4px'}</strong></div><div className="info-row"><span>저장</span><strong>이 브라우저에 자동 저장</strong></div><p className="hint">자동 저장은 현재 브라우저에만 남습니다. 보관하려면 PNG를 다운로드하세요.</p></div>
      </aside>
      <section className="center"><div className="viewer-head"><div><span className="eyebrow">LIVE PREVIEW / 실제 텍스처</span><h1>3D 스킨 미리보기</h1></div><span className="live"><i/> LIVE</span></div><div className="viewer" aria-label="스킨 3D 미리보기"><canvas ref={viewerCanvas}/><div className="viewer-note">드래그하여 회전 · 스크롤 또는 핀치로 확대</div></div>
        <div className="view-controls"><div className="view-row"><span>시점</span>{[['정면',0],['후면',Math.PI],['왼쪽',-Math.PI/2],['오른쪽',Math.PI/2],['상단','top']].map(([name,angle])=><button key={name} onClick={()=>{const v=viewer.current;if(!v){softwareControls.current?.set(angle==='top'?0:angle as number,angle==='top'?1.2:.12,softwareView.current.zoom);return;}if(angle==='top'){v.controls.reset();v.camera.position.set(0,75,1);v.controls.update();}else{v.controls.reset();v.playerObject.rotation.y=angle as number;}}}>{name}</button>)}</div><div className="view-row"><span>동작</span>{([['stop','정지'],['idle','대기'],['walk','걷기'],['run','달리기']] as const).map(([id,label])=><button key={id} className={animation===id?'active':''} onClick={()=>setAnimation(id)}>{label}</button>)}</div></div>
      </section>
      <aside className="side right"><div className="section-title"><span className="num">02</span><div><h2>픽셀 편집기</h2><p>실제 UV 도면을 직접 수정합니다</p></div></div>
        <div className="editor-settings"><div className="setting"><label>팔 모델</label><div className="segmented"><button className={model==='default'?'active':''} onClick={()=>setModel('default')}>Steve · 4px</button><button className={model==='slim'?'active':''} onClick={()=>setModel('slim')}>Alex · 3px</button></div></div><div className="setting"><label htmlFor="part">편집 부위</label><select id="part" value={part} onChange={e=>setPart(e.target.value as Part)}>{parts.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></div><div className="setting"><label>텍스처 레이어</label><div className="segmented"><button className={layer==='base'?'active':''} onClick={()=>setLayer('base')}>기본</button><button className={layer==='overlay'?'active':''} onClick={()=>setLayer('overlay')}>오버레이</button></div></div></div>
        <div className="uv-header"><div><strong>64 × 64 UV MAP</strong><span>{selected}</span></div><button className="plain" onClick={()=>setGrid(!grid)}>{grid?'▦ 그리드 켜짐':'□ 그리드 꺼짐'}</button></div>
        <div className="uv-viewport"><canvas ref={uvCanvas} width={512} height={512} style={{width:64*zoom,height:64*zoom}} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);drawing.current=true;apply(e,true);}} onPointerMove={e=>{const {x,y}=uvPoint(e);setHover(findRegion(model,x,y,layer)||null);if(drawing.current&&e.buttons)apply(e,false);}} onPointerUp={()=>{drawing.current=false}} onPointerCancel={()=>{drawing.current=false}}/></div>
        <div className="zoom-row"><span>확대 {zoom}×</span><input type="range" min="5" max="16" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/><button className="plain" onClick={()=>setOuter(!outer)}>{outer?'겉옷 표시':'겉옷 숨김'}</button></div>
        <div className="tool-row">{([['pen','✎','펜'],['eraser','◇','지우개'],['picker','♢','스포이트'],['fill','▨','채우기']] as const).map(([id,icon,label])=><button title={label} aria-label={label} key={id} className={tool===id?'active':''} onClick={()=>setTool(id)}><b>{icon}</b><small>{label}</small></button>)}</div>
        <div className="color-row"><label>현재 색상</label><input type="color" value={color} onChange={e=>setColor(e.target.value)}/><code>{color.toUpperCase()}</code><div className="swatches">{palette.map(p=><button key={p} title={p} aria-label={`${p} 색상`} style={{background:p}} onClick={()=>setColor(p)}/>)}</div></div>
        <div className="action-row"><button disabled={!undoCount} onClick={undo}>↶ 되돌리기</button><button disabled={!redoCount} onClick={redo}>↷ 다시 실행</button><button onClick={()=>{commit(clearRegion(data,part,layer,model));setStatus(`${parts.find(p=>p.id===part)?.label} ${layer==='base'?'기본':'오버레이'} 영역을 초기화했습니다.`);}}>영역 초기화</button></div>
        <button className="primary full-download" onClick={download}>↓ 실제 64×64 PNG 다운로드</button><div className="status" role="status">{status}</div>
      </aside>
    </main><footer>이 미리보기는 다운로드 PNG의 픽셀 데이터를 사용합니다. 팔 모델은 PNG 내부에 저장되지 않으므로 게임에 적용할 때 같은 모델을 선택하세요. <span>작업 {revision}회 반영</span></footer>
  </div>;
}
