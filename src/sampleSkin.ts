import type {Region} from './skin';

// Classic casual showcase: an original, familiar Minecraft brown-hair/hoodie
// avatar, not a copied third-party skin. Pixel clusters are hand-authored for
// both front and back. All dimensions use Java Edition's real 64x64 UV regions.
export const samplePalette:Record<string,string>={
  // Chestnut hair: warm highlights, deliberate strand clusters, dark edges.
  A:'#302727',B:'#493631',C:'#684B3C',D:'#89644C',E:'#A78064',F:'#69493B',
  // Natural, uniform complexion. Face uses only forehead highlights, one subtle chin shadow and no cheek noise.
  s:'#F5D3BC',t:'#FCE0C9',u:'#DDAE99',v:'#C9957C',w:'#E7B9AB',x:'#C38D82',g:'#F3E6D8',
  // Familiar two-row eyes: softly outlined top pixel over warm brown iris.
  I:'#302B31',J:'#725044',K:'#AF8066',
  // Relaxed ivory hoodie: cool white core, purposeful folds and raised layers.
  H:'#F7F7F5',h:'#E8ECF0',i:'#D6DEE7',j:'#BBC6D3',k:'#9EABBE',l:'#FFFFFF',
  R:'#9FA9B6',M:'#C0CBD6',N:'#B3C1CF',
  // Dark slate-blue everyday trousers, coherent seams and hems.
  P:'#2B3546',Q:'#39465B',U:'#53617B',V:'#202A3A',W:'#65738B',
  // Bright white trainers, neutral soles and small clean shadow bands.
  Z:'#FAFCFF',z:'#DFE6EE',n:'#B6C3D0',o:'#68778B'
};
const rgba=Object.fromEntries(Object.entries(samplePalette).map(([symbol,hex])=>[
  symbol,[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16),255]
])) as Record<string,number[]>;
type FaceMap=Partial<Record<Region['face'],string[]>>;

// Natural 8x8 face: balanced dark upper lash + brown iris on each side,
// uninterrupted peach skin, and a one-pixel neutral mouth.
// Clean, familiar 8x8 human face. Eye whites are cream rather than glaring
// white; 2-row iris pixels read as an eye, not vertical black bars.
// The mouth is a tiny muted pixel above the chin, not a big chin block.
const head:FaceMap={
  front:[
    'AABBBBAA','BCCDDCCB','BDttttDB','BsttttsB',
    'sgIssIgs','sgJssJgs','usssxssu','ussssssu'
  ],
  back:[
    'AABBBBAA','BCCCDCCB','BCCDDCCB','BCCDCCCB',
    'BCDDCCCB','BCDDDDCB','BCCDDCCB','ABBBBBBA'
  ],
  // left: back hair at the left edge, open warm skin around the tiny ear.
  left:[
    'AABBBBAA','BCCCDCCB','BCCDDCCB','BCssstts',
    'BCsuwsss','BCssusss','BCssssss','ABssssss'
  ],
  // right: mirrored hair and ear; keep the side face mostly skin-colored.
  right:[
    'AABBBBAA','BCCCDCCB','BCCDDCCB','sttsssCB',
    'ssswsuCB','sssussCB','ssssssCB','ssssssBA'
  ],
  // Broad contiguous highlight clusters; no checkerboard or random pixels.
  top:[
    'AABBBBAA','ABCCDCBA','BCCDDCCB','BCDDEDCB',
    'BCCDDDCB','ABCCDCBA','AABCCCBA','AAABBBBA'
  ],
  bottom:[
    'vvvvvvvv','vssssssv','vssssssv','vssssssv',
    'vssssssv','vssssssv','vssssssv','vvvvvvvv'
  ]
};
// Raised hair pixels are deliberate small connected clumps at the fringe,
// crown, temples and nape. The translucent gaps are the entire point;
// filling a side/head face with outer pixels creates the hated helmet look.
const headOuter:FaceMap={
  front:[
    '........','.BC..C..','.CD..DB.','C.......',
    '........','........','........','........'
  ],
  back:[
    '........','.BC...C.','.CD...C.','.C....B.',
    '..D...B.','..C...C.','.BC..C..','...CC...'
  ],
  left:[
    '........','..B.....','BC......','BC......',
    'B.......','B.......','..C.....','........'
  ],
  right:[
    '........','.....B..','......CB','......CB',
    '.......B','.......B','.....C..','........'
  ],
  top:[
    '........','..B.....','.CC..C..','..D.....',
    '...D.C..','..C.....','.....B..','........'
  ]
};

// Plain but tailored: clean ivory hoodie, two neat drawstrings, subtle
// kangaroo pocket, shoulder lighting, hem; rear hood matching sides.
const body:FaceMap={
  front:[
    'lHHHHHHl','HhHHHHhH','HHiHHiHH','HHiHHiHH',
    'HhHHHHhH','HhHHHHhH','HhHHHHhH','HhHHHHhH',
    'HhiHHihH','HhiMMihH','HhHHHHhH','iHhhhhHi'
  ],
  back:[
    'lHHHHHHl','HiHhhHiH','iHHHHHHi','iHHHHHHi',
    'HhHHHHhH','HhHHHHhH','HhHHHHhH','HhHHHHhH',
    'HhHHHHhH','HhHHHHhH','iHhhhhHi','jiiHHiij'
  ],
  left:[
    'lHHi','HHhi','hhHi','iHHi','HHHi','HhhH',
    'HHHi','HHHi','iHHi','HHhi','jiij','jjij'
  ],
  right:[
    'iHHl','iHHH','iHhh','iHHH','iHHH','HhhH',
    'iHHH','iHHH','iHHi','ihHH','jiij','jijj'
  ],
  top:['lHHHHHHl','HHHHHHHH','hHHHHHHh','iHHHHHHi'],
  bottom:['jiiHHiij','jiiHHiij','jiiHHiij','jjjjjjjj']
};
// Collar and hood only: avoid the previous giant raised square at the chest.
// The kangaroo pocket is shaded into the base with fine seams.
const bodyOuter:FaceMap={
  front:[
    '..h..h..','..i..i..','........','........',
    '........','........','........','........',
    '........','........','........','........'
  ],
  back:[
    '..hHHh..','.iHHHHi.','.jiHHij.','..jiij..',
    '........','........','........','........',
    '........','........','........','........'
  ],
  left:[
    '....','i...','....','....','....','....',
    '....','....','....','....','....','....'
  ],
  right:[
    '....','...i','....','....','....','....',
    '....','....','....','....','....','....'
  ]
};
// Dark tailored jeans with coherent edge shadows, not random square noise.
const legFront=[
  'QPPQ','QPPQ','QPPQ','QPPQ','QPPQ','QPPQ',
  'QPPQ','QPUQ','VPPV','ZzzZ','ZZZZ','noon'
];
const legBack=[
  'QPPQ','QPPQ','QPPQ','QPPQ','QPPQ','QPPQ',
  'QPPQ','QQPP','VPPV','ZzzZ','ZZZZ','noon'
];
const legLeft=[
  'QPPQ','QPPQ','QPPQ','QPPQ','QPPQ','QPPQ',
  'QPPQ','QPUQ','VPPV','ZzzZ','ZZZZ','noon'
];
const legRight=[
  'QPPQ','QPPQ','QPPQ','QPPQ','QPPQ','QPPQ',
  'QPPQ','QPUQ','VPPV','ZzzZ','ZZZZ','noon'
];
const legOuter=[
  'Q..Q','....','....','....','....','....',
  '....','....','....','Z..Z','z..z','oooo'
];

// Face-aware arm patterns: classic arms are 4px wide, slim front/back are 3px.
// The top and bottom surfaces are physical UV rectangles, not painted overlays.
function armPattern(width:number,face:Region['face'],outer:boolean):string[]{
  if(face==='top')return outer
    ?Array.from({length:4},()=>'.'.repeat(width))
    :['l'.repeat(width),'H'.repeat(width),'h'.repeat(width),'H'.repeat(width)];
  if(face==='bottom')return outer?Array.from({length:4},()=>'.'.repeat(width)):
    ['u'.repeat(width),'s'.repeat(width),'v'.repeat(width),'v'.repeat(width)];
  if(outer){
    const rows=face==='front'||face==='back'?[
      '....','....','i...','....','....','....',
      '....','....','....','j..j','....','....'
    ]:[
      '....','....','...i','....','....','....',
      '....','....','....','j..j','....','....'
    ];
    return rows.map(row=>width===3?row.slice(0,3):row);
  }
  const rows=face==='front'?[
    'lHHl','HhHH','HHHH','iHHH','HHHH','HhHH',
    'HHHH','iHHH','jHHj','jNNj','stts','ussu'
  ]:face==='back'?[
    'lHHl','HHhH','HHHH','HHHi','HHHH','HHhH',
    'HHHH','HHHi','jHHj','jNNj','stts','ussu'
  ]:face==='left'?[
    'lHHi','HHHi','HHHi','iHHi','HHHi','HhHH',
    'HHHi','iHHi','jHHj','jNNj','stts','ussu'
  ]:[
    'iHHl','iHHH','iHHH','iHHi','iHHH','HHhH',
    'iHHH','iHHi','jHHj','jNNj','stts','ussu'
  ];
  return rows.map(row=>width===3?row.slice(0,3):row);
}
function solid(width:number,height:number,symbol:string):string[]{
  return Array.from({length:height},()=>symbol.repeat(width));
}
export function makeSampleSkin(atlas:Region[]):Uint8ClampedArray{
  const out=new Uint8ClampedArray(64*64*4);
  for(const region of atlas){
    const {part,layer,face,rect}=region;
    const arm=part==='rightArm'||part==='leftArm';
    const leg=part==='rightLeg'||part==='leftLeg';
    let pattern:string[]|undefined;
    if(part==='head')pattern=(layer==='base'?head:headOuter)[face];
    else if(part==='body')pattern=(layer==='base'?body:bodyOuter)[face];
    else if(leg)pattern=layer==='overlay'
      ?(face==='front'||face==='back'?legOuter:undefined)
      :face==='front'?legFront:face==='back'?legBack:
        face==='left'?legLeft:face==='right'?legRight:
        solid(rect.w,rect.h,face==='top'?'P':'o');
    else if(arm)pattern=armPattern(rect.w,face,layer==='overlay');
    if(!pattern)continue;
    if(pattern.length!==rect.h||pattern.some(row=>row.length!==rect.w))
      throw Error('Sample UV art dimensions: '+part+'/'+layer+'/'+face+' expected '+rect.w+'x'+rect.h);
    pattern.forEach((row,y)=>[...row].forEach((symbol,x)=>{
      if(symbol==='.')return;
      const color=rgba[symbol];
      if(!color)throw Error('Sample palette is missing symbol '+symbol);
      out.set(color,((rect.y+y)*64+rect.x+x)*4);
    }));
  }
  return out;
}
