import {expect,it} from 'vitest';
import {hsvToRgb,rgbToHsv} from '../src/ColorPicker';
it('keeps channel endpoints and hue when switching RGB/HSV controls',()=>{
  expect(hsvToRgb(0,1,1)).toEqual([255,0,0]);
  expect(hsvToRgb(120,1,1)).toEqual([0,255,0]);
  expect(hsvToRgb(240,1,1)).toEqual([0,0,255]);
  const [h,s,v]=rgbToHsv(94,62,88);
  expect(hsvToRgb(h,s,v)).toEqual([94,62,88]);
});
