import {describe,it,expect} from 'vitest';
import {generateCharacter,validateCharacterSpec,type CharacterSpec} from '../src/character';
import {regions,pixelIndex} from '../src/skin';
const spec:CharacterSpec={imageType:'anime',hairStyle:'fringe',eyeStyle:'large',outfitStyle:'jacket',colors:{skin:'#d4ad92',hair:'#161622',hairShade:'#292535',eyes:'#ba252d',top:'#364574',topShade:'#202c50',bottom:'#34313d',shoes:'#161a20',accent:'#f0d6b7'},visible:{hair:'검은 앞머리',eyes:'붉은 눈',clothes:'파란 재킷',distinctive:'붉은 눈'},inferred:{back:'검은 머리 뒤통수',sides:'어두운 옆머리'}};
describe('character UV assembler',()=>{
  it('draws observed eyes and hair on the head while keeping limb UV model-specific',()=>{
    for(const model of ['default','slim'] as const){const data=generateCharacter(spec,model);
      expect(data).toHaveLength(64*64*4);
      const front=regions(model).find(r=>r.part==='head'&&r.layer==='base'&&r.face==='front')!.rect;
      expect(Array.from(data.slice(pixelIndex(front.x+2,front.y+4),pixelIndex(front.x+2,front.y+4)+3))).toEqual([186,37,45]);
      const arm=regions(model).find(r=>r.part==='rightArm'&&r.layer==='base'&&r.face==='front')!.rect;
      expect(arm.w).toBe(model==='slim'?3:4);
      expect(data[pixelIndex(front.x+3,front.y+4)+3]).toBe(255);
    }
  });
  it('rejects malformed provider color values',()=>expect(()=>validateCharacterSpec({...spec,colors:{...spec.colors,eyes:'red'}})).toThrow());
});
