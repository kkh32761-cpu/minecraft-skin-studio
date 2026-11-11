import {useEffect,useRef,useState} from 'react';
import {SkinViewer,IdleAnimation,WalkingAnimation,RunningAnimation} from 'skinview3d';
import {drawSoftwareViewer,bindSoftwareControls} from './softwareViewer';
import ColorPicker from './ColorPicker';
import {assertSkinDimensions,blankSkin,canvasFromData,clearRegion,fill,findRegion,hexRgba,paint,parts,pixelIndex,regions,rgbaHex,sampleSkin,SIZE,type Face,type Layer,type Model,type Part,type Region} from './skin';
const CACHE='minecraft-skin-studio-v1';
const RECENT_COLORS='minecraft-skin-studio-recent-colors-v1';
const GEMINI_KEY='minecraft-skin-studio-gemini-key-v1'; // Legacy key removed on mount
const GUIDE=blankSkin();
type Tool='pen'|'eraser'|'picker'|'fill';
type Animation='stop'|'idle'|'walk'|'run';
function readRecentColors():string[]{try{const raw=JSON.parse(localStorage.getItem(RECENT_COLORS)||'[]');return Array.isArray(raw)?raw.filter((v:unknown)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)).slice(0,12):[]}catch{return []}}
function clearLegacyGeminiKey(){try{localStorage.removeItem(GEMINI_KEY)}catch{/* storage unavailable */}}
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
  const [face,setFace]=useState<Face>('front');
  const [tool,setTool]=useState<Tool>('pen');
  const [color,setColor]=useState('#5e3e58');
  const [colorAlpha,setColorAlpha]=useState(255);
  const [recentColors,setRecentColors]=useState<string[]>(readRecentColors);
  const [aiReady,setAIReady]=useState(false);
  const [aiAuthenticated,setAIAuthenticated]=useState(false);
  const [aiKey,setAIKey]=useState('');
  const [aiChecked,setAIChecked]=useState(false);
  const [aiBusy,setAIBusy]=useState(false);
  const [aiError,setAIError]=useState('');
  const [aiPhase,setAIPhase]=useState<'preparing'|'analyzing'|'retrying'|'assembling'>('preparing');
  const [aiAttempt,setAIAttempt]=useState(1);
  const [aiRetryReason,setAIRetryReason]=useState('');
  const [aiElapsed,setAIElapsed]=useState(0);
  const [aiDescription,setAIDescription]=useState('');
  const [grid,setGrid]=useState(true);
  const [outer,setOuter]=useState(true);
  const [zoom,setZoom]=useState(7);
  const [faceZoom,setFaceZoom]=useState(38);
  const [previewWidth,setPreviewWidth]=useState(()=>Math.max(360,Math.round((window.innerWidth-245)*.38)));
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
  const viewerCanvas=useRef<HTMLCanvasElement>(null),uvCanvas=useRef<HTMLCanvasElement>(null),faceCanvas=useRef<HTMLCanvasElement>(null),viewer=useRef<SkinViewer|null>(null);
  const workspaceRef=useRef<HTMLElement>(null);
  const fileInput=useRef<HTMLInputElement>(null),refInput=useRef<HTMLInputElement>(null);
  const current=useRef(data),history=useRef<Uint8ClampedArray[]>([]),future=useRef<Uint8ClampedArray[]>([]),drawing=useRef(false);
  const modelRef=useRef(model),partRef=useRef(part),layerRef=useRef(layer),toolRef=useRef(tool),colorRef=useRef(color),alphaRef=useRef(colorAlpha);
  current.current=data;modelRef.current=model;partRef.current=part;layerRef.current=layer;toolRef.current=tool;colorRef.current=color;alphaRef.current=colorAlpha;
  useEffect(()=>{clearLegacyGeminiKey();fetch('/api/ai/status').then(r=>r.ok?r.json():null).then(v=>{setAIReady(Boolean(v?.ready&&v?.authenticated));setAIAuthenticated(Boolean(v?.authenticated));}).catch(()=>{setAIReady(false);setAIAuthenticated(false)}).finally(()=>setAIChecked(true));},[]);
  function commit(next:Uint8ClampedArray,saveHistory=true){
    if(next===current.current)return;
    if(saveHistory){history.current.push(new Uint8ClampedArray(current.current));if(history.current.length>40)history.current.shift();future.current=[];}
    current.current=next;setData(next);setRevision(n=>n+1);setUndoCount(history.current.length);setRedoCount(future.current.length);
  }
  function undo(){if(!history.current.length)return;future.current.push(new Uint8ClampedArray(current.current));const v=history.current.pop()!;current.current=v;setData(v);setRevision(n=>n+1);setUndoCount(history.current.length);setRedoCount(future.current.length);}
  function redo(){if(!future.current.length)return;history.current.push(new Uint8ClampedArray(current.current));const v=future.current.pop()!;current.current=v;setData(v);setRevision(n=>n+1);setUndoCount(history.current.length);setRedoCount(future.current.length);}
  function changeModel(next:Model){if(next===model)return;const example=sampleSkin(model);if(data.every((value,index)=>value===example[index]))commit(sampleSkin(next));setModel(next);}
  useEffect(()=>{const saved=readSaved();if(saved){
    current.current=saved.data;setData(saved.data);setModel(saved.model);setStatus('브라우저에 저장된 이전 작업을 복원했습니다.');
  }},[]);
  useEffect(()=>{const id=window.setTimeout(()=>{try{localStorage.setItem(CACHE,JSON.stringify({rgba:btoa(String.fromCharCode(...data)),model}));}catch{setStatus('브라우저 저장 공간이 부족합니다. PNG를 다운로드해 보관하세요.');}},500);return()=>clearTimeout(id)},[data,model]);
  useEffect(()=>{try{localStorage.setItem(RECENT_COLORS,JSON.stringify(recentColors))}catch{/* Browser storage is optional. */}},[recentColors]);
  // API keys are kept in React memory only and disappear on a page reload.
  useEffect(()=>{if(!aiBusy)return;const id=window.setInterval(()=>setAIElapsed(n=>n+1),1000);return()=>clearInterval(id)},[aiBusy]);
  useEffect(()=>{const el=viewerCanvas.current;if(!el)return;try{
    const rect=el.parentElement!.getBoundingClientRect();const v=new SkinViewer({canvas:el,width:Math.max(280,Math.floor(rect.width)),height:Math.max(340,Math.floor(rect.height)),skin:canvasFromData(current.current),model:modelRef.current,zoom:0.72,background:0x151d28});
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
  const activeFace=regions(model).find(r=>r.part===part&&r.layer===layer&&r.face===face)!;
  useEffect(()=>{const canvas=faceCanvas.current;if(!canvas)return;
    const r=activeFace.rect,scale=faceZoom;canvas.width=r.w*scale;canvas.height=r.h*scale;
    const ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#233240';ctx.fillRect(0,0,canvas.width,canvas.height);
    const base=regions(model).find(v=>v.part===part&&v.layer==='base'&&v.face===face)!;
    const atlas=canvasFromData(data);
    if(layer==='overlay'){
      ctx.globalAlpha=.42;ctx.drawImage(atlas,base.rect.x,base.rect.y,base.rect.w,base.rect.h,0,0,canvas.width,canvas.height);ctx.globalAlpha=1;
    }
    ctx.drawImage(atlas,r.x,r.y,r.w,r.h,0,0,canvas.width,canvas.height);
    if(grid){ctx.beginPath();for(let x=0;x<=r.w;x++){ctx.moveTo(x*scale+.5,0);ctx.lineTo(x*scale+.5,canvas.height)}for(let y=0;y<=r.h;y++){ctx.moveTo(0,y*scale+.5);ctx.lineTo(canvas.width,y*scale+.5)}ctx.strokeStyle='rgba(255,255,255,.26)';ctx.lineWidth=1;ctx.stroke()}
  },[data,model,part,layer,face,faceZoom,grid]);
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo();}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);});
  function uvPoint(e:React.PointerEvent<HTMLCanvasElement>){const r=e.currentTarget.getBoundingClientRect();return{x:Math.floor((e.clientX-r.left)/r.width*SIZE),y:Math.floor((e.clientY-r.top)/r.height*SIZE)};}
  function facePoint(e:React.PointerEvent<HTMLCanvasElement>){const b=e.currentTarget.getBoundingClientRect(),r=activeFace.rect;
    return {x:r.x+Math.floor((e.clientX-b.left)/b.width*r.w),y:r.y+Math.floor((e.clientY-b.top)/b.height*r.h)};
  }
  function applyAt(x:number,y:number,first:boolean){
    if(x<0||x>=64||y<0||y>=64)return;
    const region=findRegion(modelRef.current,x,y,layerRef.current);setHover(region||null);
    if(!region||region.part!==partRef.current)return;
    const t=toolRef.current;
    if(t==='picker'){setColor(rgbaHex(current.current,x,y));setColorAlpha(current.current[pixelIndex(x,y)+3]);setStatus(`${x}, ${y} 색상을 선택했습니다.`);return;}
    const rgba=t==='eraser'?layerRef.current==='overlay'?[0,0,0,0]:[0,0,0,255]:hexRgba(colorRef.current,layerRef.current==='base'?255:alphaRef.current);
    if(t==='fill'&&!first)return;
    const next=t==='fill'?fill(current.current,x,y,rgba,region.rect):paint(current.current,x,y,rgba);
    if(first){history.current.push(new Uint8ClampedArray(current.current));if(history.current.length>40)history.current.shift();future.current=[];setUndoCount(history.current.length);setRedoCount(0);}
    if(first&&t!=='eraser')setRecentColors(prev=>[colorRef.current,...prev.filter(c=>c!==colorRef.current)].slice(0,12));
    commit(next,false);
  }
  function apply(e:React.PointerEvent<HTMLCanvasElement>,first:boolean){const {x,y}=uvPoint(e);if(first){const r=findRegion(modelRef.current,x,y);if(r){partRef.current=r.part;layerRef.current=r.layer;setPart(r.part);setLayer(r.layer);setFace(r.face)}}applyAt(x,y,first)}
  function setPresetView(angle:number,pitch=0){
    const v=viewer.current;
    if(!v){softwareControls.current?.set(-angle,pitch,.87);return;}
    // OrbitControls.reset() restores its constructor position (0,0,0) in skinview3d,
    // which puts the camera inside the model. Set a known safe camera radius instead.
    v.playerObject.rotation.y=0;
    v.zoom=.72;
    const distance=v.camera.position.length();
    v.camera.position.set(Math.sin(angle)*Math.cos(pitch)*distance,Math.sin(pitch)*distance,Math.cos(angle)*Math.cos(pitch)*distance);
    v.controls.target.set(0,0,0);v.controls.update();
  }
  function resizePreview(clientX:number){const root=workspaceRef.current;if(!root)return;
    const bounds=root.getBoundingClientRect(),available=bounds.width-245-10;
    const next=Math.max(300,Math.min(available-390,Math.round(clientX-bounds.left-245)));
    setPreviewWidth(next);
  }
  function movePreview(delta:number){const root=workspaceRef.current;if(!root)return;const max=root.clientWidth-245-10-390;setPreviewWidth(w=>Math.max(300,Math.min(max,w+delta)));}
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
      const c=document.createElement('canvas');const scale=Math.min(1,800/Math.max(bitmap.width,bitmap.height));c.width=Math.round(bitmap.width*scale);c.height=Math.round(bitmap.height*scale);c.getContext('2d')!.drawImage(bitmap,0,0,c.width,c.height);bitmap.close();setReference(c.toDataURL('image/jpeg',.86));setStatus('참고 이미지를 표시했습니다. AI 연결 상태를 확인해 생성할 수 있습니다.');
    }catch(e){setStatus(e instanceof Error?e.message:'이미지를 읽지 못했습니다.');}
    if(refInput.current)refInput.current.value='';
  }
  async function generateAI(){
    if(!reference||!(aiReady||aiKey)||!aiAuthenticated||aiBusy)return;
    setAIBusy(true);setAIError('');setAIElapsed(0);setAIPhase('preparing');setAIAttempt(1);setAIRetryReason('');
    setStatus('원본 이미지를 유지하면서 Gemini 분석을 시작합니다.');
    try{
      const [metadata,base64]=reference.split(',');
      if(!base64||base64.length>2.8*1024*1024)throw Error('참고 이미지가 너무 큽니다. 더 작은 이미지를 사용하세요.');
      const response=await fetch('/api/ai/generate',{
        method:'POST',headers:{'Content-Type':'application/json','Accept':'application/x-ndjson'},
        body:JSON.stringify({mime:metadata.match(/^data:(.*?);/)?.[1],base64,model,...(aiReady?{}:{apiKey:aiKey.trim()})})
      });
      type GenerationResult={pixels:number[];spec:{visible:{hair:string;eyes:string;clothes:string};inferred:{back:string}}};
      let result:GenerationResult|undefined;
      if(response.headers.get('content-type')?.includes('application/x-ndjson')){
        if(!response.body)throw Error('AI 서버의 진행 응답을 읽을 수 없습니다.');
        const reader=response.body.getReader(),decoder=new TextDecoder();
        let buffer='',complete=false;
        function consume(line:string){
          if(!line.trim())return;
          let event:Record<string,unknown>;
          try{event=JSON.parse(line) as Record<string,unknown>;}catch{throw Error('AI 서버 진행 응답 형식이 올바르지 않습니다.');}
          if(event.type==='progress'){
            const stage=event.stage;
            if(stage==='preparing'||stage==='analyzing'||stage==='retrying'||stage==='assembling')setAIPhase(stage);
            if(typeof event.attempt==='number')setAIAttempt(event.attempt);
            if(stage==='retrying'){
              const reason=event.reason;
              setAIRetryReason(reason==='timeout'?'응답 시간 초과':reason==='network'?'일시적인 네트워크 오류':reason==='compatibility'?'요청 형식 호환 조정':'Gemini 서버 혼잡');
            }
          }else if(event.type==='error')throw Error(typeof event.error==='string'?event.error:'AI 생성에 실패했습니다.');
          else if(event.type==='complete'){
            result=event as unknown as GenerationResult;complete=true;
          }
        }
        try{
          while(true){
            const {value,done}=await reader.read();if(done)break;
            buffer+=decoder.decode(value,{stream:true});
            let nl;
            while((nl=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,nl);buffer=buffer.slice(nl+1);consume(line);}
          }
          buffer+=decoder.decode();if(buffer.trim())consume(buffer);
        }finally{reader.releaseLock();}
        if(!complete)throw Error('AI 서버 연결이 완료 전에 종료되었습니다. 원본 이미지는 유지됩니다.');
      }else{
        // Gracefully support a deployment still running the older JSON Worker.
        const payload=await response.json();
        if(!response.ok)throw Error(payload.error||`AI 오류 (${response.status})`);
        result=payload as GenerationResult;
      }
      if(!result||!Array.isArray(result.pixels)||result.pixels.length!==64*64*4||
         result.pixels.some(v=>!Number.isInteger(v)||v<0||v>255))throw Error('생성된 스킨 픽셀 데이터가 올바르지 않습니다.');
      commit(new Uint8ClampedArray(result.pixels));
      setAIDescription(`확인된 특징: ${result.spec.visible.hair} · ${result.spec.visible.eyes} · ${result.spec.visible.clothes}\n추론한 부분: ${result.spec.inferred.back}`);
      setStatus('AI 분석 결과를 64×64 스킨에 반영했습니다. 원본 유사도를 확인하고 필요하면 수정하세요.');
    }catch(e){
      const message=e instanceof Error?e.message:'AI 생성에 실패했습니다.';
      setAIError(message);setStatus(message);
    }finally{setAIBusy(false);}
  }
  function download(){const c=canvasFromData(data);c.toBlob(blob=>{if(!blob){setStatus('PNG 생성에 실패했습니다.');return;}const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download=`minecraft-skin-${model==='slim'?'alex':'steve'}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus('64×64 PNG를 다운로드했습니다. 게임 업로드 시 같은 팔 모델을 선택하세요.');},'image/png');}
  const selected=hover?`${parts.find(p=>p.id===hover.part)?.label} · ${labels[hover.face]} · ${hover.rect.x},${hover.rect.y}`:'도면에서 원하는 면을 클릭하면 자동으로 선택됩니다';
  // A nonempty key enables the action; the Worker reports malformed or rejected keys.
  // Do not silently disable the button when Google changes its key format.
  const aiConfigured=aiReady||Boolean(aiKey.trim());
  const isGuide=data.every((v,i)=>v===GUIDE[i]);
  return <div className="app">
    <header className="topbar"><div className="brand"><div className="brand-mark">▦</div><div><strong>SKIN STUDIO</strong><small>MINECRAFT · 64×64</small></div></div><span className="version">ENGINE v0.2 · 편집 가능 / {aiChecked?(aiReady?'Gemini 무료 AI 연결됨':aiConfigured?'무료 키 입력됨 · 생성 시 검증':'무료 AI 연결 대기'):'AI 확인 중'}</span><button className="primary download-top" onClick={download}>↓ PNG 다운로드</button></header>
    <main ref={workspaceRef} className="workspace" style={{'--preview-width':`${previewWidth}px`} as React.CSSProperties}>
      <aside className="side left"><div className="section-title"><span className="num">01</span><div><h2>시작하기</h2><p>스킨 텍스처 또는 참고 이미지</p></div></div>
        <div className="panel"><div className="panel-label">스킨 파일</div><p className="hint">처음에는 기본형 가이드 스킨으로 시작합니다.</p><input ref={fileInput} type="file" accept="image/png" hidden onChange={e=>importSkin(e.target.files?.[0])}/><button className="wide-button" onClick={()=>fileInput.current?.click()}>↑ 기존 스킨 불러오기</button><div className="split"><button onClick={()=>{commit(blankSkin());setStatus('기본형 가이드 스킨을 불러왔습니다.');}}>기본형</button><button onClick={()=>{setModel('slim');commit(sampleSkin('slim'));setStatus('Alex용 편집 예시 스킨을 불러왔습니다. AI 생성 결과가 아닙니다.');}}>예시 스킨</button></div></div>
        <div className="panel"><div className="panel-label">원본 이미지 <span className="badge">AI / 수동 비교</span></div><input ref={refInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>importReference(e.target.files?.[0])}/>{reference?<div className="reference"><img src={reference} alt="업로드한 참고 이미지"/><button onClick={()=>refInput.current?.click()}>이미지 교체</button><button onClick={()=>{setReference(null);setAIDescription('')}}>제거</button></div>:<button className="reference-empty" onClick={()=>refInput.current?.click()}>+ 사진 · 일러스트 추가</button>}
          {!aiReady&&aiChecked&&<div className="ai-key-setup"><label htmlFor="gemini-key">내 Gemini 무료 API 키</label><input id="gemini-key" type="password" value={aiKey} onChange={e=>setAIKey(e.target.value)} autoComplete="off" spellCheck={false} placeholder="Google AI Studio에서 만든 키 붙여넣기"/><div className="ai-key-actions"><a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer">Google AI Studio에서 무료 키 만들기 ↗</a><button type="button" onClick={()=>{setAIKey('');clearLegacyGeminiKey();setStatus('현재 입력한 Gemini 키를 지웠습니다.')}} disabled={!aiKey}>입력한 키 지우기</button></div><p className="hint">키는 브라우저에 저장되지 않으며 새로고침하면 사라집니다. 생성할 때만 로그인된 AI 서버로 전송합니다.</p></div>}
          <button className="wide-button ai-generate" disabled={!reference||!aiConfigured||!aiAuthenticated||aiBusy} onClick={generateAI}>{aiBusy?'분석 · UV 제작 중…':'✦ 이미지로 AI 스킨 생성'}</button>
          {aiBusy&&<div className="ai-progress" role="status" aria-live="polite"><strong>{aiPhase==='preparing'?'업로드 이미지 검사 중':aiPhase==='analyzing'?'Gemini 이미지 특징 분석 중':aiPhase==='retrying'?`${aiRetryReason} · ${aiAttempt}번째 시도 중`:'분석 결과를 64×64 스킨으로 조립 중'}</strong><span>{aiElapsed}초 경과</span><div className="ai-progress-track"><div className={(aiPhase==='analyzing'||aiPhase==='retrying')?'waiting':''}/></div><small>{aiPhase==='retrying'?'요청을 재전송하고 있습니다. 원본 이미지와 기존 스킨은 그대로 유지됩니다.':aiPhase==='analyzing'?'서버의 실제 진행 이벤트를 표시합니다. 완료율은 제공되지 않습니다.':'서버에서 수신한 단계만 표시합니다.'}</small></div>}
          {aiError&&<p className="ai-error" role="alert">생성 실패: {aiError}</p>}
          <p className="hint">{!aiChecked?'무료 AI 서버 연결을 확인 중입니다…':!aiAuthenticated?'사이트 로그인이 필요합니다.':aiConfigured?(reference?'사진을 Gemini 무료 API로 전송해 분석합니다. 무료 제공량 제한이 있으며 Google 제품 개선에 사용될 수 있습니다.':'먼저 참고 이미지를 추가하세요.'):'무료 키를 입력하면 실제 이미지 분석을 시작할 수 있습니다. 직접 편집은 계속 이용할 수 있습니다.'}</p>{aiDescription&&<p className="ai-description">{aiDescription}</p>}
        </div>
        <div className="panel info"><div className="panel-label">현재 작업</div><div className="info-row"><span>텍스처</span><strong>64 × 64 · RGBA</strong></div><div className="info-row"><span>팔 모델</span><strong>{model==='slim'?'Alex · 3px':'Steve · 4px'}</strong></div><div className="info-row"><span>저장</span><strong>이 브라우저에 자동 저장</strong></div><p className="hint">자동 저장은 현재 브라우저에만 남습니다. 보관하려면 PNG를 다운로드하세요.</p></div>
      </aside>
      <section className="center"><div className="viewer-head"><div><span className="eyebrow">LIVE PREVIEW / 실제 텍스처</span><h1>3D 스킨 미리보기</h1></div><span className="live"><i/> {isGuide?'GUIDE':'LIVE'}</span></div><div className="viewer" aria-label="스킨 3D 미리보기"><canvas ref={viewerCanvas}/><div className="viewer-note">{isGuide?'기본형 가이드 · 스킨을 불러오거나 직접 칠해보세요':'드래그하여 회전 · 스크롤 또는 핀치로 확대'}</div></div>
        <div className="view-controls"><div className="view-row"><span>시점</span>{([['정면',0,0],['후면',Math.PI,0],['왼쪽',-Math.PI/2,0],['오른쪽',Math.PI/2,0],['상단',0,1.08]] as const).map(([name,angle,pitch])=><button key={name} onClick={()=>setPresetView(angle,pitch)}>{name}</button>)}</div><div className="view-row"><span>동작</span>{([['stop','정지'],['idle','대기'],['walk','걷기'],['run','달리기']] as const).map(([id,label])=><button key={id} className={animation===id?'active':''} onClick={()=>setAnimation(id)}>{label}</button>)}</div></div>
      </section>
      <div className="split-handle" role="separator" aria-label="3D 미리보기와 편집기 너비 조절" aria-orientation="vertical" tabIndex={0}
        onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);resizePreview(e.clientX)}}
        onPointerMove={e=>{if(e.buttons)resizePreview(e.clientX)}}
        onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();movePreview(e.key==='ArrowRight'?30:-30)}}}
        title="좌우로 드래그해 작업 영역 너비를 조절하세요"><span/></div>
      <aside className="side right"><div className="section-title"><span className="num">02</span><div><h2>픽셀 편집기</h2><p>실제 UV 도면을 직접 수정합니다</p></div></div>
        <div className="editor-settings"><div className="setting"><label>팔 모델</label><div className="segmented"><button className={model==='default'?'active':''} onClick={()=>changeModel('default')}>Steve · 4px</button><button className={model==='slim'?'active':''} onClick={()=>changeModel('slim')}>Alex · 3px</button></div></div><div className="setting"><label htmlFor="part">편집 부위</label><select id="part" value={part} onChange={e=>setPart(e.target.value as Part)}>{parts.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></div><div className="setting"><label>텍스처 레이어</label><div className="segmented"><button className={layer==='base'?'active':''} onClick={()=>setLayer('base')}>기본</button><button className={layer==='overlay'?'active':''} onClick={()=>setLayer('overlay')}>오버레이</button></div></div></div>
        <div className="uv-header"><div><strong>전체 64×64 UV 도면</strong><span>{selected}</span></div><button className="plain" onClick={()=>setGrid(!grid)}>{grid?'▦ 그리드':'□ 그리드'}</button></div>
        <div className="uv-viewport atlas-primary"><canvas ref={uvCanvas} width={512} height={512} style={{width:64*zoom,height:64*zoom}} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);drawing.current=true;apply(e,true);}} onPointerMove={e=>{const {x,y}=uvPoint(e);setHover(findRegion(model,x,y)||null);if(drawing.current&&e.buttons)apply(e,false);}} onPointerUp={()=>{drawing.current=false}} onPointerCancel={()=>{drawing.current=false}}/></div>
        <div className="zoom-row"><span>도면 {zoom}×</span><input aria-label="UV 도면 확대" type="range" min="5" max="32" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></div>
        <details className="atlas-details face-details"><summary>선택한 면 크게 편집 <span>{parts.find(p=>p.id===part)?.label} · {labels[face]}</span></summary>
          <div className="face-tabs" aria-label="편집할 면">{(['front','back','left','right','top','bottom'] as Face[]).map(id=><button key={id} className={face===id?'active':''} onClick={()=>setFace(id)}>{labels[id]}</button>)}</div>
          <div className="face-viewport"><canvas ref={faceCanvas} aria-label={`${parts.find(p=>p.id===part)?.label} ${labels[face]} 픽셀 편집`}
            onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);drawing.current=true;const {x,y}=facePoint(e);applyAt(x,y,true)}}
            onPointerMove={e=>{if(drawing.current&&e.buttons){const {x,y}=facePoint(e);applyAt(x,y,false)}}}
            onPointerUp={()=>{drawing.current=false}} onPointerCancel={()=>{drawing.current=false}}/></div>
          <div className="zoom-row"><span>픽셀 크기 {faceZoom}px</span><input aria-label="면 확대" type="range" min="16" max="64" value={faceZoom} onChange={e=>setFaceZoom(Number(e.target.value))}/></div>
        </details>
        <div className="overlay-row"><button className="plain" onClick={()=>setOuter(!outer)}>{outer?'겉옷 레이어 표시 중':'겉옷 레이어 숨김'}</button></div>
        <div className="tool-row">{([['pen','✎','펜'],['eraser','◇','지우개'],['picker','♢','스포이트'],['fill','▨','채우기']] as const).map(([id,icon,label])=><button title={label} aria-label={label} key={id} className={tool===id?'active':''} onClick={()=>setTool(id)}><b>{icon}</b><small>{label}</small></button>)}</div>
        <div className="color-section"><div className="color-title">색상 선택 <span>{layer==='base'?'기본 레이어는 불투명':'오버레이는 투명도 적용'}</span></div><ColorPicker hex={color} alpha={layer==='base'?255:colorAlpha} allowAlpha={layer==='overlay'} onChange={(hex,alpha)=>{setColor(hex);setColorAlpha(alpha)}}/><div className="recent-title">최근 사용한 색 <span>칠할 때 자동 저장 · 최대 12개</span></div><div className="swatches recent-colors">{recentColors.length?recentColors.map(p=><button key={p} title={p} aria-label={`최근 사용 색 ${p}`} style={{background:p}} onClick={()=>setColor(p)}/>):<p>색을 칠하면 이곳에 기록됩니다.</p>}</div></div>
        <div className="action-row"><button disabled={!undoCount} onClick={undo}>↶ 되돌리기</button><button disabled={!redoCount} onClick={redo}>↷ 다시 실행</button><button onClick={()=>{commit(clearRegion(data,part,layer,model));setStatus(`${parts.find(p=>p.id===part)?.label} ${layer==='base'?'기본':'오버레이'} 영역을 초기화했습니다.`);}}>영역 초기화</button></div>
        <button className="primary full-download" onClick={download}>↓ 실제 64×64 PNG 다운로드</button><div className="status" role="status">{status}</div>
      </aside>
    </main><footer>이 미리보기는 다운로드 PNG의 픽셀 데이터를 사용합니다. 팔 모델은 PNG 내부에 저장되지 않으므로 게임에 적용할 때 같은 모델을 선택하세요. <span>작업 {revision}회 반영</span></footer>
  </div>;
}
