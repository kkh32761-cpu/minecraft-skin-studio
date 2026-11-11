import type {Region} from './skin';

// Classic casual showcase: an original, familiar Minecraft brown-hair/hoodie
// avatar, not a copied third-party skin. Pixel clusters are hand-authored for
// both front and back. All dimensions use Java Edition's real 64x64 UV regions.
export const samplePalette:Record<string,string>={
  // Chestnut hair: warm highlights, deliberate strand clusters, dark edges.
  A:'#29242A',B:'#40302F',C:'#634638',D:'#87624C',E:'#B38A6E',F:'#735342',
  // Natural, uniform complexion. Face uses only forehead highlights, one subtle chin shadow and no cheek noise.
  s:'#F5D1B5',t:'#FFE4CC',u:'#E8BDA2',v:'#C9957C',w:'#EFC4B4',x:'#BB9180',
  // Small, clean familiar Minecraft-style eyes.
  I:'#272830',J:'#59443B',K:'#A98971',
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

// A clean 8x8 face: compact symmetrical eyes (one pixel each), clear forehead,
// uninterrupted skin clusters and a single restrained mouth pixel. No stripe-like eyes.
const head:FaceMap={
  front:[
    'ABCCCDDA','ACDFEDCA','BDttttDB','usttttsu',
    'usIssIsu','ussssssu','ussssssu','usssxssu'
  ],
  back:[
    'ABCDEDCB','BCDFFDCB','BCDDFCCB','BCCFDCCB',
    'BCDFCDCB','BCCFDCCB','BFCDFCCB','ABCCBBAB'
  ],
  left:[
    'ABCCDDCB','BCDFEDCB','BCDFFDCB','BCsstsCB',
    'BCsustCB','BCsssuCB','BCsssuCB','ABCCBCAB'
  ],
  right:[
    'BCDDCCBA','BCDEFDCA','BCDFFDCB','BCstssCB',
    'BCtsusCB','BCusssCB','BCusssCB','BACBCCBA'
  ],
  top:[
    'AABCCCBA','BCDFEDCB','CDFFEDCC','CCDFDDCC',
    'BCFDEDCB','BCCDFCCB','ABCCDCBA','AABCCBAA'
  ],
  bottom:[
    'vvvvvvvv','vssssssv','vssssssv','vssssssv',
    'vssssssv','vssssssv','vssssssv','vvvvvvvv'
  ]
};
// Thin, sculpted second-layer hair. No accessories, goggles, anime horns,
// giant bows, or high-contrast face-obscuring masks.
const headOuter:FaceMap={
  front:[
    'ABCCCDDA','BCDFEDCB','ACD..DCA','B......B',
    '........','........','........','........'
  ],
  back:[
    'ABCCCDDA','BCDFEDCB','BC....CB','BF....CB',
    'BC....CB','C.....CB','........','........'
  ],
  left:[
    'ABCCDDCB','BCDFEDCB','BC....CB','BF....CB',
    'BC....CB','C.....CB','........','........'
  ],
  right:[
    'BCDDCCBA','BCDEFDCA','BC....CB','BF....CB',
    'BC....CB','C.....CB','........','........'
  ],
  top:[
    'AABCCCBA','BCDFEDCB','CDFFEDCC','CCDFDDCC',
    'BCFDEDCB','BCCDFCCB','ABCCDCBA','AABCCBAA'
  ]
};

// Plain but tailored: clean ivory hoodie, two neat drawstrings, subtle
// kangaroo pocket, shoulder lighting, hem; rear hood matching sides.
const body:FaceMap={
  front:[
    'lHHHHHHl','HhHHHHhH','HHiRRiHH','HHiRRiHH',
    'HhhiihhH','HhHHHHhH','HhMMMMhH','HhiHHihH',
    'HhiHHihH','HhMMMMhH','iHhhhhHi','jiHHHHij'
  ],
  back:[
    'lHHHHHHl','HiHhhHiH','iHHHHHHi','iHHHHHHi',
    'HhHHHHhH','HhHHHHhH','HhHHHHhH','HhHHHHhH',
    'HhHHHHhH','iHhhhhHi','jiHHHHij','jiiHHiij'
  ],
  left:[
    'lHHi','HHhi','hhHi','iHHi','HHHi','HhhH',
    'HhHi','HHHi','iHHi','HHhi','jiij','jjij'
  ],
  right:[
    'iHHl','iHHH','iHhh','iHHH','iHHH','HhhH',
    'iHhH','iHHH','iHHi','ihHH','jiij','jijj'
  ],
  top:['lHHHHHHl','HHHHHHHH','hHHHHHHh','iHHHHHHi'],
  bottom:['jiiHHiij','jiiHHiij','jiiHHiij','jjjjjjjj']
};
// Outer layers make the collar and hood perceptibly three-dimensional but
// keep the front center open so the pocket and drawstrings remain visible.
const bodyOuter:FaceMap={
  front:[
    'ih....hi','ii....ii','..R..R..','..R..R..',
    '........','........','.M....M.','.M....M.',
    '.M....M.','.MMMMMM.','........','j......j'
  ],
  back:[
    '.hHHHHi.','.iHHHHi.','.jiHHij.','..jiij..',
    '........','........','........','........',
    '........','........','........','........'
  ],
  left:[
    'ih.i','i..i','j..i','....','....','....',
    '....','....','....','....','....','j..j'
  ],
  right:[
    'i.hi','i..i','i..j','....','....','....',
    '....','....','....','....','....','j..j'
  ]
};
const legFront=[
  'QPPQ','PQPP','PPQP','QPQQ','QPQQ','QPUQ',
  'QPPQ','PQPP','VVVV','ZzzZ','ZZZZ','noon'
];
const legBack=[
  'QPPQ','PPQQ','PQPP','PPQP','QPQQ','QQPP',
  'QPQQ','PPQP','VVVV','ZzzZ','ZZZZ','noon'
];
const legLeft=[
  'QPPQ','PPQP','QPPQ','QPPQ','QPUQ','QPQQ',
  'QPPQ','QPPQ','VVVV','ZzzZ','ZZZZ','noon'
];
const legRight=[
  'QPPQ','QPQQ','QPQQ','QPPQ','QQPQ','QPUQ',
  'QPPQ','QPPQ','VVVV','ZzzZ','ZZZZ','noon'
];
const legOuter=[
  'Q..Q','....','....','....','....','U...',
  '....','....','V..V','Z..Z','z..z','oooo'
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
      'i..i','....','....','j...','....','...i',
      '....','....','j..j','NNNN','....','....'
    ]:[
      'i..i','....','....','...j','....','i...',
      '....','....','j..j','NNNN','....','....'
    ];
    return rows.map(row=>width===3?row.slice(0,3):row);
  }
  const rows=face==='front'?[
    'lHHl','Hhhh','HhHH','iHHH','HhHH','HhhH',
    'HhHH','iHHH','jHHj','jNNj','stts','ussu'
  ]:face==='back'?[
    'lHHl','Hhhh','HHhH','HHHi','HhHH','HhhH',
    'HHhH','HHHi','jHHj','jNNj','stts','ussu'
  ]:face==='left'?[
    'lHHi','HhHi','HhHi','iHHi','HhHi','HhhH',
    'HhHi','iHHi','jHHj','jNNj','stts','ussu'
  ]:[
    'iHHl','iHhH','iHhH','iHHi','iHhH','HhhH',
    'iHhH','iHHi','jHHj','jNNj','stts','ussu'
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
