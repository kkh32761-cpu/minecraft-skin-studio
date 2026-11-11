import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
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
  it('keeps a polished familiar face, natural complexion and subtle raised hair for both arm models',()=>{
    for(const model of ['default','slim'] as const){
      const skin=sampleSkin(model);
      const get=(part:string,layer:string,face:string)=>regions(model).find(r=>r.part===part&&r.layer===layer&&r.face===face)!.rect;
      const face=get('head','base','front');
      const hair=get('head','overlay','front');
      const back=get('head','base','back');
      expect(rgbaHex(skin,face.x,face.y)).toBe('#29242a'); // soft dark hair edge
      expect(rgbaHex(skin,face.x+3,face.y+3)).toBe('#f5d1b5'); // clean skin
      expect(rgbaHex(skin,face.x+2,face.y+4)).toBe('#272830'); // dark left eye
      expect(rgbaHex(skin,face.x+5,face.y+4)).toBe('#272830'); // dark right eye
      expect(rgbaHex(skin,face.x+2,face.y+5)).toBe('#59443b'); // warm iris
      expect(rgbaHex(skin,back.x+3,back.y+3)).toBe('#735342'); // coherent back strands
      expect(skin[pixelIndex(hair.x+2,hair.y)+3]).toBe(255); // lifted fringe
      expect(skin[pixelIndex(hair.x+2,hair.y+4)+3]).toBe(0); // eye visible
      expect(skin[pixelIndex(hair.x+4,hair.y+7)+3]).toBe(0); // no face mask
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
  it('ships PNG demo assets identical to the editable UV sample for Steve and Alex',()=>{
    for(const [model,name] of [['default','steve'],['slim','alex']] as const){
      const bytes=readFileSync(new URL(`../public/sample-skin-${name}.png`,import.meta.url));
      expect([...bytes.subarray(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
      let offset=8;const chunks:Uint8Array[]=[];
      while(offset<bytes.length){
        const length=bytes.readUInt32BE(offset),tag=bytes.toString('ascii',offset+4,offset+8);
        if(tag==='IHDR'){
          expect(bytes.readUInt32BE(offset+8)).toBe(64);
          expect(bytes.readUInt32BE(offset+12)).toBe(64);
          expect(bytes[offset+17]).toBe(6); // RGBA
        }
        if(tag==='IDAT')chunks.push(bytes.subarray(offset+8,offset+8+length));
        offset+=12+length;
        if(tag==='IEND')break;
      }
      const data=inflateSync(Buffer.concat(chunks));
      const pixels=new Uint8ClampedArray(64*64*4);
      for(let y=0;y<64;y++){
        const rowStart=y*(1+64*4);
        expect(data[rowStart]).toBe(0); // no PNG scanline filters for exact art comparison
        pixels.set(data.subarray(rowStart+1,rowStart+1+64*4),y*64*4);
      }
      expect(pixels).toEqual(sampleSkin(model));
    }
  });

});
