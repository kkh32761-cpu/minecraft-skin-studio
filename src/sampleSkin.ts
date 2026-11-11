import type {Region} from './skin';

// Vibrant blue-haired showcase character, hand-painted on the actual 64×64 Minecraft UV atlas.
// The crisp white headband, hair wisps, jacket seams, cuffs and boots use the real outer UV layer.
const palette:Record<string,string>={
  // Clear sky-blue hair with saturated cobalt shadows and luminous icy highlights.
  H:'#45C7FA',h:'#168EDC',j:'#B7F0FF',K:'#176DB7',
  // Warm peach skin; soft, lively blush keeps the face from turning grey.
  a:'#F8D5C5',b:'#FFE9DC',d:'#D9A69B',p:'#FFA5B8',m:'#B5768D',
  // Deep sapphire eyes with bright cyan reflections.
  E:'#214477',e:'#2195DC',w:'#B8F4FF',W:'#FFFFFF',
  // Brilliant cool white cloth, lilac-blue shadows rather than grey.
  S:'#F9FCFF',s:'#D4DDFA',D:'#96A8DF',F:'#4F66A8',
  // Sparkling cyan piping, azure ribbon, blue-white highlight, vivid red brooch.
  L:'#69D9FF',l:'#D6FAFF',R:'#2489E3',r:'#94E8FF',T:'#78ABD9',G:'#FF3F60',
  // Indigo-lavender skirt pleats and white boots with saturated blue shadows.
  Q:'#7C86BD',q:'#4B5794',P:'#F5F9FF',O:'#9BB5EC',o:'#E4F1FF',X:'#596C9F'
};
const rgba=Object.fromEntries(Object.entries(palette).map(([symbol,hex])=>[symbol,[...hex.match(/\w\w/g)!.map(n=>parseInt(n,16)),255]])) as Record<string,number[]>;
type FaceMap=Partial<Record<Region['face'],string[]>>;
const head:FaceMap={
  front:[
    'HjHHHHjH','HjHHjHjH','HHHbbHHH','HbaaaabH',
    'HWEaaEWH','HweaaewH','HpbaabpH','HaabmaaH'
  ],
  back:[
    'HHHHHHHH','HjHHhHjH','HHHHHHHH','HhHHHHhH',
    'HHjHHjHH','HhHHHHhH','HHHHHHHH','KKHHHHKK'
  ],
  left:[
    'HHHHHHHH','HjHHHHhH','HHHHHHHH','HHHaaaaa',
    'HHHdaaaa','HHHaaaaa','HHHHdaaa','hHHHdddd'
  ],
  right:[
    'HHHHHHHH','HhHHHHjH','HHHHHHHH','aaaaaHHH',
    'aaaadHHH','aaaaaHHH','aaadHHHH','ddddHHHh'
  ],
  top:[
    'KKHHHHKK','KHHHHHHK','HHjHHjHH','HHHHHHHH',
    'HhHHHHhH','HHHHHHHH','KHHHHHHK','KKHHHHKK'
  ],
  bottom:['dddddddd','daaaaaad','daaaaaad','daaaaaad','daaaaaad','daaaaaad','daaaaaad','dddddddd']
};
const headOuter:FaceMap={
  front:[
    'sSSssSSs','SSSLlSSS','Hj....jH','H......H',
    'h......h','H......H','h......h','........'
  ],
  back:[
    'sSSSSSSs','SS....SS','H......H','H......H',
    'H......H','H......H','H......H','HH....HH'
  ],
  left:[
    'sSSSSSSs','SS....SS','S......S','H......H',
    'H......H','H......H','H......H','HH....HH'
  ],
  right:[
    'sSSSSSSs','SS....SS','S......S','H......H',
    'H......H','H......H','H......H','HH....HH'
  ],
  top:[
    'sSSSSSSs','SSllllSS','SL....LS','SL....LS',
    'S......S','S......S','S......S','sSSSSSSs'
  ]
};
const body:FaceMap={
  front:[
    'SSSSSSSS','SsSRRSsS','SsRrrRsS','SsSRRSsS',
    'SsSTTSsS','SsSGGSsS','SsSTTSsS','SsSTTSsS',
    'SsSDDSsS','QQQQQQQQ','QqQQQqQQ','qQQqqQQq'
  ],
  back:[
    'SSSSSSSS','SsSSSSsS','SsSssSsS','SsSSSSsS',
    'SsSSSSsS','SsSSSSsS','SsSSSSsS','SsSSSSsS',
    'SsSDDSsS','QQQQQQQQ','QqQQQqQQ','qQQqqQQq'
  ],
  left:['SSSS','SsSs','SsSs','SsSs','SsSs','SsSs','SsSs','SsSs','SDDS','QQQQ','QqQq','qQQq'],
  right:['SSSS','sSsS','sSsS','sSsS','sSsS','sSsS','sSsS','sSsS','SDDS','QQQQ','qQqQ','qQQq'],
  top:['SSSSSSSS','SSssssSS','SSSSSSSS','SSSSSSSS'],
  bottom:['qqqqqqqq','qqqqqqqq','qqqqqqqq','qqqqqqqq']
};
const bodyOuter:FaceMap={
  front:[
    'H......H','j......j','H......H','h......h',
    'S......S','s......s','S......S','s......s',
    'S......S','S......S','q......q','q......q'
  ],
  back:[
    'H......H','j......j','H......H','H......H',
    'H......H','s......s','S......S','s......s',
    'S......S','S......S','q......q','q......q'
  ],
  left:['H..H','H..H','H..H','H..H','s..s','s..s','S..S','S..S','S..S','Q..Q','q..q','q..q'],
  right:['H..H','H..H','H..H','H..H','s..s','s..s','S..S','S..S','S..S','Q..Q','q..q','q..q']
};
const legFront=['QQQQ','QqQQ','qQQq','baab','aaaa','aaaa','daaa','aaaa','PPPP','PssP','OooO','XXXX'];
const legBack=['QQQQ','QqQQ','qQQq','dddd','aaaa','aaaa','daaa','aaaa','PPPP','PssP','OOOO','XXXX'];
const legSide=['QQQQ','QqQQ','qQQq','daaa','aaaa','aaaa','daaa','aaaa','PPPP','PssP','OooO','XXXX'];
const legOuter=['Q..Q','Q..Q','q..q','....','....','....','....','....','O..O','O..O','o..o','XXXX'];
function armFace(width:number,front:boolean):string[]{
  const white=front?(width===3?'sSS':'sSSs'):(width===3?'SsS':'SssS');
  const band=width===3?'rSS':'rSSr';
  const cuff=width===3?'FDD':'FDDF';
  const hand=width===3?'daa':'daaa';
  return [white,band,white,white,white,white,white,white,cuff,cuff,hand,'d'.repeat(width)];
}
function armOuter(width:number):string[]{
  const edge=width===3?'S..':'S..S',cuff='D'.repeat(width);
  return ['.'.repeat(width),edge,edge,edge,edge,edge,edge,edge,cuff,cuff,'.'.repeat(width),'.'.repeat(width)];
}
function solid(width:number,height:number,symbol:string):string[]{return Array(height).fill(symbol.repeat(width));}
export function makeSampleSkin(atlas:Region[]):Uint8ClampedArray {
  const out=new Uint8ClampedArray(64*64*4);
  for(const region of atlas){
    const {part,layer,face,rect}=region;
    const arm=part==='rightArm'||part==='leftArm',leg=part==='rightLeg'||part==='leftLeg';
    let pattern:string[]|undefined;
    if(part==='head')pattern=(layer==='base'?head:headOuter)[face];
    else if(part==='body')pattern=(layer==='base'?body:bodyOuter)[face];
    else if(leg)pattern=layer==='overlay'?(face==='front'||face==='back'?legOuter:undefined):face==='front'?legFront:face==='back'?legBack:face==='left'||face==='right'?legSide:solid(rect.w,rect.h,face==='top'?'Q':'X');
    else if(arm)pattern=layer==='overlay'?(face==='front'||face==='back'?armOuter(rect.w):undefined):face==='front'||face==='back'?armFace(rect.w,face==='front'):solid(rect.w,rect.h,face==='top'?'S':face==='bottom'?'d':'s');
    if(!pattern)continue;
    if(pattern.length!==rect.h||pattern.some(row=>row.length!==rect.w))throw Error(`Sample art dimension mismatch: ${part}/${layer}/${face}`);
    pattern.forEach((row,dy)=>[...row].forEach((symbol,dx)=>{
      if(symbol==='.')return;
      const pixel=rgba[symbol];if(!pixel)throw Error(`Unknown sample palette symbol: ${symbol}`);
      out.set(pixel,((rect.y+dy)*64+rect.x+dx)*4);
    }));
  }
  return out;
}
