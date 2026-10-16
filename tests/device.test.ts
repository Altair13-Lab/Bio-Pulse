import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import * as THREE from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {prepareDevice,applyDeviceMode,disposeDevice,BODY_MM,DEVICE_OBJ} from '../src/lib/device-model.ts';
const obj=()=>new OBJLoader().parse(readFileSync(path.join(process.cwd(),'public',DEVICE_OBJ),'utf8'));
const bounds=(o:THREE.Object3D)=>{o.updateMatrixWorld(true);return new THREE.Box3().setFromObject(o);};
test('provided assembly uses X width, Y height, Z depth in mm; rear cover closes at 80 mm',()=>{
 const source=obj(),body=source.getObjectByName('01_main_body_rounded')!,cover=source.getObjectByName('02_rear_cover_rounded')!;
 assert.deepEqual(bounds(body).getSize(new THREE.Vector3()).toArray().map(Math.round),[BODY_MM.width,BODY_MM.height,77]);
 assert.equal(bounds(cover).max.z,BODY_MM.depth);assert.equal(bounds(source).max.y,BODY_MM.totalHeight);
 const shield=bounds(source.getObjectByName('03c_round_shield_cap')!);assert.deepEqual(shield.getSize(new THREE.Vector3()).toArray().map(Math.round),[86,5,86]);disposeDevice(source);
});
test('opening moves only the rear assembly; shield and main body stay fixed; component view is explicitly simplified',()=>{
 const model=prepareDevice(obj());const body=model.getObjectByName('01_main_body_rounded')!,shield=model.getObjectByName('03c_round_shield_cap')!,cover=model.getObjectByName('02_rear_cover_rounded')!;
 const a=bounds(body),b=bounds(shield),c=bounds(cover);applyDeviceMode(model,'open');
 assert(bounds(body).equals(a));assert(bounds(shield).equals(b));assert.equal(bounds(cover).min.z,c.min.z+72);
 applyDeviceMode(model,'exploded');assert(bounds(shield).equals(b));assert.equal((model.userData.rear as THREE.Group).position.z,115);
 assert.equal(model.getObjectByName('simplified-electronics')!.userData.simplified,true);
 const probe=model.getObjectByName('single flat capacitive soil probe') as THREE.Mesh;
 assert.deepEqual(bounds(probe).getSize(new THREE.Vector3()).toArray().map(v=>Math.round(v*10)/10),[15,76,1.8]);
 applyDeviceMode(model,'closed');assert(bounds(cover).equals(c));disposeDevice(model);
});
test('imported OBJ, images and full STL set exist; wrong horizontal GLB is not packaged',()=>{
 const pub=path.join(process.cwd(),'public');for(const f of ['images/BioPulse_Tusti.png','images/BioPulse_Ortada.png','models/BioPulse_v2/assembly_positions.json','models/BioPulse_v2/STL/02_rear_cover_rounded.stl','materials/BioPulse_v2_sources.zip'])assert(existsSync(path.join(pub,f)));
 assert(!existsSync(path.join(pub,'models/BioPulse_Assembly.glb')));
 const provenance=JSON.parse(readFileSync(path.join(pub,'models/BioPulse_v2/provenance.json'),'utf8'));
 for(const [file,sha] of Object.entries(provenance.sha256))assert.equal(createHash('sha256').update(readFileSync(path.join(pub,'models/BioPulse_v2',file))).digest('hex'),sha);
});
