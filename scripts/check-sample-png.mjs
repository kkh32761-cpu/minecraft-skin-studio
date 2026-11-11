import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {build} from 'esbuild';

// Use the actual source generator, not a second copy of the UV art.
// Bundling the TypeScript sources in memory avoids requiring Node TS loaders.
const built=await build({
  entryPoints:['src/skin.ts'],bundle:true,platform:'node',format:'esm',
  write:false,target:'node22',logLevel:'silent'
});
const src=Buffer.from(built.outputFiles[0].text).toString('base64');
const {sampleSkin}=await import('data:text/javascript;base64,'+src);

function readDemo(name){
  const png=readFileSync(new URL('../public/sample-skin-'+name+'.png',import.meta.url));
  assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  const parts=[];
  let pos=8,width=0,height=0;
  while(pos<png.length){
    const length=png.readUInt32BE(pos),name=png.toString('ascii',pos+4,pos+8);
    if(name==='IHDR'){
      width=png.readUInt32BE(pos+8);height=png.readUInt32BE(pos+12);
      assert.equal(png[pos+16],8,'8-bit skin');
      assert.equal(png[pos+17],6,'RGBA color type');
    }
    if(name==='IDAT')parts.push(png.subarray(pos+8,pos+8+length));
    pos+=12+length;
    if(name==='IEND')break;
  }
  assert.equal(width,64);assert.equal(height,64);
  const rgba=inflateSync(Buffer.concat(parts));
  const exact=new Uint8ClampedArray(64*64*4);
  assert.equal(rgba.length,64*(1+64*4));
  for(let y=0;y<64;y++){
    const i=y*(1+64*4);
    assert.equal(rgba[i],0,'raw PNG rows must use filter 0');
    exact.set(rgba.subarray(i+1,i+1+64*4),y*64*4);
  }
  return exact;
}
for(const [model,name] of [['default','steve'],['slim','alex']]){
  assert.deepEqual(readDemo(name),sampleSkin(model),
    name+' PNG must contain exactly the current editable UV atlas');
  console.log('Skin PNG matches editor sample: '+name+' (64x64 RGBA)');
}
