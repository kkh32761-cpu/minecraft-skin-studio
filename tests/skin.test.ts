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
      expect(s[pixelIndex(40,8)+3]).toBe(255);expect(s[pixelIndex(40,39)+3]).toBe(0);
    }
    expect(()=>assertSkinDimensions(64,64)).not.toThrow();expect(()=>assertSkinDimensions(128,128)).toThrow();
  });
  it('uses the showcase vivid cyan hair, brilliant white outfit and crimson accent',()=>{
    for(const model of ['default','slim'] as const){
      const skin=sampleSkin(model);
      const head=regions(model).find(v=>v.part==='head'&&v.layer==='base'&&v.face==='front')!.rect;
      const chest=regions(model).find(v=>v.part==='body'&&v.layer==='base'&&v.face==='front')!.rect;
      expect(rgbaHex(skin,head.x,head.y)).toBe('#45c7fa');
      expect(rgbaHex(skin,chest.x,chest.y)).toBe('#f9fcff');
      expect(rgbaHex(skin,chest.x+3,chest.y+5)).toBe('#ff3f60');
    }
  });
  it('keeps the example eyes readable beneath the raised goggles in both arm models',()=>{
    for(const model of ['default','slim'] as const){
      const skin=sampleSkin(model);
      const head=regions(model).find(v=>v.part==='head'&&v.layer==='base'&&v.face==='front')!.rect;
      const goggles=regions(model).find(v=>v.part==='head'&&v.layer==='overlay'&&v.face==='front')!.rect;
      expect(rgbaHex(skin,head.x+2,head.y+4)).toBe('#214477');
      expect(rgbaHex(skin,head.x+5,head.y+4)).toBe('#214477');
      expect(skin[pixelIndex(goggles.x+2,goggles.y+4)+3]).toBe(0);
      expect(skin[pixelIndex(goggles.x+1,goggles.y)+3]).toBe(255);
    }
  });
});
