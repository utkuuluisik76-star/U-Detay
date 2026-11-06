import * as THREE from 'three';
import {wheelFaces} from './wheel-hubs.js?v=4';

// Paint the emblem into the existing wheel surface. No extra floating badge geometry.
export function paintWheelCrests(axles,texture){
 const hubs=axles.flatMap(mesh=>wheelFaces(mesh));
 const centers=hubs.map(h=>h.center),normals=hubs.map(h=>h.normal);
 const patched=new Set();
 for(const axle of axles)for(const part of axle.parent.children){
  if(!part.isMesh||!['GarageRims','plastic'].includes(part.material?.name))continue;
  if(patched.has(part))continue;patched.add(part);
  const material=part.material.name==='GarageRims'?part.material:part.material.clone();
  material.onBeforeCompile=shader=>{
   shader.uniforms.hubCrest={value:texture};shader.uniforms.hubCenters={value:centers};shader.uniforms.hubNormals={value:normals};
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vHubWorld;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvHubWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vHubWorld;
uniform sampler2D hubCrest;
uniform vec3 hubCenters[4];
uniform vec3 hubNormals[4];`).replace('#include <color_fragment>',`#include <color_fragment>
for(int h=0;h<4;h++){
 vec3 rel=vHubWorld-hubCenters[h];
 vec3 horizontal=normalize(cross(vec3(0.0,1.0,0.0),hubNormals[h]));
 float tangential=dot(rel,horizontal);
 float radius=length(vec2(tangential,rel.y));
 float depth=dot(rel,hubNormals[h]);
 // Recessed disc surfaces keep a neutral machined-steel finish when the rim changes colour.
 if(depth < -0.026 && depth > -0.14 && radius>0.075 && radius<0.22){
  float angle=atan(rel.y,tangential);
  float grain=sin(radius*5600.0)*0.025+sin(radius*2100.0)*0.012;
  vec3 steel=vec3(0.31+grain,0.32+grain,0.30+grain);
  float hole=1.0;
  for(int ring=0;ring<3;ring++){
   float rr=0.122+float(ring)*0.032;
   float steps=18.0+float(ring)*6.0;
   float theta=6.2831853/steps;
   float nearest=floor((angle+float(ring)*0.09)/theta+0.5)*theta-float(ring)*0.09;
   float dist=length(vec2(tangential,rel.y)-vec2(cos(nearest),sin(nearest))*rr);
   hole*=smoothstep(0.0028,0.0041,dist);
  }
  diffuseColor.rgb=mix(vec3(0.025),steel,hole);
 }
 vec2 uv=vec2(tangential/0.034+0.5,rel.y/0.043+0.5);
 if(abs(dot(rel,hubNormals[h]))<0.018 && uv.x>=0.0 && uv.x<=1.0 && uv.y>=0.0 && uv.y<=1.0){
  vec4 crest=texture2D(hubCrest,uv);
  diffuseColor.rgb=mix(diffuseColor.rgb,crest.rgb,crest.a);
 }
}`);
  };
  material.customProgramCacheKey=()=> 'wheel-crest-surface-v4';
  part.material=material;material.needsUpdate=true;
 }
}
