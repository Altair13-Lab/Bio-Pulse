import * as THREE from 'three';
import type {ViewMode} from './types';
export const DEVICE_OBJ='/models/BioPulse_v2/assembly_reference.obj';
export const SOURCE_AXES={x:'width',y:'height',z:'depth',units:'mm'} as const;
export const BODY_MM={width:120,height:180,depth:80,totalHeight:250};
const material=(color:string,roughness=.7)=>new THREE.MeshStandardMaterial({color,roughness,metalness:.05});
export function prepareDevice(source:THREE.Group){
 const white=material('#f1f1e9'),green=material('#154a37'),teal=material('#34ad98',.35),pcb=material('#26704e');
 const rear=new THREE.Group();rear.name='rear-assembly';rear.userData.role='rear';source.add(rear);
 const bodyMaterials:THREE.MeshStandardMaterial[]=[];
 for(const child of [...source.children]){
  if(!(child instanceof THREE.Mesh))continue;
  const name=child.name;child.userData.sourcePart=name;
  child.material=name==='01_main_body_rounded'?green.clone():name==='02_rear_cover_rounded'||name==='08_pole_saddle_32mm'?green.clone():/shield|louver|spacer/.test(name)?white.clone():pcb.clone();
  if(name==='01_main_body_rounded'){
   const geo=child.geometry.index?child.geometry.toNonIndexed():child.geometry;child.geometry=geo;geo.clearGroups();const pos=geo.getAttribute('position');
   for(let i=0;i<pos.count;i+=3){const front=Math.max(pos.getZ(i),pos.getZ(i+1),pos.getZ(i+2))<=3.01;geo.addGroup(i,3,front?0:1);}
   const a=white.clone(),b=green.clone();child.material=[a,b];bodyMaterials.push(a,b);child.userData.role='body';
  }
  if(name==='02_rear_cover_rounded'||name==='08_pole_saddle_32mm')rear.attach(child);
 }
 const signals:{mesh:THREE.Mesh,curve:THREE.CatmullRomCurve3,phase:number}[]=[];
 const electronics=new THREE.Group();electronics.name='simplified-electronics';electronics.userData.simplified=true;source.add(electronics);
 function box(name:string,p:[number,number,number],size:[number,number,number],mat:THREE.Material,parent:THREE.Object3D=electronics){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);mesh.name=name;mesh.position.set(...p);mesh.userData.simplified=true;parent.add(mesh);return mesh;}
 function disc(name:string,p:[number,number,number],radius:number,height:number,mat:THREE.Material,axis:'z'|'y'='z',parent:THREE.Object3D=electronics){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,32),mat);mesh.name=name;mesh.position.set(...p);if(axis==='z')mesh.rotation.x=Math.PI/2;parent.add(mesh);return mesh;}
 const silver=material('#a9b9b5',.3),black=material('#112e2b',.18);
 box('ESP32 DevKit — schematic PCB',[61,77,44],[27,51,2],pcb);box('ESP32 module shield',[61,83,46],[18,23,3],silver);box('ESP32 chip',[61,62,46],[12,12,3],black.clone());
 box('ESP32-CAM — schematic PCB',[60,125,6],[28,40,2],pcb);box('camera sensor schematic',[60,125,4],[14,14,4],black);
 box('BH1750 — schematic PCB',[100,174,40],[18,2,16],pcb);disc('BH1750 optical window',[100,180.4,40],5.5,1,new THREE.MeshPhysicalMaterial({color:'#8bd7cd',roughness:.15,metalness:.15,transparent:true,opacity:.75}),'y');
 box('INMP441 — schematic PCB',[6,85,21],[2,22,16],pcb);disc('microphone acoustic port',[.4,85,21],1.1,1,black).rotation.z=Math.PI/2;
 box('BME280 — schematic PCB',[45,195,40],[18,2,14],pcb);box('BME280 sensor',[45,197,40],[5,2,5],silver);
 disc('camera lens',[60,125,-1.2],7.2,3.6,black);disc('camera glass',[60,125,-3.2],5.6,.5,new THREE.MeshPhysicalMaterial({color:'#102833',roughness:.08,metalness:.3,clearcoat:1}));
 const rim=new THREE.Mesh(new THREE.TorusGeometry(7.6,.7,8,40),silver);rim.position.set(60,125,-2);electronics.add(rim);
 [46,60,74].forEach((x,i)=>disc('LED '+i,[x,50,-.6],2.3,1.5,new THREE.MeshStandardMaterial({color:['#3da74f','#dbb33d','#c4493b'][i],emissive:['#143b18','#382b08','#360b09'][i],roughness:.35})));
 // A thin non-structural accent follows the existing front outline; source geometry stays intact.
 const shape=new THREE.Shape();shape.moveTo(10,0);shape.lineTo(110,0);shape.quadraticCurveTo(120,0,120,10);shape.lineTo(120,170);shape.quadraticCurveTo(120,180,110,180);shape.lineTo(10,180);shape.quadraticCurveTo(0,180,0,170);shape.lineTo(0,10);shape.quadraticCurveTo(0,0,10,0);
 const outline=shape.getPoints(100).map(p=>new THREE.Vector3(p.x,p.y,-.12));outline.push(outline[0]);const seam=new THREE.Line(new THREE.BufferGeometry().setFromPoints(outline),new THREE.LineBasicMaterial({color:'#25a18f'}));electronics.add(seam);
 const screw=material('#9aa8a1',.35);for(const x of [10,110])for(const y of [10,170]){disc('M3 rear cover screw',[x,y,81],2.7,1.5,screw,'z',rear);box('M3 screw slot',[x,y,82],[3,.6,.2],black,rear);}
 function wire(name:string,points:[number,number,number][],color:string,r=.55,parent:THREE.Object3D=electronics){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,40,r,6,false),material(color,.55));mesh.name=name;mesh.userData.simplified=true;parent.add(mesh);if(name.startsWith('schematic')){const dot=new THREE.Mesh(new THREE.SphereGeometry(1.6,10,8),new THREE.MeshBasicMaterial({color:'#9cffe0',transparent:true,opacity:.9}));dot.name='illustrative signal';parent.add(dot);signals.push({mesh:dot,curve,phase:signals.length*.19});}return mesh;}
 wire('schematic BME wiring',[[67,100,47],[72,140,57],[45,170,57],[45,185,40],[45,196,40]],'#ce8c4b');
 wire('schematic BH wiring',[[67,92,47],[91,120,55],[100,156,50],[100,173,40]],'#4a9cad');
 wire('schematic microphone wiring',[[54,86,47],[25,90,48],[9,85,21]],'#b6a24e');
 wire('schematic camera wiring',[[60,101,47],[60,118,27],[60,125,8]],'#9f6b8d');
 wire('schematic LED wiring',[[57,57,44],[52,47,20],[46,50,3]],'#70a85c');
 const external=new THREE.Group();external.name='external-cables-and-single-plate-probe';source.add(external);
 box('bottom USB connector',[35,-6,48],[14,12,10],black,external);wire('USB cable down',[[35,-12,48],[30,-42,50],[20,-82,62],[14,-112,65]],'#233f35',1.8,external);
 disc('bottom soil cable gland',[85,-3,48],6,6,black,'y',external);wire('soil cable bottom entry',[[85,-6,48],[90,-60,44],[148,-88,35],[190,-44,28],[190,-25,22]],'#244c3a',1.4,external);
 box('soil probe electronics',[190,-30,22],[20,23,7],green,external);box('single flat capacitive soil probe',[190,-79,22],[15,76,1.8],pcb,external);
 box('capacitive trace on single plate',[186,-81,20.9],[1,58,.2],teal,external);box('capacitive trace on same plate',[194,-81,20.9],[1,58,.2],teal,external);
 source.userData.signals=signals;source.userData.bodyMaterials=bodyMaterials;source.userData.rear=rear;source.userData.electronics=electronics;source.userData.units='mm';
 applyDeviceMode(source,'closed');return source;
}
export function applyDeviceMode(model:THREE.Group,mode:ViewMode){
 const rear=model.userData.rear as THREE.Group;rear.position.z=mode==='closed'?0:mode==='open'?72:115;rear.position.x=mode==='closed'?0:150;
 for(const mat of model.userData.bodyMaterials as THREE.MeshStandardMaterial[]){mat.transparent=mode==='exploded';mat.opacity=mode==='exploded'?.13:1;mat.depthWrite=mode!=='exploded';mat.needsUpdate=true;}
 model.userData.mode=mode;model.updateMatrixWorld(true);
}
export function disposeDevice(root:THREE.Object3D){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>{if(m instanceof THREE.MeshBasicMaterial&&m.map)m.map.dispose();m.dispose();});}

// Illustrative activity only: never driven by fabricated live readings.
export function animateDevice(model:THREE.Group,time:number,enabled:boolean){
 const pulse=.5+.5*Math.sin(time*2.4);
 model.traverse(o=>{if(o instanceof THREE.Mesh&&o.name.startsWith('LED ')){const mat=o.material as THREE.MeshStandardMaterial;const index=Number(o.name.slice(4));mat.emissiveIntensity=enabled?(index===0?1.8+pulse*3:.5):1;}});
 for(const {mesh,curve,phase} of model.userData.signals??[]){mesh.visible=enabled&&model.userData.mode!=='closed';if(mesh.visible){mesh.position.copy(curve.getPointAt((time*.18+phase)%1));}}
 const board=model.getObjectByName('ESP32 chip') as THREE.Mesh|undefined;
 if(board){const mat=board.material as THREE.MeshStandardMaterial;mat.emissive.set('#39d7a0');mat.emissiveIntensity=enabled&&model.userData.mode!=='closed'?.12+pulse*.35:0;}
}
