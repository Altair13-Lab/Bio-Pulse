import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Minus,Plus,RotateCcw,RotateCw,MoveHorizontal,Info} from 'lucide-react';
import {useI18n} from '../i18n';
import type {ViewMode} from '../lib/types';
import {DEVICE_OBJ,prepareDevice,applyDeviceMode,disposeDevice,animateDevice} from '../lib/device-model';
import s from '../App.module.css';
type Handle={reset:()=>void;turn:(angle:number)=>void;zoom:(factor:number)=>void;mode:(m:ViewMode)=>void};
export function Station({mode='closed'}:{mode?:ViewMode}){
 const {t}=useI18n();const host=useRef<HTMLDivElement>(null),handle=useRef<Handle|null>(null),currentMode=useRef(mode);currentMode.current=mode;
 const [animated,setAnimated]=useState(true);const activity=useRef(true);activity.current=animated;
 const [state,setState]=useState<'loading'|'ready'|'failed'>('loading');
 useEffect(()=>{
  const element=host.current!;let stopped=false,model:THREE.Group|undefined,renderer:THREE.WebGLRenderer|undefined,controls:OrbitControls|undefined,observer:ResizeObserver|undefined;
  let frame=0,lastFrame=0;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const abort=new AbortController();const timer=setTimeout(()=>{abort.abort();if(!stopped)setState('failed');},15000);
  let scene:THREE.Scene;
  const fail=()=>{if(!stopped)setState('failed');};
  try{
   renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor('#eef3e6',0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
   const canvas=renderer.domElement;element.append(canvas);canvas.tabIndex=0;canvas.dataset.viewer='biopulse-v2';
   scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(38,1,.01,100);controls=new OrbitControls(camera,canvas);controls.enablePan=false;controls.minDistance=3.4;controls.maxDistance=12;controls.enableDamping=false;controls.target.set(0,0,0);
   scene.add(new THREE.HemisphereLight('#fffdf6','#6b8d78',1.7));const light=new THREE.DirectionalLight('#ffffff',2.5);light.position.set(3,5,4);scene.add(light);const back=new THREE.DirectionalLight('#b8dacf',2);back.position.set(-3,2,-4);scene.add(back);
   const render=()=>{if(stopped||!renderer)return;renderer.render(scene,camera);canvas.dataset.camera=camera.position.toArray().map(n=>n.toFixed(3)).join(',');if(model){canvas.dataset.mode=String(model.userData.mode);canvas.dataset.rearOffset=String((model.userData.rear as THREE.Group).position.z);}};
   const reset=()=>{camera.position.set(4,1.5,currentMode.current==='closed'?6:-6.5);controls!.target.set(0,0,0);controls!.update();render();};
   const turn=(angle:number)=>{const p=camera.position.clone().sub(controls!.target);p.applyAxisAngle(new THREE.Vector3(0,1,0),angle);camera.position.copy(p.add(controls!.target));controls!.update();render();};
   const zoom=(factor:number)=>{const p=camera.position.clone().sub(controls!.target);p.multiplyScalar(factor).clampLength(controls!.minDistance,controls!.maxDistance);camera.position.copy(p.add(controls!.target));controls!.update();render();};
   handle.current={reset,turn,zoom,mode:(m)=>{if(model){applyDeviceMode(model,m);reset();}}};
   const resize=()=>{const width=element.clientWidth,height=element.clientHeight;if(!width||!height)return;renderer!.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();render();};
   observer=new ResizeObserver(resize);observer.observe(element);controls.addEventListener('change',render);reset();resize();
   const lost=(event:Event)=>{event.preventDefault();fail();};canvas.addEventListener('webglcontextlost',lost);
   canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home')reset();else if(e.key==='ArrowLeft'||e.key==='ArrowRight')turn(e.key==='ArrowLeft'?-.15:.15);else zoom(['+','=','ArrowUp'].includes(e.key)?.88:1.12);};
   fetch(DEVICE_OBJ,{signal:abort.signal}).then(async response=>{if(!response.ok)throw new Error('OBJ unavailable');return response.text();}).then(text=>{
    if(stopped)return;clearTimeout(timer);const parsed=new OBJLoader().parse(text);
    if(!parsed.getObjectByName('01_main_body_rounded')||!parsed.getObjectByName('02_rear_cover_rounded'))throw new Error('Unexpected assembly');
    model=prepareDevice(parsed);model.scale.set(.01,.01,-.01);model.position.set(-1.05,-.7,.4);scene.add(model);
    const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=128;const ctx=labelCanvas.getContext('2d');if(ctx){ctx.clearRect(0,0,512,128);ctx.fillStyle='#174737';ctx.font='48px Arial';ctx.textAlign='center';ctx.fillText('BioPulse',256,82);const map=new THREE.CanvasTexture(labelCanvas);const label=new THREE.Mesh(new THREE.PlaneGeometry(40,10),new THREE.MeshBasicMaterial({map,transparent:true,side:THREE.DoubleSide,depthWrite:false}));label.rotation.y=0;label.position.set(60,83,-.35);(model.userData.electronics as THREE.Group).add(label);}
    applyDeviceMode(model,currentMode.current);reset();resize();setState('ready');
    const tick=(now:number)=>{if(stopped)return;frame=requestAnimationFrame(tick);if(now-lastFrame<40||document.hidden)return;lastFrame=now;const active=activity.current&&!reduced.matches;animateDevice(model!,now/1000,active);if(active||canvas.dataset.activity!=='paused'){render();canvas.dataset.activity=active?'playing':'paused';}};frame=requestAnimationFrame(tick);
   }).catch(fail);
  }catch{clearTimeout(timer);fail();}
  return()=>{stopped=true;cancelAnimationFrame(frame);clearTimeout(timer);abort.abort();observer?.disconnect();controls?.dispose();handle.current=null;if(model)disposeDevice(model);if(renderer){renderer.dispose();renderer.domElement.remove();}};
 },[]);
 useEffect(()=>{handle.current?.mode(mode);},[mode]);
 useEffect(()=>{const canvas=host.current?.querySelector('canvas');if(canvas)canvas.setAttribute('aria-label',t('device.viewerAlt'));},[t,state]);
 return <div className={s.station}><div ref={host} className={s.deviceCanvas} hidden={state==='failed'}/>{state==='loading'&&<p className={s.viewerStatus} role="status">{t('device.loading')}</p>}{state==='failed'&&<div className={s.viewerFallback}><img src="/images/BioPulse_Tusti.png" alt={t('home.figureAlt')}/><p role="status"><Info size={17}/>{t('device.unavailable')}</p></div>}{state==='ready'&&<><p className={s.activityNote}><span className={animated?s.activityDot:undefined}/>{t('device.activity')}<button aria-pressed={animated} onClick={()=>setAnimated(v=>!v)}>{t(animated?'device.pauseActivity':'device.playActivity')}</button></p><div className={s.stationTools}><button onClick={()=>handle.current?.turn(-.2)} aria-label={t('construction.rotateLeft')}><RotateCcw size={17}/></button><button onClick={()=>handle.current?.turn(.2)} aria-label={t('construction.rotateRight')}><RotateCw size={17}/></button><span/><button onClick={()=>handle.current?.zoom(1.12)} aria-label={t('construction.zoomOut')}><Minus size={17}/></button><button onClick={()=>handle.current?.zoom(.88)} aria-label={t('construction.zoomIn')}><Plus size={17}/></button><button onClick={()=>handle.current?.reset()} aria-label={t('construction.reset')}><MoveHorizontal size={17}/></button></div><p className={s.smallMuted}>{t('construction.hint')}</p></>}<p className={s.deviceDisclaimer}>{t('device.simplified')}</p></div>;
}
