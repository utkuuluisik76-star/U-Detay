import * as THREE from 'three';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {wheelFaces} from './wheel-hubs.js?v=4';

const Z=new THREE.Vector3(0,0,1),UP=new THREE.Vector3(0,1,0);
function rounded(w,h,r){const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;}
function lathe(points){const g=new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),128);g.rotateX(Math.PI/2);return g;}
function treadMap(){const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d');x.fillStyle='#999';x.fillRect(0,0,1024,512);x.strokeStyle='#444';x.lineWidth=5;for(const y of[180,228,284,332]){x.beginPath();x.moveTo(0,y);x.lineTo(1024,y);x.stroke();}x.lineWidth=3;for(let i=-20;i<1044;i+=26){for(const[a,b,k]of[[153,178,11],[184,224,-9],[234,278,12],[289,328,-9],[338,359,11]]){x.beginPath();x.moveTo(i,a);x.lineTo(i+k,b);x.stroke();}}x.strokeStyle='#a8a8a8';x.lineWidth=2;for(const y of[83,90,422,429]){x.beginPath();x.moveTo(0,y);x.lineTo(1024,y);x.stroke();}x.font='600 15px Archivo,sans-serif';x.fillStyle='#aaa';x.fillText('U / GARAGE    CONCEPT',100,70);x.fillText('U / GARAGE    CONCEPT',612,70);const t=new THREE.CanvasTexture(c);t.wrapS=THREE.RepeatWrapping;return t;}
function discGeometry(){const s=new THREE.Shape();s.absarc(0,0,.196,0,Math.PI*2,false);const center=new THREE.Path();center.absarc(0,0,.055,0,Math.PI*2,true);s.holes.push(center);for(let r=0;r<3;r++){const radius=.112+r*.031,n=22+r*6;for(let i=0;i<n;i++){const a=i*Math.PI*2/n+r*.12,h=new THREE.Path();h.absarc(Math.cos(a)*radius,Math.sin(a)*radius,.0031,0,Math.PI*2,true);s.holes.push(h);}}return new THREE.ExtrudeGeometry(s,{depth:.011,bevelEnabled:false,curveSegments:3,steps:1});}
function spokeGeometry(){const s=new THREE.Shape();s.moveTo(-.025,.046);s.lineTo(-.032,.111);s.lineTo(-.070,.219);s.quadraticCurveTo(-.074,.228,-.064,.231);s.lineTo(-.052,.230);s.lineTo(-.007,.139);s.quadraticCurveTo(0,.128,.007,.139);s.lineTo(.052,.230);s.lineTo(.064,.231);s.quadraticCurveTo(.074,.228,.070,.219);s.lineTo(.032,.111);s.lineTo(.025,.046);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:.014,bevelEnabled:true,bevelSize:.0025,bevelThickness:.0025,bevelSegments:3,curveSegments:8,steps:1});const p=g.attributes.position;for(let i=0;i<p.count;i++){p.setX(i,p.getX(i)*.62);const radius=Math.hypot(p.getX(i),p.getY(i));const f=THREE.MathUtils.smoothstep(radius,.065,.235);p.setZ(i,p.getZ(i)+.041+f*.041);}g.computeVertexNormals();return g;}
function labelTexture(){const c=document.createElement('canvas');c.width=128;c.height=512;const x=c.getContext('2d');x.translate(64,256);x.rotate(-Math.PI/2);x.fillStyle='#eee';x.font='500 52px Archivo,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('PORSCHE',0,0,430);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}

export function buildCompleteWheelset(car,axles,crest,rimMaterial,caliperMaterial,renderer){
 const root=new THREE.Group();root.name='GT concept complete wheelset';car.add(root);
 const rubber=new THREE.MeshStandardMaterial({color:0x252625,roughness:.87,metalness:0,envMapIntensity:.22,bumpMap:treadMap(),bumpScale:.00055});rubber.bumpMap.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const steel=new THREE.MeshStandardMaterial({color:0x8b9294,metalness:.85,roughness:.52});
 const black=new THREE.MeshStandardMaterial({color:0x171b1b,metalness:.75,roughness:.32});
 const capMat=new THREE.MeshStandardMaterial({color:0x1c2021,metalness:.7,roughness:.3});
 const crestMat=new THREE.MeshStandardMaterial({map:crest,transparent:true,alphaTest:.1,roughness:.5,metalness:.1});
 const labelMat=new THREE.MeshStandardMaterial({map:labelTexture(),transparent:true,alphaTest:.25,roughness:.5});
 const rotor=discGeometry(),spoke=spokeGeometry(),caliper=new THREE.ExtrudeGeometry(rounded(.049,.132,.012),{depth:.043,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:3,curveSegments:8});
 const bolt=new THREE.Shape();for(let i=0;i<6;i++){const a=i*Math.PI/3;const x=Math.cos(a)*.008,y=Math.sin(a)*.008;i?bolt.lineTo(x,y):bolt.moveTo(x,y);}bolt.closePath();const socket=new THREE.Path();socket.absarc(0,0,.0034,0,Math.PI*2,true);bolt.holes.push(socket);const boltGeometry=new THREE.ExtrudeGeometry(bolt,{depth:.005,bevelEnabled:true,bevelSize:.0006,bevelThickness:.0006,bevelSegments:1,curveSegments:5});
 function mesh(group,geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=!material.transparent;m.receiveShadow=true;group.add(m);return m;}
 const data=[];
 for(const axle of axles){const tyre=axle.parent.children.find(o=>o.isMesh&&o.material?.name==='rubber');if(!tyre)continue;const position=tyre.geometry.attributes.position;
  for(const face of wheelFaces(axle)){
   let lo=Infinity,hi=-Infinity,minY=Infinity,maxY=-Infinity;const v=new THREE.Vector3();for(let i=0;i<position.count;i++){v.fromBufferAttribute(position,i).applyMatrix4(tyre.matrixWorld);if(Math.sign(v.x)!==Math.sign(face.normal.x))continue;const a=v.dot(face.normal);lo=Math.min(lo,a);hi=Math.max(hi,a);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);}
   const radius=(maxY-minY)/2,scale=radius/.307,w=THREE.MathUtils.clamp((hi-lo)/2/scale,.095,.14);
   const center=face.center.clone().addScaledVector(face.normal,(lo+hi)/2-face.center.dot(face.normal));center.y=(minY+maxY)/2;
   const wheel=new THREE.Group();wheel.position.copy(center);wheel.quaternion.setFromUnitVectors(Z,face.normal);wheel.scale.setScalar(scale);root.add(wheel);
   const treadProfile=[[.239,-w*.78],[.244,-w*.95],[.256,-w],[.277,-w*1.01],[.295,-w*.93],[.303,-w*.79],[.307,-w*.64],[.307,-w*.52],[.305,-w*.49],[.307,-w*.46],[.307,-w*.25],[.305,-w*.22],[.307,-w*.19],[.307,w*.19],[.305,w*.22],[.307,w*.25],[.307,w*.46],[.305,w*.49],[.307,w*.52],[.307,w*.64],[.303,w*.79],[.295,w*.93],[.277,w*1.01],[.256,w],[.244,w*.95],[.239,w*.78]];
   mesh(wheel,lathe(treadProfile),rubber);
   mesh(wheel,lathe([[.225,-w*.84],[.235,-w*.84],[.238,-w*.75],[.238,w*.82],[.244,w*.92],[.245,w],[.239,w*1.01],[.233,w*.89],[.228,w*.78],[.225,-w*.84]]),rimMaterial);
   mesh(wheel,new THREE.TorusGeometry(.242,.0024,8,128),rimMaterial,0,0,w*.985);
   for(let i=0;i<10;i++){const m=mesh(wheel,spoke,rimMaterial);m.rotation.z=i*Math.PI*2/10;}
   mesh(wheel,new THREE.CylinderGeometry(.076,.076,.022,64).rotateX(Math.PI/2),rimMaterial,0,0,.047);
   mesh(wheel,new THREE.CylinderGeometry(.035,.035,.008,64).rotateX(Math.PI/2),capMat,0,0,.064);
   mesh(wheel,new THREE.PlaneGeometry(.029,.038),crestMat,0,0,.0684);
   for(let i=0;i<5;i++){const a=i*Math.PI*2/5-Math.PI/2;mesh(wheel,boltGeometry,black,Math.cos(a)*.057,Math.sin(a)*.057,.060);}
   mesh(wheel,rotor,steel,0,0,-.026);mesh(wheel,rotor,steel,0,0,-.049);
   mesh(wheel,new THREE.CylinderGeometry(.067,.067,.038,48).rotateX(Math.PI/2),black,0,0,-.035);
   mesh(wheel,caliper,caliperMaterial,-.145,0,-.039);
   mesh(wheel,new THREE.PlaneGeometry(.026,.106),labelMat,-.145,0,.008);
   const valve=mesh(wheel,new THREE.CylinderGeometry(.0038,.0045,.017,10).rotateX(Math.PI/2),black,.13,-.18,.101);valve.rotation.z=.3;
   data.push({center:center.toArray(),normal:face.normal.toArray(),radius,halfWidth:w*scale});
  }
 }
 // Batch the set by material so the extra physical detail does not add a draw call for every bolt.
 root.updateMatrixWorld(true);const batches=new Map();root.traverse(o=>{if(!o.isMesh)return;const source=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();source.applyMatrix4(o.matrixWorld);const list=batches.get(o.material)||[];list.push(source);batches.set(o.material,list);});root.clear();
 for(const[material,geometries]of batches){const g=mergeGeometries(geometries,false),m=mesh(root,g,material);m.castShadow=!material.transparent;geometries.forEach(g=>g.dispose());}
 return{group:root,measurements:data};
}
