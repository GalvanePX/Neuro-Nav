import * as THREE from './vendor/three.module.js';
import {SoftwareRenderer} from './software-renderer.js';
import {OrbitControls} from './vendor/OrbitControls.js';
const host=document.querySelector('#brain-canvas'),status=document.querySelector('#model-status'),deep=document.querySelector('#deep-view'),spread=document.querySelector('#brain-spread');
const colors={cortex:0xb8ccc5,cerebellum:0x728f8d,brainstem:0x9fafae,deep:0xaa91c6,ventricle:0x75c9e4,commissure:0xeee2b8};
const palette={Frontal:0x9fbad5,Parietal:0xe3c181,Temporal:0xc3a2cf,Occipital:0x84c6b1,Cingulate:0xdb9f94,Insula:0xafc780,'Deep nuclei':0xb5a0d2,'Medial temporal':0xd5a6bf,Cerebellum:0x86aba3,Brainstem:0xc1b795,Ventricles:0x75c9e4,'Commissural white matter':0xeee2b8,Unassigned:0x596965};
const mode=document.querySelector('#atlas-mode'),groupFilter=document.querySelector('#atlas-group'),isolate=document.querySelector('#isolate-structure'),ventricles=document.querySelector('#show-ventricles');
let modelMap=null;
const labelOf=d=>(d.side==='midline'?'':d.side[0].toUpperCase()+d.side.slice(1)+' ')+d.name;
function detail(){if(!selected)return;const d=selected.userData,info=window.anatomyInfo[d.key]||[d.group+' anatomical parcel.','No unique symptom-to-parcel rule is assigned to this structure.','atlas'],ref=window.anatomySources[info[2]],match=modelMap?.regions.find(r=>r.side===d.side&&r.key===d.key);
 document.querySelector('#structure-label').textContent=labelOf(d);
 document.querySelector('#structure-detail').innerHTML=`<div class="eyebrow">${d.group} · ${d.source}</div><h3>${labelOf(d)}</h3><p>${info[0]}</p><p class="detail-limit">${info[1]}</p><div class="detail-match"><strong>${match?'Candidate network component':'Anatomical inspection'}</strong><p>${match?match.why:'Selecting this structure does not add a finding or diagnose a lesion here.'}</p></div><a href="${ref[1]}" target="_blank" rel="noreferrer">${ref[0]} ↗</a>`;
}

let renderer,scene,camera,controls,meshes=[],selected=null,current=window.neuroState,dirty=true,previousLevel=null;
function draw(){dirty=true}
function resize(){if(!renderer)return;const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();draw()}
function cameraPreset(view){const poses={left:[-310,60,-15],right:[310,60,-15],front:[0,25,-315],back:[0,25,350],top:[0,330,20],reset:[-245,145,-245]};camera.up.set(0,1,0);if(view==='top')camera.up.set(0,0,1);camera.position.set(...poses[view]);controls.target.set(0,5,15);controls.update();document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));draw()}
function update(){if(!meshes.length||!current)return;
 const s=current,level=s.inspected||s.top,isInspection=level!==s.top;modelMap=window.inferAnatomy(s);const side=modelMap.side;
 if(level!==previousLevel){if(['Subcortex','Brainstem','Cerebellum'].includes(level))deep.checked=true;else if(level==='Cortex')deep.checked=false;previousLevel=level;}
 const supported=s.ids.length&&s.best>0&&s.ties.length===1&&!s.conflicts&&!modelMap.sideConflict;
 let label='No resolved localization',note='Template anatomy · no patient-specific lesion is mapped';
 if(mode.value==='atlas'){label='Anatomical atlas · colors identify regions';note='Desikan–Killiany gyral parcels and FreeSurfer segmentation · colors do not indicate disease';}
 else if(isInspection){label='Inspecting '+level;note='Anatomical inspection only · this is not the leading localization';}
 else if(s.conflicts||modelMap.sideConflict){label='Unresolved clinical contradictions';note='Detailed highlights withheld until conflicting observations are reconciled';}
 else if(supported&&level==='Cortex'){label=modelMap.regions.length?'Candidate cortical network':side?side[0].toUpperCase()+side.slice(1)+' hemispheric support':'Dominant / distributed cerebral network';note=modelMap.regions.length?'Highlighted parcels illustrate possible network components, not lesion boundaries':'Findings do not resolve individual cortical parcels';}
 else if(supported&&level==='Cerebellum'){label=(side?side[0].toUpperCase()+side.slice(1)+' cerebellar circuitry':'Cerebellar circuitry')+' · candidate';note='Hemisphere-level support including connections · no vermis or lobule boundary inferred';}
 else if(supported&&level==='Brainstem'){label='Brainstem · candidate localization';note='Midbrain, pons and medulla are not separately segmented';}
 else if(level==='Subcortex'&&s.ids.length){label='Subcortical pattern · anatomical context';note='Named nuclei are visible, but motor signs do not identify a specific nucleus or internal-capsule segment';}
 else if(!['Cortex','Brainstem','Subcortex','Cerebellum'].includes(level)&&s.ids.length){label=level+' · outside this brain model';note='No intracranial highlight is assigned';}
 if(mode.value==='clinical'&&s.ids.length&&s.ties.length>1&&!isInspection){label='Unresolved localization';note='Tied anatomical levels · no single candidate region is highlighted';}
 document.querySelector('#map-label').textContent=label;document.querySelector('#map-note').textContent=note;
 const regionIds=new Set(modelMap.regions.map(r=>r.side+'-'+r.key));
 for(const m of meshes){const d=m.userData;let active=false;
  if(mode.value==='clinical'&&!isInspection&&supported){if(level==='Cortex')active=regionIds.has(d.id);if(level==='Cerebellum'&&d.kind==='cerebellum')active=side?d.side===side:true;if(level==='Brainstem'&&d.kind==='brainstem')active=true;}
  const base=mode.value==='atlas'?(palette[d.group]||colors[d.kind]):colors[d.kind];m.material.color.setHex(active?0xb9ed77:base);
  m.material.emissive.setHex(selected===m?0x30a69f:active?0x28471a:0);m.material.emissiveIntensity=selected===m?.45:active?.18:0;
  const cortexGhost=deep.checked&&d.kind==='cortex'&&selected!==m;
  m.visible=(groupFilter.value==='all'||d.group===groupFilter.value)&&(!isolate.checked||!selected||m===selected)&&(d.kind!=='ventricle'||ventricles.checked);
  if(['deep','commissure'].includes(d.kind)&&!deep.checked&&Number(spread.value)<=20&&selected!==m&&groupFilter.value==='all')m.visible=false;
  m.material.transparent=cortexGhost;m.material.opacity=cortexGhost?.055:1;m.material.depthWrite=!cortexGhost;m.renderOrder=cortexGhost?1:0;
  m.position.x=d.kind==='cortex'?(d.side==='left'?-1:1)*Number(spread.value):0;
 }
 const legend=document.querySelector('#atlas-legend');if(legend)legend.hidden=mode.value!=='atlas';
 const regionPanel=document.querySelector('#region-links');if(regionPanel)regionPanel.innerHTML=(modelMap.regions.length?modelMap.regions.map(r=>{const m=meshes.find(m=>m.userData.id===r.side+'-'+r.key);return `<p><strong>${m?labelOf(m.userData):r.key}</strong> · ${r.why}</p>`}).join(''):'<p>The current findings do not justify individual cortical parcel highlights.</p>')+modelMap.limits.map(t=>`<p class="detail-limit">${t}</p>`).join('');
 detail();draw();
}
function inspect(mesh){selected=mesh;const d=mesh.userData;if(['deep','brainstem','cerebellum','commissure','ventricle'].includes(d.kind))deep.checked=true;if(d.kind==='ventricle')ventricles.checked=true;if(groupFilter.value!=='all'&&groupFilter.value!==d.group)groupFilter.value='all';const picker=document.querySelector('#structure-picker');if(picker)picker.value=d.id;update();}
async function start(){try{try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{renderer=new SoftwareRenderer();}renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x091b1c,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;host.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(36,1,1,1500);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.enablePan=false;controls.minDistance=175;controls.maxDistance=620;controls.addEventListener('change',draw);
scene.add(new THREE.AmbientLight(0xcbe1dc,.8));const key=new THREE.DirectionalLight(0xfff8e9,3);key.position.set(-140,230,-160);scene.add(key);const fill=new THREE.DirectionalLight(0x85becd,1.2);fill.position.set(150,50,80);scene.add(fill);const rim=new THREE.DirectionalLight(0xe1eecf,2);rim.position.set(-40,100,200);scene.add(rim);
const res=await fetch('./assets/atlas.json');if(!res.ok)throw new Error('Anatomy unavailable');const parts=await res.json();for(const part of parts){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(part.positions,3));geometry.setIndex(part.indices);if(part.normals)geometry.setAttribute('normal',new THREE.Float32BufferAttribute(part.normals,3));else geometry.computeVertexNormals();const material=new THREE.MeshStandardMaterial({color:colors[part.kind],roughness:.63,metalness:.04,side:THREE.DoubleSide});const mesh=new THREE.Mesh(geometry,material);mesh.userData=part;scene.add(mesh);meshes.push(mesh)}
// World-space orientation letters stay anchored to anatomy through orbiting.
for(const [letter,position]of [['L',[-115,0,15]],['R',[115,0,15]],['A',[0,0,-105]],['P',[0,0,130]]]){const c=document.createElement('canvas');c.width=c.height=96;const ctx=c.getContext('2d');ctx.font='500 44px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#b8cbc5';ctx.fillText(letter,48,48);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false,transparent:true}));sprite.position.set(...position);sprite.scale.set(18,18,1);scene.add(sprite)}
cameraPreset('reset');resize();new ResizeObserver(resize).observe(host);status.textContent='68 cortical parcels · 22 other structures'+(renderer.software?' · compatibility view':'');status.classList.add('ready');update();
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let startPoint;
renderer.domElement.addEventListener('pointerdown',e=>startPoint=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!startPoint||Math.hypot(e.clientX-startPoint[0],e.clientY-startPoint[1])>5)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(meshes.filter(m=>m.visible&&(!m.material.transparent||m===selected)));if(hits.length)inspect(hits[0].object)});
// Grouped selector mirrors clickable anatomy for keyboard and touch users.
const picker=document.createElement('select');picker.id='structure-picker';picker.setAttribute('aria-label','Inspect anatomical structure');
const groups=[...new Set(meshes.map(m=>m.userData.group))].filter(g=>g!=='Unassigned');
groupFilter.innerHTML='<option value="all">All structures</option>'+groups.map(g=>`<option>${g}</option>`).join('');
picker.innerHTML='<option value="">Inspect a structure…</option>'+groups.map(g=>`<optgroup label="${g}">${meshes.filter(m=>m.userData.group===g).map(m=>`<option value="${m.userData.id}">${labelOf(m.userData)}</option>`).join('')}</optgroup>`).join('');
document.querySelector('.layer-controls').prepend(picker);picker.addEventListener('change',()=>{const mesh=meshes.find(m=>m.userData.id===picker.value);if(mesh)inspect(mesh)});
const legend=document.createElement('div');legend.id='atlas-legend';legend.className='atlas-legend';legend.innerHTML=groups.map(g=>`<span><i style="background:#${(palette[g]||0x999999).toString(16).padStart(6,'0')}"></i>${g}</span>`).join('');document.querySelector('.atlas-switch').after(legend);update();
function animate(){requestAnimationFrame(animate);if(dirty){renderer.render(scene,camera);dirty=false}}animate();
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();status.textContent='3D view interrupted — reload to restore';document.querySelector('#brain-fallback').hidden=false});
}catch(error){status.textContent='3D view unavailable';document.querySelector('#brain-fallback').hidden=false;document.querySelectorAll('.brain-controls button,.brain-controls input').forEach(x=>x.disabled=true);console.error('Anatomical viewer:',error)}}
window.addEventListener('neuro-change',e=>{current=e.detail;update()});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{if(!camera)return;if(b.dataset.view==='reset'){spread.value='0';deep.checked=false;selected=null;isolate.checked=false;groupFilter.value='all';ventricles.checked=false;document.querySelector('#structure-picker').value='';document.querySelector('#structure-label').textContent='No structure selected';document.querySelector('#structure-detail').innerHTML='<h3>Choose a structure</h3>';update()}cameraPreset(b.dataset.view)}));deep.addEventListener('change',update);spread.addEventListener('input',update);
for(const [id,factor]of [['#brain-zoom-in',.85],['#brain-zoom-out',1.18]])document.querySelector(id).addEventListener('click',()=>{if(!camera)return;const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,175,620));camera.position.copy(controls.target).add(offset);controls.update();draw()});
document.querySelector('#model-info').addEventListener('click',()=>{const el=document.querySelector('#model-method');el.open=true;el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})});
for(const el of [mode,groupFilter,isolate,ventricles])el.addEventListener('change',update);
start();
