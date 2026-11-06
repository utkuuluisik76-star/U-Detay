import * as THREE from 'three';
import {wheelFaces} from './wheel-hubs.js?v=4';

export function addWheelDetails(car,axles){
 const bolts=new THREE.InstancedMesh(new THREE.CylinderGeometry(.0085,.0085,.006,6),new THREE.MeshStandardMaterial({color:0x303330,metalness:.85,roughness:.27}),20);
 const washers=new THREE.InstancedMesh(new THREE.TorusGeometry(.0103,.0015,6,20),new THREE.MeshStandardMaterial({color:0x1d2220,metalness:.8,roughness:.28}),20);
 const valves=new THREE.InstancedMesh(new THREE.CylinderGeometry(.004,.005,.018,10),new THREE.MeshStandardMaterial({color:0x171a18,roughness:.84}),4);
 const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);let bi=0,vi=0;
 for(const axle of axles)for(const {center,normal}of wheelFaces(axle)){
  const horizontal=new THREE.Vector3().crossVectors(up,normal).normalize();
  const parts=axle.parent.children.filter(o=>o.isMesh&&o.visible);
  const onSurface=position=>{const ray=new THREE.Raycaster(position.clone().addScaledVector(normal,.25),normal.clone().negate(),0,.6);const hit=ray.intersectObjects(parts,false)[0];return hit?hit.point:position;};
  for(let i=0;i<5;i++){const angle=i*Math.PI*2/5+Math.PI/2;const p=center.clone().addScaledVector(horizontal,Math.cos(angle)*.062).addScaledVector(up,Math.sin(angle)*.062);const surface=onSurface(p);dummy.position.copy(surface).addScaledVector(normal,.003);dummy.quaternion.setFromUnitVectors(up,normal);dummy.updateMatrix();bolts.setMatrixAt(bi,dummy.matrix);dummy.position.copy(surface).addScaledVector(normal,.0008);dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);dummy.updateMatrix();washers.setMatrixAt(bi,dummy.matrix);bi++;}
  const angle=-Math.PI*.65,p=center.clone().addScaledVector(horizontal,Math.cos(angle)*.213).addScaledVector(up,Math.sin(angle)*.213);dummy.position.copy(onSurface(p)).addScaledVector(normal,.008);dummy.quaternion.setFromUnitVectors(up,normal);dummy.updateMatrix();valves.setMatrixAt(vi++,dummy.matrix);
 }
 for(const m of [bolts,washers,valves]){m.instanceMatrix.needsUpdate=true;car.add(m);}
}
