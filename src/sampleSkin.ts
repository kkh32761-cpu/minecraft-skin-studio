import type {Region} from './skin';

// A hand-painted 64x64 Java skin inspired by the supplied front/back reference.
// Crucial features: soft silver headpiece, layered powder-blue hair, oversized
// two-tone eyes, lavender-white coat, red badge, cyan ribbon, puffy sleeves,
// muted skirt, bare thighs and white knee-high boots. UV pixels are the output,
// not a picture pasted over the 3D viewer.
export const samplePalette:Record<string,string>={
  // Hair: reference blue, with real highlight/strand shadows instead of flat cyan.
  H:'#78C2EC',h:'#439ED9',j:'#A8D8F5',K:'#267DBA',k:'#285884',I:'#93CDEB',n:'#D4EFFF',
  // Headband/hood: ivory-pink base, mauve shading, blue translucent detail.
  S:'#F2EDF2',s:'#E4DDE7',D:'#C5BCCB',F:'#98919E',f:'#706978',P:'#A6C8E5',O:'#78ACD3',
  // Skin and eyes: peach warmth, rosy cheeks, dark lashes and blue irises.
  a:'#F3D3C3',b:'#FFE5D7',d:'#CFA694',p:'#E8A0AD',m:'#966D76',i:'#F1E9DC',y:'#DFCFBF',
  E:'#29354C',e:'#2E639B',v:'#91C9E8',w:'#E4F1FB',W:'#FFFFFF',
  // Coat: pearl-lavender light/shadow range with charcoal-mauve cuff accents.
  C:'#E9E3EC',c:'#D4C9D7',q:'#B8ADBC',r:'#9A8F9F',t:'#7B7082',u:'#564F61',
  // Tie, scarf and brooch.
  B:'#7BC5E6',g:'#4D90C6',z:'#B4DBEA',G:'#EA352E',T:'#7777CF',
  // Skirt, boots and socks: muted warm mauves with calibrated dark folds.
  V:'#B2A4B4',X:'#978999',x:'#746879',Y:'#CDC0CC',
  L:'#E7E1E7',l:'#BEB3C1',M:'#958A99',N:'#6E6575'
};
const rgba=Object.fromEntries(Object.entries(samplePalette).map(([symbol,hex])=>[
  symbol,[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16),255]
])) as Record<string,number[]>;
type FaceMap=Partial<Record<Region['face'],string[]>>;

// Full atlas base: emphasize clusters in the original character's silhouette.
const head:FaceMap={
  front:[
    'HjIIIjHH','hIhhhhIH','hHbbaHHh','HEEaaEEH',
    'HweaaewH','HveaaevH','HpbaabpH','HaabmaaH'
  ],
  back:[
    'jjHHjjII','IIhIhIIh','hIHhIIHh','hIHhIIHh',
    'hHHhjIHh','hHHhjIHh','hIIhHHHh','KhhHhKKH'
  ],
  left:[
    'hIhHHHHH','hIhIIIHH','hhHhhHHH','hhaaaahH',
    'hhaadbhH','hhadddHH','hHadddHH','KKhHhKKH'
  ],
  right:[
    'HHHHhIhH','HHIIIhIh','HHHhhHhh','Hhaaaahh',
    'Hhbd aah'.replace(' ',''),'HHdd dah'.replace(' ',''),'HHdddaHh','HKKHhHKK'
  ],
  top:[
    'kKHHHHKk','KjHIIHjK','HIIjjIIH','HIIhhIIH',
    'HIHhhIHH','HIIHHIIH','KjHIIHjK','kKHHHHKk'
  ],
  bottom:[
    'dddddddd','daaaaaad','daaaaaad','daaaaaad',
    'daaaaaad','daaaaaad','daaaaaad','dddddddd'
  ]
};
// Silver goggle/hood brim sits one real Minecraft outer layer outward.
// Fringes do not obscure the eyes, with two hanging outer columns.
const headOuter:FaceMap={
  front:[
    'DSsSSsSD','SPPOOPPS','hIhjjIhh','K......K',
    'h......h','H......H','h......h','I......I'
  ],
  back:[
    'SSsSSsSS','SPPOOPPS','Ih....hI','I......I',
    'I.h..h.I','j.h..h.j','h.H..H.h','H.H..H.H'
  ],
  left:[
    'SsSSsSSD','SOOOPPSD','hIh...hH','Hh....hH',
    'Ih....hh','Hh....hH','jH....hH','hH....KH'
  ],
  right:[
    'DSSsSSsS','DSPPOOOS','Hh...hIh','Hh....hH',
    'hh....hI','Hh....hH','Hh....Hj','HK....Hh'
  ],
  top:[
    'DSSSSSSD','SPPOOPPS','SS....SS','sS....Ss',
    'sS....Ss','SS....SS','SPPOOPPS','DSSSSSSD'
  ]
};
// Coat under-paint: inner cyan ribbon, crimson pin, cool ivory body and
// mauve shadow seams. 8x12 front/back; 4x12 sides.
const body:FaceMap={
  front:[
    'SCCSSCCS','CCzBBzCC','CczBgzCC','GCcgBzCC',
    'GCCgTzCC','CCcBgcCC','CCcBgcCC','CCcBgcCC',
    'qCcBgcCq','ttttrttt','VYVVYVYV','XVXVXXVX'
  ],
  back:[
    'SSCCCCSS','SCccCcCS','CccqqccC','CqcrrcqC',
    'CCcccccC','CccCCccC','CccCCccC','CccCCccC',
    'qCccCCcq','rqqqqqqr','YVVXXVVY','XVXVXXVX'
  ],
  left:[
    'SCCS','sCcC','cqqC','CCcC','CccC','CcCC',
    'CcCC','CqCC','qrCC','tqrr','YVVV','XVXX'
  ],
  right:[
    'SCCS','CCcs','Cqqc','CcCC','CccC','CCcC',
    'CCcC','CCqC','CCrq','rrqt','VVVY','XXVX'
  ],
  top:['SSCCCCSS','SCCCCCCS','SCccccCS','SCCCCCCS'],
  bottom:['XVVVVVVX','XVXXXXVX','XVVVVVVX','XXXXXXXX']
};
// Raised jacket: clear two side panels, sculpted lapels, a blue tie/ribbon,
// folded bottom hem. Empty center remains open to show colored base.
const bodyOuter:FaceMap={
  front:[
    'SC....CS','SCC..CCS','SC....CS','Cc....cC',
    'SC....CS','Sc....cS','Cc....cC','SC....CS',
    'Sc....cS','rC....Cr','YV....VY','XX....XX'
  ],
  back:[
    'SC....CS','SC....CS','Cq....qC','CC....CC',
    'SC....CS','SC....CS','Cc....cC','SC....CS',
    'SC....CS','rC....Cr','YV....VY','XX....XX'
  ],
  left:[
    'S..S','SC.C','C..C','C..C','S..S','C..C',
    'C..C','C..C','C..C','r..r','Y..Y','X..X'
  ],
  right:[
    'S..S','C.CS','C..C','C..C','S..S','C..C',
    'C..C','C..C','C..C','r..r','Y..Y','X..X'
  ]
};
const legFront=[
  'YVVY','XVVX','xYYx','baab','abbb','aabb',
  'diiy','yiid','LLlL','LqlL','LlLL','NMMN'
];
const legBack=[
  'YVVY','XVXX','xYYx','daaa','daaa','daya',
  'dyii','yiid','LLLL','LlLL','LllL','NMMN'
];
const legLeft=[
  'YVVY','XVXX','xyYx','daaa','daaa','diiy',
  'yiid','diiy','LlLL','LlLL','LlLL','NNMN'
];
const legRight=[
  'YVVY','XXVX','xYyx','aaad','aaad','yiid',
  'diiy','yiid','LLlL','LLlL','LLlL','NMNN'
];
const legOuter=[
  'Y..Y','X..X','x..x','....','....','....',
  '....','....','L..L','l..l','L..L','NNNN'
];
// Sleeves have real horizontal shoulder stripes and dark, wide wrist cuffs;
// the old sample repeated a checkerboard across limbs.
function sleevePattern(width:number,face:Region['face'],outer:boolean):string[]{
  const front=face==='front',back=face==='back';
  if(face==='top')return ['S'.repeat(width),'C'.repeat(width),'c'.repeat(width),'C'.repeat(width)];
  if(face==='bottom')return ['d'.repeat(width),'a'.repeat(width),'d'.repeat(width),'d'.repeat(width)];
  if(outer){
    const patterns=front||back?[
      'SC.C','SC.C','....','....','S..C','C..C',
      'S..C','C..C','rttt','tuut','....','....'
    ]:[
      'S..C','SC.C','....','....','S..C','C..C',
      'S..C','C..C','rttt','tuut','....','....'
    ];
    return patterns.map(row=>row.slice(0,width));
  }
  const patterns=front?[
    'SSCC','sSCC','tqrr','tqrr','CCcC','SCCS',
    'CCcC','CCcC','qrrq','tuut','daaa','dbaa'
  ]:back?[
    'CCSS','CCSs','rrqt','rrqt','CcCC','SCCS',
    'CCcC','CCcC','qrrq','tuut','aaad','aabd'
  ]:[
    'SCCS','sCCs','tqqt','tqqt','cCCc','SCCS',
    'CcCC','CcCC','qrrq','ttut','daaa','dbaa'
  ];
  return patterns.map(row=>row.slice(0,width));
}
function solid(width:number,height:number,symbol:string):string[]{return Array.from({length:height},()=>symbol.repeat(width));}
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
        solid(rect.w,rect.h,face==='top'?'V':'N');
    else if(arm)pattern=sleevePattern(rect.w,face,layer==='overlay');
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
