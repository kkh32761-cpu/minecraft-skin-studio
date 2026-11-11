import type {Region} from './skin';

/**
 * Uploaded 64x32 legacy Steve skin, preserved pixel-for-pixel.
 * Transparent upper-right region is the optional legacy hat layer.
 * The newer 64x64 standard requires mirrored left-arm and left-leg UV faces.
 * The slim variant is a 3px-arm adaptation; the Steve version is exact.
 */
const PALETTE_RGB='AAAAAAAADg4PERITFBYZFRYXFRcaFhgbGRocGRwfHB8iHSAkHiElHxALICEjISUpIxcJIyMjJBgIJBgKJhgLJhoKJhoMJxsLKBoNKBsKKBsLKBwLKCgoKRwMKh0NKx4NKx4OLB4OLB4RLR0OLSAQLx8PLyANLyIRMiMQMyQRNCUSOigUPyoVPz8/QiYdQioSUTElUigmYkMvakAwa2trbUMqb0UsdEgvdUcvd0I1ek4zgFM0gVM5g1U7hFIxhlM0h1U7h1g6iFo5ilk7j14+kF5Dll9All9Blm9bmmNEmmRKnGNFnGNGnGdInGlMnHJcnWpPn2hJompHqn1mrCIirHZarYBts3titIRttXtntolst4Jyu4lyvYtyvY5yvY50vohsxpaAz8/P4d7a4+Dd5uPg6efk////';
const LEGACY_RLE='CAACHgESAh4CEgENCDgwAAEeARICJQEeAxIBOAEzAT8BMwI/AjgwAAEeAiUBFQEeAxIBOAEzBBEBMwE4MAABEgElAR4BEgIeASUBHgE4ATMEEQEzATgwAAEeASUBHgIVAiUBHgE4ATMEEQEzATgwAAIeAhUDJQEeATgBMwQRATEBODAAAR4BFQElAR0BFQENASUBHgE4BjMBODAAAR4BHQQVAh4IOCgAAhkBFQEXAR0BKAIkASYBHwElARsBEgEVAR8BHgIkASgBHQEXARUCGQIeARICHgISAQ0gAAIZAhUBIQEdAR8BKQMfASkBLwEsASEBGwEpAR8BHQEhAhUCGQEeARICJQEeAxIgAAEhARQBFQEdASABGgETAR0BHwFaAV4BYQFdAV8BVQEqAR0BEwEaASABHQEVARQBIQEeAiUBFQEeAxIgAAEZARgBIwEhARkBFwEhAScBUwFYAVMBVgFPAVwCTgEnASEBFwEZASEBIwEYARkBEgElAR4BEgIeASUBHiAAAxkBFgEQAUEBSwErAVgBZwEuAVkBXAEuAWcBUwErAUsBQQEQARYDGQEeASUBHgIVAiUBHiAAAhkBGAEUASIBPgFHAUIBTAFXAVsCPwFgAVIBOwFCAUcBPgEiARQBGAIZAh4CFQMlAR4gAAEhARkBIwEyAVABSQE/ATgBRQFGBDkBRAE8ATgBPwFJAVABMgEjARkBIQEeARUBJQEdARUBDQElAR4gAAI/AUkBPwFNAUcBQwE3ATYBNQI8AToCPQE6ATcBQwFRAU0BSgFNAUkCPwE4BBUBOAE/JAAEDgQcCAABDwY4AQ8IBggAAQsCDwELATMBMAEzATAQAAQOBBwIAAEPBjMBDwgGCAAEDwEzATABMwEwEAAEDgQcCAABDwYzAQ8IBggAAw8BCwEwATMBMAEzEAAEDgQcCAABDwY4AQ8IBggAAQsCDwELATABMwEwATMMAAIDAQIBAwQIAQMBAgIDAwgBBQMJAQQBCgJiAVIBPAJiAQoECQEKAwsCDAILBAkBCgELAQwBCwQJBAwIAAEDAgIBAwQIAQMBAgIDBAgBCQIHAQkBAQELBGIBDAEBAQkDBwELBQwCCwMHAQkBDAELAQwBCgEJAgcBCQQMCAABAwECAgMECAEDAQICAwQIAwcBCQEMAQEBYgIBAWIBAQEMBAcHDAELAQkCBwEJAQsDDAEJAgcBCQQMCAABAwECAgMECAEDAQICAwQIAQQCBwEEAQwBAQRiAQEBDAEEAgcBBAIMAQoBDAELAQoBDAELAQkCBwEJAQoCDAEKAQkCBwEJBAwIAAEDAQICAwQIAgMBAgEDBAUBBwMEAgoBAQJiAQEBVAEKBAQBDAELAQoBDAELAQoCDAQJAQoBCwEMAQsECQQMCAABAwECAgMBCAIFAQgBAwICAQMEBQMEAQcCCgEBAmIBAQELAQoBBwIEAQcBDAIKAQwBCwEKAQsBDAMHAQkBDAELAQwBCgEJAgcBCQQMCAABAwECAgMECAEDAQICAwQIAQcCBAEHAQoCDAIBAQwBCwEKAQcBBAIHAQwBCwEKAQsBDAIKAQwBCQIHAQkBCwMMAQkCBwEJBAwIAAQDBAgBAwECAgMECAEJAgcBCQEKAgwBCgELAQwBCwEKAQkDBwIMAQoBCwEMAgoBDAEJAgcBCQEKAgwBCgEJAgcBCQQMCAAEAwQIBAMECAEJAgcBCQMMAQoBCwIMAQoBCQIHAQkIDAFlAmYBZQFkAmMBZAFlAmYBZQRjCAACLQIDBAgCAwItBDQBCQEHAgkDCgELAQwBCwEMAQoBCQIHAQkDCgEMAgoBDAELAkcBQAFHBFMERwFTAUgBUwFICAAELQQ0BC0ENAEDAQIBAwECBQgBBQEMAQoBCQICAQMBCAIFAQsCCgEFAQgCRwFAAUcCUwFIAVMBQAFHAUABRwFTAUgBUwFICAAELQQ0BC0ENAEDAQICAwYIAQUBCgEDAQICAwMIAQUBCgMIBEcBSAFTAkgBQANHAVMBSAFTAUgIAA==';

function decodeBase64(input:string):Uint8Array {
  const binary=atob(input);
  return Uint8Array.from(binary,char=>char.charCodeAt(0));
}

type Face=Region['face'];
type UVRect={x:number;y:number;w:number;h:number};
function limbFace(u:number,v:number,face:Face,width=4):UVRect {
  const d=4,h=12;
  switch(face){
    case 'top': return {x:u+d,y:v,w:width,h:d};
    case 'bottom': return {x:u+d+width,y:v,w:width,h:d};
    case 'left': return {x:u,y:v+d,w:d,h};
    case 'front': return {x:u+d,y:v+d,w:width,h};
    case 'right': return {x:u+d+width,y:v+d,w:d,h};
    case 'back': return {x:u+d*2+width,y:v+d,w:width,h};
  }
}
const FACES:Face[]=['top','bottom','left','front','right','back'];
const pixelAt=(x:number,y:number)=>(y*64+x)*4;
function decodeSteve():Uint8ClampedArray {
  const palette=decodeBase64(PALETTE_RGB);
  const runs=decodeBase64(LEGACY_RLE);
  const result=new Uint8ClampedArray(64*64*4);
  let n=0;
  for(let i=0;i<runs.length;i+=2){
    const count=runs[i],index=runs[i+1];
    for(let j=0;j<count;j++){
      if(n>=64*32)throw Error('Legacy skin data overflow');
      if(index!==0){
        const p=index*3;
        result.set([palette[p],palette[p+1],palette[p+2],255],n*4);
      }
      n++;
    }
  }
  if(n!==64*32)throw Error('Legacy skin data length mismatch');
  const legacy=new Uint8ClampedArray(result);
  // Exact vanilla 64x32 -> 64x64 limb mirroring; swap left/right faces.
  function mirroredLimb(fromU:number,fromV:number,toU:number,toV:number){
    for(const face of FACES){
      const sourceFace:Face=face==='left'?'right':face==='right'?'left':face;
      const from=limbFace(fromU,fromV,sourceFace);
      const to=limbFace(toU,toV,face);
      for(let y=0;y<to.h;y++)for(let x=0;x<to.w;x++){
        const src=pixelAt(from.x+from.w-1-x,from.y+y);
        result.set(legacy.subarray(src,src+4),pixelAt(to.x+x,to.y+y));
      }
    }
  }
  mirroredLimb(0,16,16,48);
  mirroredLimb(40,16,32,48);
  return result;
}
const STEVE=decodeSteve();

export function makeSampleSkin(atlas:Region[]):Uint8ClampedArray {
  const isSlim=atlas.some(r=>r.part==='rightArm'&&r.layer==='base'&&r.face==='front'&&r.rect.w===3);
  if(!isSlim)return new Uint8ClampedArray(STEVE);
  const out=new Uint8ClampedArray(STEVE);
  const arms=[
    [40,16],[40,32],[32,48],[48,48]
  ] as const;
  // Clear classic arm nets, then repack into valid 3px-arm UV positions.
  for(const [u,v] of arms)for(let y=v;y<v+16;y++)for(let x=u;x<u+16;x++)
    out.set([0,0,0,0],pixelAt(x,y));
  for(const [u,v] of arms)for(const face of FACES){
    const from=limbFace(u,v,face,4);
    const to=limbFace(u,v,face,3);
    for(let y=0;y<to.h;y++)for(let x=0;x<to.w;x++){
      const index=pixelAt(from.x+x,from.y+y);
      out.set(STEVE.subarray(index,index+4),pixelAt(to.x+x,to.y+y));
    }
  }
  return out;
}
