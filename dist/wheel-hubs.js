import * as THREE from 'three';

// Each imported axle contains two wheels, and the front wheels are steered.
// Fit the outward face of each wheel separately instead of using the axle's shared bounding box.
export function wheelFaces(mesh){
 const positions=mesh.geometry.attributes.position,normals=mesh.geometry.attributes.normal;
 const normalMatrix=new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
 const sides=[[],[]],v=new THREE.Vector3(),n=new THREE.Vector3();
 for(let i=0;i<positions.count;i++){v.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);n.fromBufferAttribute(normals,i).applyMatrix3(normalMatrix).normalize();sides[v.x<0?0:1].push({p:v.clone(),n:n.clone()});}
 return sides.map((vertices,index)=>{
  const sign=index?1:-1,bins=new Map();
  for(const {n}of vertices){if(n.x*sign<.8||Math.abs(n.y)>.05)continue;const angle=Math.atan2(n.z,n.x),key=Math.round(angle/.025);const bin=bins.get(key)||{count:0,normal:new THREE.Vector3()};bin.count++;bin.normal.add(n);bins.set(key,bin);}
  const best=[...bins.values()].sort((a,b)=>b.count-a.count)[0];
  const normal=best?best.normal.normalize():new THREE.Vector3(sign,0,0);
  normal.y=0;normal.normalize();const tangent=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),normal).normalize();
  let minT=Infinity,maxT=-Infinity,minY=Infinity,maxY=-Infinity,maxN=-Infinity;
  for(const {p}of vertices){const t=p.dot(tangent);minT=Math.min(minT,t);maxT=Math.max(maxT,t);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);maxN=Math.max(maxN,p.dot(normal));}
  const center=tangent.clone().multiplyScalar((minT+maxT)/2).addScaledVector(normal,maxN);center.y=(minY+maxY)/2;
  // The hub is recessed relative to the rim lip. Mount on the actual center-cap surface,
  // not on the outer rim plane, which shifts the emblem in perspective views.
  const ray=new THREE.Raycaster(center.clone().addScaledVector(normal,.4),normal.clone().negate(),0,.75);
  const wheelParts=mesh.parent.children.filter(o=>o.isMesh&&o.visible&&o.material?.name!=='rubber');
  const hits=ray.intersectObjects(wheelParts,false);
  if(hits.length)center.copy(hits[0].point);
  return{center,normal};
 });
}
