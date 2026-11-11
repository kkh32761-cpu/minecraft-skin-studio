import type {Region} from './skin';

// A hand-authored 64×64 character: warm face, layered dark hair, coral scarf,
// navy field jacket and worn boots. Every symbol maps to one exact RGBA pixel.
const palette:Record<string,string>={
  H:'#392d3b',h:'#593d50',j:'#806176',K:'#24232e',
  s:'#dba98b',l:'#efc6a5',d:'#b98172',p:'#c98485',m:'#87535b',
  E:'#243c50',e:'#64a6af',W:'#f8eee1',
  N:'#344c66',n:'#4d7088',B:'#26394f',b:'#6e90a0',
  C:'#ded1b3',c:'#afa38b',R:'#c56e50',r:'#ee9c69',q:'#954e43',
  T:'#76534b',t:'#a37a5b',G:'#d9b36c',
  P:'#35445d',v:'#596b81',Q:'#29374f',
  O:'#3a3438',o:'#80604e',X:'#252b33'
};
const rgba=Object.fromEntries(Object.entries(palette).map(([symbol,hex])=>[symbol,[...hex.match(/\w\w/g)!.map(n=>parseInt(n,16)),255]])) as Record<string,number[]>;
type FaceMap=Partial<Record<Region['face'],string[]>>;
const head:FaceMap={
  front:[
    'HHHhhHHH','HjHHhHHH','HHHllHHH','HssssssH',
    'HseEsEeH','HspsspsH','HsssmssH','dssssssd'
  ],
  back:[
    'HHHHHHHH','HHjHhHHH','HhHHHHhH','HHHHjHHH',
    'HhHHHHhH','HHHHhHHH','HhHHHHhH','KKHHHHKK'
  ],
  left:[
    'HHHHHHHH','HjHhHHHH','HHHHHHHH','HHHsssss',
    'HHHsdsss','HHHsssss','HHHHdsss','KKHHdddd'
  ],
  right:[
    'HHHHHHHH','HHHhHjHH','HHHHHHHH','sssssHHH',
    'sssd sHHH'.replace(' ',''),'sssssHHH','sssdHHHH','ddddHHKK'
  ],
  top:[
    'KKHHHHKK','KHHhHHHK','HHHjHHHH','HHHHHHhH',
    'HhHHHHHH','HHHHjHHH','KHHHHHhK','KKHHHHKK'
  ],
  bottom:['dddddddd','dssssssd','dssssssd','dssssssd','dssssssd','dssssssd','dssssssd','dddddddd']
};
const headOuter:FaceMap={
  front:[
    'KHHHHHHK','HjHHhHhH','HH..HHHH','H......H',
    '........','........','........','........'
  ],
  back:[
    'HHHHHHHH','HH..h.HH','H......H','H......H',
    'H......H','H......H','HH....HH','KKHHHHKK'
  ],
  left:[
    'HHHHHHHH','H......H','H......H','H......H',
    'H......H','H......H','HH....HH','KKHHHHKK'
  ],
  right:[
    'HHHHHHHH','H......H','H......H','H......H',
    'H......H','H......H','HH....HH','KKHHHHKK'
  ],
  top:[
    'KKHHHHKK','K......K','H......H','H......H',
    'H......H','H......H','K......K','KKHHHHKK'
  ]
};
const body:FaceMap={
  front:[
    'NNRRRRNN','NnrRRrnN','NnqCCqnN','NncCCcnN',
    'NncCGcnN','NncCCcnN','NncCGcnN','NncCCcnN',
    'NNtTTtNN','NnTGG TnN'.replace(' ',''),'NNNTTNNN','BBNNNNBB'
  ],
  back:[
    'BBRRRRBB','BNrrrrNB','BNqqqqNB','BNNNNNNB',
    'BNNnnNNB','BNnBBnNB','BNnBBnNB','BNNNNNNB',
    'BNTTTTNB','BNNTTNNB','BNNNNNNB','BBBBBBBB'
  ],
  left:[
    'NNNN','nNNB','nNNB','nNNB','nNNB','nNNB',
    'nNNB','nNNB','TTTB','tTNB','NNNB','BBBN'
  ],
  right:[
    'NNNN','BNNn','BNNn','BNNn','BNNn','BNNn',
    'BNNn','BNNn','BTTT','BNTt','BNNN','NBBB'
  ],
  top:['NNNNNNNN','NnnNNnnN','NNNNNNNN','NNNNNNNN'],
  bottom:['BBBBBBBB','BBBBBBBB','BBBBBBBB','BBBBBBBB']
};
const bodyOuter:FaceMap={
  front:[
    '.n....n.','nR....Rn','nR....Rn','n......n',
    'n......n','n......n','n......n','n......n',
    'n......n','n......n','........','........'
  ],
  back:[
    '.N....N.','Nn....nN','Nn....nN','N......N',
    'N......N','N......N','N......N','N......N',
    'N......N','N......N','........','........'
  ]
};
const legFront=['PPPP','vPPQ','vPPQ','vPPQ','vPPQ','vPPQ','vPPQ','vPPQ','OOOo','OooO','OooO','XXXX'];
const legBack=['QQQQ','QPPQ','QPPQ','QPPQ','QPPQ','QPPQ','QPPQ','QPPQ','OOOO','OOOO','OooO','XXXX'];
const legSide=['QQPQ','QPPQ','QPPQ','QPPQ','QPPQ','QPPQ','QPPQ','QPPQ','OOOO','OooO','OooO','XXXX'];
function armFace(width:number,front:boolean):string[]{
  const sleeve=width===3?(front?'nNB':'BNN'):(front?'nNNB':'BNNn');
  const cuff=width===3?'BBN':'BBNN';
  const hand=width===3?'dss':'dsss';
  return [sleeve,sleeve,sleeve,sleeve,sleeve,sleeve,sleeve,cuff,'TT'.padEnd(width,'T'),hand,hand,'d'.repeat(width)];
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
    else if(layer==='base'&&leg)pattern=face==='front'?legFront:face==='back'?legBack:face==='left'||face==='right'?legSide:solid(rect.w,rect.h,face==='top'?'v':'X');
    else if(layer==='base'&&arm)pattern=face==='front'||face==='back'?armFace(rect.w,face==='front'):solid(rect.w,rect.h,face==='top'?'n':face==='bottom'?'d':'N');
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
