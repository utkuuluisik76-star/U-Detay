import * as THREE from 'three';
import {Reflector} from './vendor/Reflector.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

export function buildGarage(scene,renderer){
 const room=new THREE.Group();room.name='Industrial showroom';scene.add(room);
 const plaster=new THREE.MeshStandardMaterial({color:0xd2d2cb,roughness:.88});
 const black=new THREE.MeshStandardMaterial({color:0x111413,roughness:.72,metalness:.35});
 const steel=new THREE.MeshStandardMaterial({color:0x272c2a,roughness:.44,metalness:.7});
 const skirting=new THREE.MeshStandardMaterial({color:0x181d1b,roughness:.65});
 const led=new THREE.MeshBasicMaterial({color:new THREE.Color(3.2,3.3,3.1)});
 function box(w,h,d,x,y,z,material=plaster){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.receiveShadow=material!==led;room.add(m);return m;}
 const W=7.5,D=8,H=3.7;
 box(W*2,H,.16,0,H/2,-D);box(W*2,H,.16,0,H/2,D);
 box(.16,H,D*2,-W,H/2,0);box(.16,H,D*2,W,H/2,0);
 box(W*2,.10,D*2,0,H+.05,0,black);
 for(const z of [-D+.1,D-.1])box(W*2,.12,.04,0,.06,z,skirting);
 for(const x of [-W+.1,W-.1])box(.04,.12,D*2,x,.06,0,skirting);
 // Individual wall panels, vertical diffused lights, and slim dark reveals.
 const seam=new THREE.MeshStandardMaterial({color:0x9a9d96,roughness:1});
 for(const z of [-D+.09,D-.09])for(let x=-6;x<=6;x+=3){box(.014,H-.22,.006,x,H/2,z,seam);box(.045,2.65,.025,x,1.44,z+(z<0?.015:-.015),led);}
 for(const x of [-W+.09,W-.09])for(let z=-6;z<=6;z+=3){box(.006,H-.22,.014,x,H/2,z,seam);box(.025,2.65,.045,x+(x<0?.015:-.015),1.44,z,led);}
 // Corrugated black roof, I-beams, cross members and hanging strip fixtures.
 for(let z=-7.8;z<8;z+=.36)box(W*2,.045,.06,0,H-.075,z,black);
 for(let x=-6;x<=6;x+=3){box(.09,.22,D*2,x,H-.18,0,steel);box(.22,.035,D*2,x,H-.29,0,steel);}
 for(let z=-6;z<=6;z+=3)box(W*2,.10,.10,0,H-.36,z,black);
 for(const x of [-4.5,0,4.5]){
  box(.10,.065,12,x,H-.54,0,black);box(.045,.018,12,x,H-.58,0,led);
  for(const z of [-4.5,4.5])box(.012,.22,.012,x,H-.43,z,steel);
 }
 // Seeded concrete mottling: small mineral grain plus broad trowel marks.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');let seed=937;
 const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const pixels=ctx.createImageData(512,512);for(let y=0;y<512;y++)for(let x=0;x<512;x++){const v=152+Math.sin(x*.043+y*.017)*5+Math.sin(x*.013-y*.031)*7+(random()-.5)*17,i=(y*512+x)*4;pixels.data[i]=v;pixels.data[i+1]=v+1;pixels.data[i+2]=v-3;pixels.data[i+3]=255;}ctx.putImageData(pixels,0,0);
 for(let i=0;i<24;i++){ctx.strokeStyle=`rgba(70,72,67,${.012+random()*.025})`;ctx.lineWidth=1+random()*4;ctx.beginPath();ctx.ellipse(random()*512,random()*512,70+random()*140,12+random()*35,random()*3,0,Math.PI*2);ctx.stroke();}
 const concrete=new THREE.CanvasTexture(canvas);concrete.colorSpace=THREE.SRGBColorSpace;concrete.wrapS=concrete.wrapT=THREE.RepeatWrapping;concrete.repeat.set(5,5);concrete.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
 const floorMaterial=new THREE.MeshStandardMaterial({color:0xb4b7ad,map:concrete,bumpMap:concrete,bumpScale:.003,roughness:.64,metalness:.025,envMapIntensity:.35});
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,40),floorMaterial);floor.rotation.x=-Math.PI/2;floor.position.y=-.002;floor.receiveShadow=true;room.add(floor);
 const joints=new THREE.MeshBasicMaterial({color:0x777e73,transparent:true,opacity:.25});
 for(let p=-8;p<=8;p+=4){box(.008,.001,16,p,0,0,joints);box(15,.001,.008,0,0,p,joints);}
 // Batch the static room by material: keep detailed beams and strips without a draw call per part.
 room.updateMatrixWorld(true);const batches=new Map();
 for(const child of [...room.children]){if(!child.isMesh)continue;const list=batches.get(child.material)||[];list.push(child.geometry.clone().applyMatrix4(child.matrixWorld));batches.set(child.material,list);room.remove(child);}
 for(const[material,geometries]of batches){const geometry=mergeGeometries(geometries,false);const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=material!==led;room.add(mesh);geometries.forEach(g=>g.dispose());}
 const size=matchMedia('(pointer:fine)').matches?768:384;
 const mirror=new Reflector(new THREE.PlaneGeometry(30,30),{textureWidth:size,textureHeight:size,clipBias:.003,color:0x999d94,multisample:0});mirror.rotation.x=-Math.PI/2;mirror.position.y=.0004;mirror.renderOrder=-1;mirror.material.transparent=true;mirror.material.depthWrite=false;
 mirror.material.fragmentShader=mirror.material.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec2 uv=vUv.xy/vUv.w;vec4 base=texture2D(tDiffuse,uv)*0.4;
base+=texture2D(tDiffuse,uv+vec2(0.0018,0.0))*0.15;
base+=texture2D(tDiffuse,uv-vec2(0.0018,0.0))*0.15;
base+=texture2D(tDiffuse,uv+vec2(0.0,0.0018))*0.15;
base+=texture2D(tDiffuse,uv-vec2(0.0,0.0018))*0.15;`).replace('vec4( blendOverlay( base.rgb, color ), 1.0 )','vec4( blendOverlay( base.rgb, color ), 0.12 )');room.add(mirror);
 // Reflection-only softboxes emulate photographic panels without extra realtime lights.
 // Kept outside the visible garage: their shapes describe the curved bodywork.
 // Use this same room for the car's reflections, with bright ceiling panels in the IBL capture.
 const envScene=new THREE.Scene();envScene.background=new THREE.Color(0x383d38);const envRoom=room.clone(true);envRoom.remove(envRoom.children.find(m=>m.isReflector));envScene.add(envRoom);
 function softbox(w,h,position,target,power){const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(power,power*.985,power*.96),side:THREE.DoubleSide}));panel.position.set(...position);panel.lookAt(new THREE.Vector3(...target));envScene.add(panel);}
 softbox(1.2,5.2,[-3.6,2.15,.2],[0,.6,0],3.6);
 softbox(.72,4.8,[3.5,2.6,-.8],[0,.7,0],3.0);
 softbox(4.4,.65,[0,3.35,1.1],[0,.4,.8],3.8);
 softbox(2.2,1.1,[.4,2.2,-4.4],[0,.7,0],2.5);
 const ambient=new THREE.HemisphereLight(0xffffff,0x8a8d7e,2.2);envScene.add(ambient);
 const envKey=new THREE.PointLight(0xffffff,100,30,2);envKey.position.set(0,3.1,0);envScene.add(envKey);
 const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromScene(envScene,.035,.1,35,{position:new THREE.Vector3(0,.9,0)});scene.environment=env.texture;scene.environmentIntensity=.72;pmrem.dispose();
 return{floorMaterial,room,setDay(day){plaster.color.set(day?0xe3e3da:0xc6c9c2);floorMaterial.color.set(day?0xc2c5b9:0xa8afa2);}};
}
