import {describe,it,expect} from 'vitest';
import {SkinObject} from 'skinview3d';
import {regions,sampleSkin,pixelIndex} from '../src/skin';

const parts=['head','body','rightArm','leftArm','rightLeg','leftLeg'] as const;

describe('3D preview: Minecraft outer layer',()=>{
  it('can hide and restore every real mesh layer, without rewriting exported skin pixels',()=>{
    const player=new SkinObject();
    const skin=sampleSkin('slim');
    const before=new Uint8ClampedArray(skin);
    const regionsForOuter=regions('slim').filter(r=>r.layer==='overlay');
    const painted=regionsForOuter.some(({rect:r})=>{
      for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)
        if(skin[pixelIndex(x,y)+3]>0)return true;
      return false;
    });
    expect(painted).toBe(true); // sample has actual second-layer pixels
    player.setOuterLayerVisible(false);
    for(const part of parts)expect(player[part].outerLayer.visible).toBe(false);
    player.setOuterLayerVisible(true);
    for(const part of parts)expect(player[part].outerLayer.visible).toBe(true);
    expect(skin).toEqual(before); // UI switch must never touch PNG data
  });
});