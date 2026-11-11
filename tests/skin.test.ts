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
  it('preserves the uploaded legacy skin in the correct modern 64x64 UV layout',()=>{
    for(const model of ['default','slim'] as const){
      const s=sampleSkin(model);
      expect(s).toHaveLength(64*64*4);
      expect(()=>assertSkinDimensions(64,64)).not.toThrow();
      expect(()=>assertSkinDimensions(128,128)).toThrow();
      for(const {rect:r} of regions(model).filter(r=>r.layer==='base')){
        for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)
          expect(s[pixelIndex(x,y)+3],`${model}: opaque ${x},${y}`).toBe(255);
      }
      // The uploaded 64x32 texture has no optional outer/hat texture.
      for(const {rect:r} of regions(model).filter(r=>r.layer==='overlay')){
        for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)
          expect(s[pixelIndex(x,y)+3],`${model}: empty outer ${x},${y}`).toBe(0);
      }
      expect(rgbaHex(s,8,8)).toBe('#2f200d'); // untouched source hair color
      expect(rgbaHex(s,12,12)).toBe('#bb8972'); // untouched reference skin
    }
    const steve=sampleSkin('default'),alex=sampleSkin('slim');
    expect(steve.reduce((sum,n)=>sum+n,0)).toBe(651390);
    expect(alex.reduce((sum,n)=>sum+n,0)).toBe(622367);
    const opaque=(skin:Uint8ClampedArray)=>skin.filter((v,i)=>i%4===3&&v===255).length;
    expect(opaque(steve)).toBe(1632);
    expect(opaque(alex)).toBe(1568);
  });
  it('mirrors old right arm and right leg to modern left-limb faces',()=>{
    const steve=sampleSkin('default');
    const get=(part:string,face:string)=>regions('default')
      .find(r=>r.part===part&&r.layer==='base'&&r.face===face)!.rect;
    for(const [right,left] of [['rightArm','leftArm'],['rightLeg','leftLeg']] as const){
      for(const face of ['front','back','left','right','top','bottom'] as const){
        const rightFace=face==='left'?'right':face==='right'?'left':face;
        const a=get(right,rightFace),b=get(left,face);
        for(let y=0;y<b.h;y++)for(let x=0;x<b.w;x++)
          expect([...steve.slice(pixelIndex(b.x+x,b.y+y),pixelIndex(b.x+x,b.y+y)+4)])
            .toEqual([...steve.slice(pixelIndex(a.x+a.w-1-x,a.y+y),pixelIndex(a.x+a.w-1-x,a.y+y)+4)]);
      }
    }
  });
  it('keeps the original face and body intact when changing arm width',()=>{
    const steve=sampleSkin('default'),alex=sampleSkin('slim');
    for(const {part,rect:r} of regions('default').filter(x=>
      x.layer==='base'&&x.part!=='rightArm'&&x.part!=='leftArm')){
      for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){
        const i=pixelIndex(x,y);
        expect([...alex.slice(i,i+4)],`${part}: ${x},${y}`)
          .toEqual([...steve.slice(i,i+4)]);
      }
    }
    expect(rgbaHex(alex,8,8)).toBe(rgbaHex(steve,8,8));
    expect(rgbaHex(alex,4,20)).toBe(rgbaHex(steve,4,20));
  });
});
