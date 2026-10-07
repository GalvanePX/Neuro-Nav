import * as THREE from './vendor/three.module.js';
// Canvas painter fallback for browsers without WebGL. Same atlas, camera and picking geometry.
export class SoftwareRenderer {
 constructor(){this.domElement=document.createElement('canvas');this.ctx=this.domElement.getContext('2d');this.ratio=1;this.software=true;this.width=1;this.height=1;}
 setPixelRatio(v){this.ratio=Math.min(v,1.5)}
 setClearColor(){}
 setSize(w,h){this.width=w;this.height=h;this.domElement.width=Math.round(w*this.ratio);this.domElement.height=Math.round(h*this.ratio);this.domElement.style.width=w+'px';this.domElement.style.height=h+'px'}
 render(scene,camera){scene.updateMatrixWorld();camera.updateMatrixWorld();const ctx=this.ctx,w=this.width,h=this.height;ctx.setTransform(this.ratio,0,0,this.ratio,0,0);ctx.clearRect(0,0,w,h);const triangles=[],proj=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),light=new THREE.Vector3(-.4,.7,-.6).normalize();
 scene.traverse(mesh=>{if(!mesh.isMesh||!mesh.visible)return;const geo=mesh.geometry,pos=geo.attributes.position,norm=geo.attributes.normal,indices=geo.index.array,mat=mesh.material;const matrix=new THREE.Matrix4().multiplyMatrices(proj,mesh.matrixWorld),e=matrix.elements,screen=new Float32Array(pos.count*3),a=pos.array;
 for(let i=0;i<pos.count;i++){const x=a[3*i],y=a[3*i+1],z=a[3*i+2],q=e[3]*x+e[7]*y+e[11]*z+e[15];screen[3*i]=(1+(e[0]*x+e[4]*y+e[8]*z+e[12])/q)*w/2;screen[3*i+1]=(1-(e[1]*x+e[5]*y+e[9]*z+e[13])/q)*h/2;screen[3*i+2]=(e[2]*x+e[6]*y+e[10]*z+e[14])/q;}
 const shades=Array.from({length:32},(_,i)=>{const c=mat.color.clone().multiplyScalar(.28+i/31*.85).add(mat.emissive.clone().multiplyScalar(mat.emissiveIntensity)).convertLinearToSRGB();return `rgb(${Math.min(255,c.r*255)|0},${Math.min(255,c.g*255)|0},${Math.min(255,c.b*255)|0})`});
 for(let i=0;i<indices.length;i+=3){const ia=indices[i]*3,ib=indices[i+1]*3,ic=indices[i+2]*3;const z=(screen[ia+2]+screen[ib+2]+screen[ic+2])/3;if(z>1||z< -1)continue;const x1=screen[ia],y1=screen[ia+1],x2=screen[ib],y2=screen[ib+1],x3=screen[ic],y3=screen[ic+1];if(Math.max(x1,x2,x3)<0||Math.min(x1,x2,x3)>w||Math.max(y1,y2,y3)<0||Math.min(y1,y2,y3)>h)continue;const n=norm.array;const dot=((n[ia]+n[ib]+n[ic])*light.x+(n[ia+1]+n[ib+1]+n[ic+1])*light.y+(n[ia+2]+n[ib+2]+n[ic+2])*light.z)/3;triangles.push({z,x1,y1,x2,y2,x3,y3,color:shades[Math.min(31,Math.max(0,Math.round(Math.max(0,dot)*31)))],alpha:mat.opacity});}});
 triangles.sort((a,b)=>b.z-a.z);for(const t of triangles){ctx.globalAlpha=t.alpha;ctx.fillStyle=t.color;ctx.beginPath();ctx.moveTo(t.x1,t.y1);ctx.lineTo(t.x2,t.y2);ctx.lineTo(t.x3,t.y3);ctx.closePath();ctx.fill();if(t.alpha===1){ctx.strokeStyle=t.color;ctx.lineWidth=.5;ctx.stroke()}}ctx.globalAlpha=1;
 // Render only the four orientation sprites created by the viewer.
 scene.traverse(s=>{if(!s.isSprite||!s.visible)return;const v=new THREE.Vector3().setFromMatrixPosition(s.matrixWorld).project(camera);ctx.drawImage(s.material.map.image,(v.x+1)*w/2-14,(1-v.y)*h/2-14,28,28)});
 }
}
