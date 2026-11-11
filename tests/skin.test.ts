import {describe,it,expect} from 'vitest';
import {assertSkinDimensions,at,blankSkin,clearRegion,fill,findRegion,rgbaHex,paint,pixelIndex,regions,sampleSkin,SIZE} from '../src/skin';
describe('Java 64×64 UV engine',()=>{
  it('has 72 non-overlapping faces inside atlas for each model',()=>{
    for(const model of ['default','slim'] as const){const rs=regions(model);expect(rs).toHaveLength(72);const covered=new Set<string>();
      for(const {rect:r} of rs){expect(r.x).toBeGreaterThanOrEqual(0);expect(r.y).toBeGreaterThanOrEqual(0);expect(r.x+r.w).toBeLessThanOrEqual(64);expect(r.y+r.h).toBeLessThanOrEqual(64);
        for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){const k=`${x},${y}`;expect(covered.has(k),`${model}: ${k} overlaps`).toBe(false);covered.add(k);}
      }
    }
  });
  it('matches head, torso, legs and both model-specific arm front coordinates',()=>{
    const get=(model:'slim'|'default',part:string,layer:string,face:string)=>regions(model).find(r=>r.part===part&&r.layer===layer&&r.face===face)!.rect;
    expect(get('default','head','base','front')).toEqual({x:8,y:8,w:8,h:8});
    expect(get('default','head','overlay','front')).toEqual({x:40,y:8,w:8,h:8});
    expect(get('default','body','base','front')).toEqual({x:20,y:20,w:8,h:12});
    expect(get('default','rightLeg','base','front')).toEqual({x:4,y:20,w:4,h:12});
    expect(get('default','leftLeg','base','front')).toEqual({x:20,y:52,w:4,h:12});
    expect(get('default','rightArm','base','front')).toEqual({x:44,y:20,w:4,h:12});
    expect(get('slim','rightArm','base','front')).toEqual({x:44,y:20,w:3,h:12});
    expect(get('default','leftArm','base','front')).toEqual({x:36,y:52,w:4,h:12});
    expect(get('slim','leftArm','base','front')).toEqual({x:36,y:52,w:3,h:12});
    expect(get('slim','rightArm','base','right')).toEqual({x:47,y:20,w:4,h:12});
  });
  it('keeps pixel operations integer exact and fill confined to a face',()=>{
    const initial=blankSkin(),r=findRegion('default',8,8,'base')!;
    expect(r.face).toBe('front');
    const drawn=paint(initial,8,8,[17,34,51,255]);expect(rgbaHex(drawn,8,8)).toBe('#112233');expect(rgbaHex(initial,8,8)).not.toBe('#112233');
    const filled=fill(drawn,8,8,[1,2,3,255],r.rect);
    expect([...filled.slice(pixelIndex(8,8),pixelIndex(8,8)+4)]).toEqual([1,2,3,255]);
    expect(rgbaHex(filled,9,8)).toBe(rgbaHex(initial,9,8));
    expect(at(r.rect,16,8)).toBe(false);
    const removed=clearRegion(filled,'head','overlay','default');expect(removed.length).toBe(SIZE*SIZE*4);
  });
  it('generates opaque base and optional transparent overlay, rejects other dimensions',()=>{
    for(const m of ['default','slim'] as const){const s=sampleSkin(m);expect(s).toHaveLength(16384);
      for(const {rect:r} of regions(m).filter(v=>v.layer==='base'))for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)expect(s[pixelIndex(x,y)+3]).toBe(255);
      expect(s[pixelIndex(42,8)+3]).toBe(255);expect(s[pixelIndex(40,8)+3]).toBe(0);expect(s[pixelIndex(40,39)+3]).toBe(0);
    }
    expect(()=>assertSkinDimensions(64,64)).not.toThrow();expect(()=>assertSkinDimensions(128,128)).toThrow();
  });
  it('keeps a polished familiar face, natural complexion and subtle raised hair for both arm models',()=>{
    for(const model of ['default','slim'] as const){
      const skin=sampleSkin(model);
      const get=(part:string,layer:string,face:string)=>regions(model).find(r=>r.part===part&&r.layer===layer&&r.face===face)!.rect;
      const face=get('head','base','front');
      const hair=get('head','overlay','front');
      const back=get('head','base','back');
      expect(rgbaHex(skin,face.x,face.y)).toBe('#29242a'); // soft dark hair edge
      expect(rgbaHex(skin,face.x+3,face.y+3)).toBe('#ffe4cc'); // uniform forehead highlight
      expect(rgbaHex(skin,face.x+2,face.y+4)).toBe('#272830'); // dark left eye
      expect(rgbaHex(skin,face.x+2,face.y+5)).toBe('#59443b'); // brown iris under dark upper lid
      expect(rgbaHex(skin,face.x+5,face.y+5)).toBe('#59443b'); // symmetric second eye row
      expect(rgbaHex(skin,face.x+1,face.y+6)).toBe('#f5d1b5'); // cheeks stay neutral and clean
      expect(rgbaHex(skin,face.x+6,face.y+6)).toBe('#f5d1b5'); // symmetric cheeks
      expect(rgbaHex(skin,face.x+4,face.y+7)).toBe('#bb9180'); // one subtle mouth pixel
      expect(rgbaHex(skin,face.x+5,face.y+4)).toBe('#272830'); // dark right eye
      expect(rgbaHex(skin,back.x+3,back.y+3)).toBe('#735342'); // coherent back strands
      expect(skin[pixelIndex(hair.x+2,hair.y)+3]).toBe(255); // lifted fringe
      expect(skin[pixelIndex(hair.x+2,hair.y+4)+3]).toBe(0); // eye visible
      expect(skin[pixelIndex(hair.x+4,hair.y+7)+3]).toBe(0); // no face mask
      const left=get('head','base','left'),right=get('head','base','right');
      const outerLeft=get('head','overlay','left'),outerRight=get('head','overlay','right');
      expect(rgbaHex(skin,left.x+4,left.y+4)).toBe('#efc4b4'); // subtle left ear
      expect(rgbaHex(skin,right.x+3,right.y+4)).toBe('#efc4b4'); // mirrored right ear
      expect(skin[pixelIndex(outerLeft.x+4,outerLeft.y+4)+3]).toBe(0); // exposed ear
      expect(skin[pixelIndex(outerRight.x+3,outerRight.y+4)+3]).toBe(0);
      const headOverlays=regions(model).filter(r=>r.part==='head'&&r.layer==='overlay');
      let colored=0,total=0;
      for(const {rect:r} of headOverlays)for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){
        total++;if(skin[pixelIndex(x,y)+3]>0)colored++;
      }
      expect(colored).toBeGreaterThan(60); // actual raised strands
      expect(colored/total).toBeLessThan(.4); // never the full outer cube
    }
  });
  it('adds plain ivory hoodie tailoring, slate jeans and clean white trainers',()=>{
    for(const model of ['default','slim'] as const){
      const skin=sampleSkin(model);
      const get=(part:string,layer:string,face:string)=>regions(model).find(r=>r.part===part&&r.layer===layer&&r.face===face)!.rect;
      const chest=get('body','base','front'),hood=get('body','overlay','back');
      const cuff=get('rightArm','base','front'),jeans=get('rightLeg','base','front');
      expect(rgbaHex(skin,chest.x,chest.y)).toBe('#ffffff');
      expect(rgbaHex(skin,chest.x+3,chest.y+2)).toBe('#9fa9b6'); // hoodie drawstring
      expect(rgbaHex(skin,chest.x+3,chest.y+6)).toBe('#c0cbd6'); // pouch seam
      expect(skin[pixelIndex(hood.x+3,hood.y+1)+3]).toBe(255); // real raised hood
      expect(rgbaHex(skin,cuff.x+1,cuff.y+9)).toBe('#b3c1cf');
      expect(rgbaHex(skin,jeans.x,jeans.y)).toBe('#39465b');
      expect(rgbaHex(skin,jeans.x+1,jeans.y+10)).toBe('#fafcff');
      expect(rgbaHex(skin,jeans.x+1,jeans.y+11)).toBe('#68778b');
    }
  });

});
