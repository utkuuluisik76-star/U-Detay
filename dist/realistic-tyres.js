import * as THREE from 'three';
import {wheelFaces} from './wheel-hubs.js?v=4';

export function refineTyres(car,axles,renderer){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const c=canvas.getContext('2d');
 c.fillStyle='#929292';c.fillRect(0,0,1024,256);
 c.strokeStyle='#a2a2a2';c.lineWidth=1;for(const y of [43,48,208,213]){c.beginPath();c.moveTo(0,y);c.lineTo(1024,y);c.stroke();}
 c.font='700 11px Archivo, sans-serif';c.fillStyle='#a4a4a4';c.fillText('U / GARAGE   ·   CONCEPT',80,35);c.fillText('U / GARAGE   ·   CONCEPT',592,35);
 c.strokeStyle='#353535';c.lineWidth=4;
 for(const y of [79,107,149,177]){c.beginPath();c.moveTo(0,y);c.lineTo(1024,y);c.stroke();}
 c.lineWidth=2.4;c.strokeStyle='#505050';
 for(let x=-32;x<1056;x+=32){for(const[ya,yb,dx]of[[56,78,11],[81,105,-8],[109,147,9],[151,175,-8],[179,200,11]]){c.beginPath();c.moveTo(x,ya);c.lineTo(x+dx,yb);c.stroke();}}
 const tread=new THREE.CanvasTexture(canvas);tread.wrapS=THREE.RepeatWrapping;tread.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
 const rubber=new THREE.MeshStandardMaterial({color:0x1b1d1b,metalness:0,roughness:.84,envMapIntensity:.38,bumpMap:tread,bumpScale:.0012});
 const up=new THREE.Vector3(0,1,0),point=new THREE.Vector3();const results=[];
 for(const axle of axles){
  const original=axle.parent.children.find(o=>o.isMesh&&o.material?.name==='rubber');if(!original)continue;
  const vertices=original.geometry.attributes.position;
  for(const face of wheelFaces(axle)){
   const sign=Math.sign(face.normal.x),normal=face.normal;
   let min=Infinity,max=-Infinity,minY=Infinity,maxY=-Infinity;
   for(let i=0;i<vertices.count;i++){point.fromBufferAttribute(vertices,i).applyMatrix4(original.matrixWorld);if(Math.sign(point.x)!==sign)continue;const d=point.dot(normal);min=Math.min(min,d);max=Math.max(max,d);minY=Math.min(minY,point.y);maxY=Math.max(maxY,point.y);}
   const radius=(maxY-minY)/2,halfWidth=(max-min)/2;
   const center=face.center.clone().addScaledVector(normal,(min+max)/2-face.center.dot(normal));center.y=(maxY+minY)/2;
   // A continuous rounded sidewall and shoulder replace the faceted low-poly source tires.
   const profile=[ [.79,-.77],[.80,-.92],[.83,-.99],[.88,-1.02],[.93,-.98],[.975,-.87],[.994,-.67],[1,-.44],[1,-.14],[1,.14],[1,.44],[.994,.67],[.975,.87],[.93,.98],[.88,1.02],[.83,.99],[.80,.92],[.79,.77] ].map(([r,w])=>new THREE.Vector2(r*radius,w*halfWidth));
   const mesh=new THREE.Mesh(new THREE.LatheGeometry(profile,128),rubber);mesh.quaternion.setFromUnitVectors(up,normal);mesh.position.copy(center);mesh.castShadow=true;mesh.receiveShadow=true;car.add(mesh);results.push(mesh);
  }
  original.visible=false;
 }
 return results;
}
