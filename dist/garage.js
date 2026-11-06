import {buildCompleteWheelset} from './complete-wheelset.js?v=10';
import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {DRACOLoader} from './vendor/DRACOLoader.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {buildGarage} from './industrial-garage.js?v=10';
import {refineTyres} from './realistic-tyres.js?v=6';
import {addWheelDetails} from './wheel-details.js?v=5';
import {paintWheelCrests} from './wheel-crest.js?v=4';

export async function createGarage(host,progress){
 const phase=name=>{if(performance.getEntriesByName('garage-start').length)performance.measure('garage-phase-'+name,'garage-start');};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const scene=new THREE.Scene();scene.fog=new THREE.Fog('#a4aaa0',18,40);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(pointer:fine)').matches?2:1.75));renderer.setClearColor(0x141616,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(34,1,.1,80);camera.position.set(6,2.7,6);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.09;controls.target.set(0,.65,0);controls.minDistance=3.25;controls.maxDistance=6.6;controls.maxPolarAngle=Math.PI*.49;controls.minPolarAngle=1.18;controls.autoRotateSpeed=.8;controls.enableZoom=true;renderer.domElement.style.touchAction='pan-y';
 // Native vertical scrolling stays available on touchscreens; one-finger dragging rotates horizontally.
 controls.touches.ONE=THREE.TOUCH.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_ROTATE;
 const hemi=new THREE.HemisphereLight(0xe4f0ff,0x444334,1.8);scene.add(hemi);
 const key=new THREE.DirectionalLight(0xfff3dc,4);key.position.set(2,7,3);key.castShadow=true;key.shadow.mapSize.set(1536,1536);key.shadow.camera.left=-3.6;key.shadow.camera.right=3.6;key.shadow.camera.top=3.6;key.shadow.camera.bottom=-3.6;key.shadow.camera.near=.5;key.shadow.camera.far=18;key.shadow.bias=-.00025;key.shadow.normalBias=.003;scene.add(key);
 const rim=new THREE.DirectionalLight(0xd6e5ff,2.4);rim.position.set(-5,3,-4);scene.add(rim);
 const garageRoom=buildGarage(scene,renderer);const floorMat=garageRoom.floorMaterial;phase('room');
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d');const grad=sc.createRadialGradient(64,64,15,64,64,64);grad.addColorStop(0,'rgba(0,0,0,.85)');grad.addColorStop(.55,'rgba(0,0,0,.55)');grad.addColorStop(1,'rgba(0,0,0,0)');sc.fillStyle=grad;sc.fillRect(0,0,128,128);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(2.25,4.65),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,opacity:.6}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.002;scene.add(shadow);
 const loader=new GLTFLoader();const draco=new DRACOLoader();draco.setDecoderPath('/vendor/draco/');draco.setWorkerLimit(2);loader.setDRACOLoader(draco);
 const gltf=await loader.loadAsync('/media/porsche-911.glb',e=>{if(e.total)progress('911 yükleniyor · %'+Math.round(e.loaded/e.total*100));});
 phase('model-loaded');progress('Garaj ışıkları hazırlanıyor…');draco.dispose();
 const model=gltf.scene;
 const excluded=[];model.traverse(o=>{if(o.name==='Plane'){excluded.push(o);}});excluded.forEach(o=>o.removeFromParent());
 model.rotation.y=0;
 const rawbox=new THREE.Box3().setFromObject(model),size=rawbox.getSize(new THREE.Vector3());
 const factor=4.5/Math.max(size.x,size.z);model.scale.multiplyScalar(factor);model.updateMatrixWorld(true);
 let bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3());model.position.x-=center.x;model.position.z-=center.z;model.position.y-=bounds.min.y;model.updateMatrixWorld(true);
 const car=new THREE.Group();car.add(model);scene.add(car);
 // Four compact contact patches anchor the tires to the platform, in addition to the broad chassis shadow.
 model.traverse(o=>{if(!o.isMesh||!o.material||o.material.name!=='rubber')return;const points=o.geometry.attributes.position;const halves=[new THREE.Box3(),new THREE.Box3()];const v=new THREE.Vector3();for(let i=0;i<points.count;i++){v.fromBufferAttribute(points,i).applyMatrix4(o.matrixWorld);halves[v.x<0?0:1].expandByPoint(v);}for(const b of halves){const mid=b.getCenter(new THREE.Vector3());const patch=new THREE.Mesh(new THREE.PlaneGeometry(.38,.52),new THREE.MeshBasicMaterial({map:shadow.material.map,transparent:true,depthWrite:false,opacity:.95}));patch.rotation.x=-Math.PI/2;patch.position.set(mid.x,.003,mid.z);scene.add(patch);}});
 const paint=new THREE.MeshPhysicalMaterial({name:'GaragePaint',color:0xbd2028,metalness:.3,roughness:.31,clearcoat:.8,clearcoatRoughness:.14});
 const rimMat=new THREE.MeshStandardMaterial({name:'GarageRims',color:0xb3b7ba,metalness:.84,roughness:.3});
 const brakeMat=new THREE.MeshPhysicalMaterial({color:0xb52226,metalness:.28,roughness:.32,clearcoat:.55});
 const premiumRimMat=new THREE.MeshPhysicalMaterial({name:'GT forged concept',color:0x24292d,metalness:.88,roughness:.26,clearcoat:.35,clearcoatRoughness:.17});let wheelSet;
 const headMats=[];const diagnostics=[],wheelMeshes=[],plateBounds=[];let crestSource;
 model.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const source=o.material;const names=Array.isArray(source)?source.map(x=>x.name):[source.name];o.userData.sourceMaterials=names;const box=new THREE.Box3().setFromObject(o);diagnostics.push({name:o.name,parent:o.parent?.name,materials:names,min:box.min.toArray(),max:box.max.toArray()});
   const replace=m=>{for(const t of [m.map,m.normalMap,m.roughnessMap,m.metalnessMap])if(t)t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);if(m.name==='paint')return paint;if(m.name==='logo'&&m.map)crestSource=m.map.image;if(m.name==='license'){plateBounds.push(box.clone());o.visible=false;}if(m.name==='coat'){o.castShadow=false;const c=m.clone();c.visible=false;c.depthWrite=false;c.colorWrite=false;return c;}if(m.name==='silver'&&/Cylinder/.test(o.name+' '+o.parent?.name)){wheelMeshes.push(o);return rimMat;}if(m.name==='Material.001')return brakeMat;if(m.name==='rubber'){const c=m.clone();c.metalness=0;c.roughness=.97;c.envMapIntensity=.12;if(c.normalScale)c.normalScale.set(.35,.35);return c;}if(m.name==='tex_shiny'||m.name==='lights'){const c=m.clone();if(m.name==='lights'){c.transmission=0;c.depthWrite=false;c.emissive.set('#f1f4f8');c.color.set('#d7dfe4');c.metalness=.25;c.roughness=.19;}headMats.push(c);return c;}if(m.name==='glass')return new THREE.MeshPhysicalMaterial({name:'Headlamp glazing',color:'#e1e8ec',metalness:0,roughness:.075,transparent:true,opacity:.23,depthWrite:false,clearcoat:1,clearcoatRoughness:.09,side:THREE.FrontSide});if(m.name==='window'){const c=m.clone();c.color.set('#1b252b');c.roughness=.075;c.metalness=.05;c.opacity=.83;c.clearcoat=1;c.clearcoatRoughness=.04;return c;}return m;};o.material=Array.isArray(source)?source.map(replace):replace(source);const surfaces=Array.isArray(o.material)?o.material:[o.material];for(const m of surfaces){if(m.transparent)m.depthWrite=false;}if(surfaces.every(m=>m.transparent||!m.visible))o.castShadow=false;
 });
 phase('materials');host.dataset.model=JSON.stringify({bounds:new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).toArray(),meshes:diagnostics});
 // Reuse the actual crest texture supplied with the licensed car model, upright on all four hub caps.
 if(crestSource){const c=document.createElement('canvas');c.width=256;c.height=320;const ctx=c.getContext('2d');ctx.translate(128,160);ctx.rotate(Math.PI);ctx.drawImage(crestSource,125,130,260,320,-128,-160,256,320);const pixels=ctx.getImageData(0,0,256,320);for(let i=0;i<pixels.data.length;i+=4){if(pixels.data[i]>235&&pixels.data[i+1]>235&&pixels.data[i+2]>235)pixels.data[i+3]=0;}ctx.putImageData(pixels,0,0);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);paintWheelCrests(wheelMeshes,map);addWheelDetails(car,wheelMeshes);refineTyres(car,wheelMeshes,renderer);
 const legacyExtras=car.children.filter(o=>o!==model);const sourceParts=[...new Set(wheelMeshes.flatMap(o=>o.parent.children))].filter(o=>o.isMesh);const originalVisibility=new Map(sourceParts.map(o=>[o,o.visible]));
 const replacement=buildCompleteWheelset(car,wheelMeshes,map,premiumRimMat,brakeMat,renderer);
 phase('wheels');host.dataset.wheelset=JSON.stringify(replacement.measurements);
 wheelSet={show(mode){const legacy=mode==='original';legacyExtras.forEach(o=>o.visible=legacy);sourceParts.forEach(o=>o.visible=legacy?originalVisibility.get(o):false);replacement.group.visible=!legacy;}};
}

 const plateCanvas=document.createElement('canvas');plateCanvas.width=1024;plateCanvas.height=224;const pc=plateCanvas.getContext('2d');const plateTexture=new THREE.CanvasTexture(plateCanvas);plateTexture.colorSpace=THREE.SRGBColorSpace;plateTexture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);const plateMat=new THREE.MeshStandardMaterial({map:plateTexture,roughness:.53,metalness:.05});
 for(const b of plateBounds){const center=b.getCenter(new THREE.Vector3()),sign=center.z>0?1:-1;const holder=new THREE.Mesh(new THREE.BoxGeometry(.49,.113,.014),new THREE.MeshStandardMaterial({color:0x111311,roughness:.5}));holder.position.set(center.x,center.y,sign>0?b.max.z+.005:b.min.z-.005);car.add(holder);const p=new THREE.Mesh(new THREE.PlaneGeometry(.474,.101),plateMat);p.rotation.y=sign>0?0:Math.PI;p.position.copy(holder.position);p.position.z+=sign*.008;car.add(p);}
 let lastPlate='';function updatePlate(text){const value=text||'U-LUKSSTUDYO';if(value===lastPlate)return;lastPlate=value;pc.fillStyle='#f5f5ed';pc.fillRect(0,0,1024,224);pc.strokeStyle='#181a1b';pc.lineWidth=8;pc.strokeRect(5,5,1014,214);pc.fillStyle='#123e94';pc.fillRect(12,12,93,200);pc.fillStyle='#fff';pc.textAlign='center';pc.font='bold 44px Archivo, sans-serif';pc.fillText('TR',58,182);pc.fillStyle='#111214';pc.font='750 133px Archivo, sans-serif';pc.textBaseline='middle';pc.fillText(value,558,123,840);plateTexture.needsUpdate=true;}
 // Additional aero is original concept geometry, explicitly labelled in the interface.
 const aero=new THREE.Group();car.add(aero);
 const carbon=new THREE.MeshStandardMaterial({color:0x101313,metalness:.5,roughness:.3});
 const spoiler=new THREE.Group();aero.add(spoiler);
 const wingProfile=new THREE.Shape();wingProfile.moveTo(-.17,0);wingProfile.bezierCurveTo(-.11,.035,.10,.045,.17,.025);wingProfile.lineTo(.17,.005);wingProfile.bezierCurveTo(.05,-.008,-.10,-.012,-.17,0);const wingGeometry=new THREE.ExtrudeGeometry(wingProfile,{depth:1.65,steps:1,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:2});const wing=new THREE.Mesh(wingGeometry,carbon);wing.rotation.y=Math.PI/2;wing.position.set(-.825,1.18,-1.62);spoiler.add(wing);
 for(const x of [-.55,.55]){const support=new THREE.Mesh(new THREE.BoxGeometry(.022,.41,.11),carbon);support.position.set(x,.97,-1.62);support.rotation.x=-.15;spoiler.add(support);}for(const x of [-.84,.84]){const end=new THREE.Mesh(new THREE.BoxGeometry(.016,.13,.36),carbon);end.position.set(x,1.21,-1.62);spoiler.add(end);}
 const lipShape=new THREE.Shape();lipShape.moveTo(-.83,-1.95);lipShape.bezierCurveTo(-.78,-2.12,-.45,-2.285,0,-2.29);lipShape.bezierCurveTo(.45,-2.285,.78,-2.12,.83,-1.95);lipShape.lineTo(.74,-1.95);lipShape.bezierCurveTo(.65,-2.09,.4,-2.18,0,-2.19);lipShape.bezierCurveTo(-.4,-2.18,-.65,-2.09,-.74,-1.95);lipShape.closePath();const splitter=new THREE.Mesh(new THREE.ExtrudeGeometry(lipShape,{depth:.025,bevelEnabled:true,bevelThickness:.004,bevelSize:.004,bevelSegments:2,steps:1}),carbon);splitter.rotation.x=-Math.PI/2;splitter.position.y=.125;aero.add(splitter);
 let currentView='front',previousAspect=0;
 function isWheelView(){return ['wheel','rearwheel','leftwheel','leftrearwheel'].includes(currentView);}
 function cameraLimits(travelling=false){const wheel=isWheelView();controls.minDistance=wheel?1.15:3.25;controls.maxDistance=wheel&&!travelling?3.5:6.6;controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;if(wheel&&!travelling){const left=currentView.startsWith('left');controls.minAzimuthAngle=left?-Math.PI*.82:Math.PI*.18;controls.maxAzimuthAngle=left?-Math.PI*.18:Math.PI*.82;}}
 function keepInsideRoom(){camera.position.x=THREE.MathUtils.clamp(camera.position.x,-6.85,6.85);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-7.3,7.3);camera.position.y=THREE.MathUtils.clamp(camera.position.y,.22,3.25);}
 function cameraFov(){camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(34)/2)/Math.min(1,Math.max(camera.aspect,.55)/1.25)));}
 let targetCam=null,targetFocus=null,frames=0,running=false,lastTime=0,auto=false,day=false,firstFrame=true,warming=true;
 function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;cameraFov();camera.updateProjectionMatrix();if(previousAspect&&Math.abs(camera.aspect-previousAspect)>.05)view(currentView);previousAspect=camera.aspect;invalidate(8);}
 function render(t){running=false;if(document.hidden||warming)return;if(t-lastTime<1000/45){invalidate();return;}lastTime=t;
  if(targetCam&&targetFocus){
   // Travel around the body at a safe radius before approaching a wheel.
   // Cartesian interpolation between opposite views cuts straight through the car.
   const from=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
   const to=new THREE.Spherical().setFromVector3(targetCam.clone().sub(targetFocus));
   const turn=Math.atan2(Math.sin(to.theta-from.theta),Math.cos(to.theta-from.theta));
   const step=reduced.matches?1:.09;
   from.theta+=turn*step;from.phi=THREE.MathUtils.lerp(from.phi,to.phi,step);
   const travelRadius=Math.abs(turn)>.10?Math.max(3.25,to.radius):to.radius;
   from.radius=THREE.MathUtils.lerp(from.radius,travelRadius,step);
   controls.target.lerp(targetFocus,step);camera.position.copy(new THREE.Vector3().setFromSpherical(from).add(controls.target));
   if(Math.abs(turn)<.008&&Math.abs(from.radius-to.radius)<.015&&controls.target.distanceTo(targetFocus)<.008){camera.position.copy(targetCam);controls.target.copy(targetFocus);targetCam=null;targetFocus=null;cameraLimits();}
  }
  controls.update();keepInsideRoom();camera.lookAt(controls.target);renderer.render(scene,camera);if(firstFrame){firstFrame=false;if(performance.getEntriesByName('garage-start').length)performance.measure('garage-first-frame-time','garage-start');}
  if(auto||targetCam||targetFocus||frames-->0)invalidate();
 }
 function invalidate(n=1){frames=Math.max(frames,n);if(!running){running=true;requestAnimationFrame(render);}}
 controls.addEventListener('change',()=>invalidate(2));controls.addEventListener('start',()=>{targetCam=null;targetFocus=null;cameraLimits();invalidate(90);});controls.addEventListener('end',()=>invalidate(40));
 const ro=new ResizeObserver(resize);ro.observe(host);document.addEventListener('visibilitychange',()=>{if(!document.hidden)invalidate(4);});
 host.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key))return;e.preventDefault();const offset=camera.position.clone().sub(controls.target);const s=new THREE.Spherical().setFromVector3(offset);if(e.key==='ArrowLeft')s.theta-=.12;if(e.key==='ArrowRight')s.theta+=.12;if(e.key==='ArrowUp')s.phi=Math.max(controls.minPolarAngle,s.phi-.08);if(e.key==='ArrowDown')s.phi=Math.min(Math.PI*.49,s.phi+.08);if(e.key==='+')s.radius=Math.max(controls.minDistance,s.radius-.5);if(e.key==='-')s.radius=Math.min(controls.maxDistance,s.radius+.5);camera.position.copy(new THREE.Vector3().setFromSpherical(s).add(controls.target));invalidate(5);});
 function view(id){currentView=id;cameraLimits(true);document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===id)));targetFocus=new THREE.Vector3(0,.75,0);if(['wheel','rearwheel','leftwheel','leftrearwheel'].includes(id)){const rear=id.includes('rear'),side=id.startsWith('left')?-1:1;targetFocus.set((rear?.82:.88)*side,.31,rear?-.96:1.32);targetCam=new THREE.Vector3(2.5*side,.73,rear?-1.65:2.02);}else{const distance=Math.min(6.6,Math.max(5.8,6.2/Math.max(camera.aspect,.6)));const map={front:[.64,.10,.74],side:[1,.09,.02],rear:[-.64,.10,-.74]};targetCam=new THREE.Vector3(...map[id]).normalize().multiplyScalar(distance).add(targetFocus);}invalidate(100);}
 resize();view('front');
 return{
  async warmup(){const visible=new THREE.Group();scene.traverseVisible(o=>{if(!o.isMesh)return;const materials=Array.isArray(o.material)?o.material:[o.material];if(materials.every(m=>!m.visible))return;const proxy=new THREE.Mesh(o.geometry,o.material);proxy.receiveShadow=o.receiveShadow;proxy.castShadow=o.castShadow;visible.add(proxy);});try{await renderer.compileAsync(visible,camera,scene);phase('shaders');}finally{visible.clear();warming=false;invalidate(8);}},
  apply(s){paint.color.set({red:'#bd2028',chalk:'#b9b5a8',black:'#14191b',silver:'#a3a9ad',green:'#244e3e',blue:'#244b7c'}[s.paint]);paint.metalness=.3;paint.roughness=s.finish==='satin'?.39:.23;paint.clearcoat=s.finish==='satin'?.22:1;paint.clearcoatRoughness=s.finish==='satin'?.27:.085;paint.envMapIntensity=.9;rimMat.color.set({silver:'#b3b7ba',black:'#232626',bronze:'#917047'}[s.wheels]);premiumRimMat.color.copy(rimMat.color);premiumRimMat.metalness=s.wheels==='black'?.55:.88;premiumRimMat.roughness=s.wheels==='black'?.36:.3;premiumRimMat.clearcoat=.18;premiumRimMat.envMapIntensity=.75;wheelSet?.show(s.wheelDesign);brakeMat.color.set({red:'#b52226',yellow:'#d9ac26',black:'#252a28'}[s.caliper]||'#b52226');spoiler.visible=s.aero==='track';splitter.visible=s.frontLip===true;headMats.forEach(m=>{m.emissiveIntensity=s.lights?.8:0;});updatePlate(s.plate);day=s.light==='day';garageRoom.setDay(day);scene.fog.color.set(day?0xc7cdc2:0xa4aaa0);renderer.toneMappingExposure=day?1.05:.86;hemi.intensity=day?1.5:1.0;key.intensity=day?2.4:1.9;rim.intensity=day?1.3:.95;host.style.background='#a4aaa0';invalidate(8);},
  view,rotate(on){auto=on;controls.autoRotate=on;invalidate(4);},
  async capture({width=1080,height=660,fit=false}={}){const was=controls.autoRotate;controls.autoRotate=false;const originalSize=renderer.getSize(new THREE.Vector2()),ratio=renderer.getPixelRatio(),aspect=camera.aspect,position=camera.position.clone();renderer.setPixelRatio(1);renderer.setSize(width,height,false);camera.aspect=width/height;if(fit){const distance=Math.min(6.6,Math.max(5.8,6.2/camera.aspect));camera.position.sub(controls.target).normalize().multiplyScalar(distance).add(controls.target);camera.lookAt(controls.target);}camera.updateProjectionMatrix();renderer.render(scene,camera);const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d');c.fillStyle=day?'#666b64':'#141616';c.fillRect(0,0,width,height);c.drawImage(renderer.domElement,0,0);renderer.setPixelRatio(ratio);renderer.setSize(originalSize.x,originalSize.y,false);camera.aspect=aspect;camera.position.copy(position);camera.lookAt(controls.target);camera.updateProjectionMatrix();controls.autoRotate=was;invalidate(8);return canvas;}
 };
}
