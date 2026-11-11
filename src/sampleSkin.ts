import type {Region} from './skin';

// Original hand-painted blue-haired explorer, inspired by the user's quality reference.
// The goggles, fringe, coat, cuffs and boots use Minecraft's real outer UV layer.
const palette:Record<string,string>={
  H:'#69b8dc',h:'#438db9',j:'#a5daf2',K:'#2b739e',
  a:'#eec9b6',b:'#ffe0c9',d:'#cda28f',p:'#e8a6a5',m:'#916b73',
  E:'#263f5b',e:'#388dc5',w:'#9fd8ed',W:'#f6f6f1',
  S:'#f0eef0',s:'#c6c3cc',D:'#8d8d9a',F:'#5b6073',
  L:'#87bddb',l:'#d0eef7',R:'#428fc1',r:'#8bcbe8',T:'#8fa5b6',G:'#d84b43',
  Q:'#888590',q:'#64616f',P:'#e1dce0',O:'#a7aab2',o:'#e8e9e8',X:'#535864'
};
const rgba=Object.fromEntries(Object.entries(palette).map(([symbol,hex])=>[symbol,[...hex.match(/\w\w/g)!.map(n=>parseInt(n,16)),255]])) as Record<string,number[]>;
type FaceMap=Partial<Record<Region['face'],string[]>>;
const head:FaceMap={
  front:[
    'HhHHHHhH','HjHHjHjH','HHHbbHHH','HbaaaabH',
    'HWEaaEWH','HweaaewH','HpbaabpH','HaaamaaH'
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
    'FLLFFLLF','HjHHjHjH','HH....HH','H......H',
    'h......h','H......H','h......h','........'
  ],
  back:[
    'FFFFFFFF','F......F','H......H','H......H',
    'H......H','H......H','H......H','HH....HH'
  ],
  left:[
    'FFFFFFFF','F......F','F......F','H......H',
    'H......H','H......H','H......H','HH....HH'
  ],
  right:[
    'FFFFFFFF','F......F','F......F','H......H',
    'H......H','H......H','H......H','HH....HH'
  ],
  top:[
    'FLLLLLLF','FllllllF','F......F','F......F',
    'F......F','F......F','F......F','FFFFFFFF'
  ]
};
const body:FaceMap={
  front:[
    'SSSssSSS','SsSRRSsS','SsRrrRsS','SsSRRSsS',
    'SsSTTSsS','SsSTGSsS','SsSTTSsS','SsSTTSsS',
    'SsSDDSsS','QQQQQQQQ','QqQqQqQq','qQQqQQQq'
  ],
  back:[
    'SSSssSSS','SsSSSSsS','SsSssSsS','SsSSSSsS',
    'SsSSSSsS','SsSSSSsS','SsSSSSsS','SsSSSSsS',
    'SsSDDSsS','QQQQQQQQ','QqQqQqQq','qQQqQQQq'
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
const legFront=['QQQQ','QqQq','qQQq','baab','aaaa','aaaa','daaa','aaaa','PPPP','PssP','OooO','XXXX'];
const legBack=['QQQQ','qQQq','qQQq','dddd','aaaa','aaaa','daaa','aaaa','PPPP','PssP','OOOO','XXXX'];
const legSide=['QQQQ','qQQq','qQQq','daaa','aaaa','aaaa','daaa','aaaa','PPPP','PssP','OooO','XXXX'];
const legOuter=['Q..Q','Q..Q','q..q','....','....','....','....','....','O..O','O..O','o..o','XXXX'];
function armFace(width:number,front:boolean):string[]{
  const white=front?(width===3?'sSS':'sSSs'):(width===3?'SsS':'SssS');
  const band=width===3?'DSS':'DSsD';
  const cuff=width===3?'FDD':'FDDF';
  const hand=width===3?'daa':'daaa';
  return [white,band,white,white,band,white,white,white,cuff,cuff,hand,'d'.repeat(width)];
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
