"""Derive cortical parcels with exact spherical vertex correspondence and additional aseg structures."""
from pathlib import Path
import json, hashlib, urllib.request
import numpy as np
import nibabel as nib
from scipy.spatial import cKDTree
from scipy.ndimage import gaussian_filter
from skimage.measure import marching_cubes
cache=Path('/tmp/neuro-atlas');cache.mkdir(exist_ok=True)
base='https://raw.githubusercontent.com/mne-tools/mne-testing-data/master/subjects/fsaverage/'
files={**{'label_'+h+'.aparc.annot':base+'label/'+h+'.aparc.annot' for h in ['lh','rh']},**{h+'.sphere':base+'surf/'+h+'.sphere' for h in ['lh','rh']},'mri_aseg.mgz':base+'mri/aseg.mgz',**{'sphere_'+s+'.gii.gz':'https://raw.githubusercontent.com/nilearn/nilearn/main/nilearn/datasets/data/fsaverage5/sphere_'+s+'.gii.gz' for s in ['left','right']}}
for name,url in files.items():
 if not (cache/name).exists():urllib.request.urlretrieve(url,cache/name)
path=Path('dist/assets/brain.json');old=json.loads(path.read_text());parts=[];audit={}
labels={
'bankssts':('Banks of superior temporal sulcus','Temporal'),
'caudalanteriorcingulate':('Caudal anterior cingulate','Cingulate'),
'caudalmiddlefrontal':('Caudal middle frontal gyrus','Frontal'),
'cuneus':('Cuneus','Occipital'),'entorhinal':('Entorhinal cortex','Temporal'),
'fusiform':('Fusiform gyrus','Temporal'),'inferiorparietal':('Inferior parietal lobule','Parietal'),
'inferiortemporal':('Inferior temporal gyrus','Temporal'),'isthmuscingulate':('Isthmus of cingulate','Cingulate'),
'lateraloccipital':('Lateral occipital cortex','Occipital'),'lateralorbitofrontal':('Lateral orbitofrontal cortex','Frontal'),
'lingual':('Lingual gyrus','Occipital'),'medialorbitofrontal':('Medial orbitofrontal cortex','Frontal'),
'middletemporal':('Middle temporal gyrus','Temporal'),'parahippocampal':('Parahippocampal gyrus','Temporal'),
'paracentral':('Paracentral lobule','Frontal'),'parsopercularis':('Inferior frontal gyrus · pars opercularis','Frontal'),
'parsorbitalis':('Inferior frontal gyrus · pars orbitalis','Frontal'),'parstriangularis':('Inferior frontal gyrus · pars triangularis','Frontal'),
'pericalcarine':('Pericalcarine cortex','Occipital'),'postcentral':('Postcentral gyrus','Parietal'),
'posteriorcingulate':('Posterior cingulate','Cingulate'),'precentral':('Precentral gyrus','Frontal'),
'precuneus':('Precuneus','Parietal'),'rostralanteriorcingulate':('Rostral anterior cingulate','Cingulate'),
'rostralmiddlefrontal':('Rostral middle frontal gyrus','Frontal'),'superiorfrontal':('Superior frontal gyrus','Frontal'),
'superiorparietal':('Superior parietal lobule','Parietal'),'superiortemporal':('Superior temporal gyrus','Temporal'),
'supramarginal':('Supramarginal gyrus','Parietal'),'frontalpole':('Frontal pole','Frontal'),
'temporalpole':('Temporal pole','Temporal'),'transversetemporal':('Transverse temporal gyri','Temporal'),
'insula':('Insula','Insula')}
for h,side in [('lh','left'),('rh','right')]:
 original=next(p for p in old if p['kind']=='cortex' and p['side']==side)
 vertices=np.array(original['positions']).reshape(-1,3);faces=np.array(original['indices']).reshape(-1,3)
 full,_=nib.freesurfer.read_geometry(cache/(h+'.sphere'));low=nib.load(cache/('sphere_'+side+'.gii.gz')).darrays[0].data
 distance,idx=cKDTree(full).query(low);assert distance.max()<1e-5;assert len(np.unique(idx))==len(vertices)
 annot,ctab,names=nib.freesurfer.read_annot(cache/('label_'+h+'.aparc.annot'));vertex_labels=annot[idx]
 # Majority per original triangle. Three-way ties use the first vertex deterministically.
 fl=vertex_labels[faces];tri=fl[:,0].copy();tri[(fl[:,1]==fl[:,2])]=fl[(fl[:,1]==fl[:,2]),1]
 normals=np.zeros_like(vertices);face_normals=np.cross(vertices[faces[:,1]]-vertices[faces[:,0]],vertices[faces[:,2]]-vertices[faces[:,0]])
 for i in range(3):np.add.at(normals,faces[:,i],face_normals)
 normals/=np.maximum(np.linalg.norm(normals,axis=1)[:,None],1e-12)
 for code in np.unique(tri):
  key=names[code].decode() if code>=0 else 'unknown';key=key if key in labels else 'medialwall'
  fs=faces[tri==code];unique,inverse=np.unique(fs,return_inverse=True)
  name,lobe=labels.get(key,('Unassigned medial surface','Unassigned'))
  parts.append(dict(id=side+'-'+key,key=key,name=name,side=side,kind='cortex',group=lobe,positions=vertices[unique].flatten().tolist(),indices=inverse.reshape(-1,3).flatten().tolist(),normals=np.round(normals[unique],5).flatten().tolist(),source='Desikan–Killiany / fsaverage'))
 audit[side]={'vertices':len(vertices),'triangles':len(faces),'max_sphere_match_distance':float(distance.max()),'parcels':sum(p['side']==side and p['kind']=='cortex' and p['key']!='medialwall' for p in parts)}
for p in old:
 if p['kind']=='cortex':continue
 key=p['name'].lower().replace(' ','-');p.update(id=p['side']+'-'+key,key=key,group={'deep':'Deep nuclei','brainstem':'Brainstem','cerebellum':'Cerebellum'}[p['kind']],source='FreeSurfer fsaverage aseg');parts.append(p)
img=nib.load(cache/'mri_aseg.mgz');data=np.asarray(img.dataobj);aff=img.header.get_vox2ras_tkr()
extras=[]
for side,offset in [('left',0),('right',36)]:
 for name,key,label,group in [('Hippocampus','hippocampus',17,'Medial temporal'),('Amygdala','amygdala',18,'Medial temporal'),('Nucleus accumbens','accumbens',26,'Deep nuclei'),('Lateral ventricle','lateral-ventricle',4,'Ventricles')]:extras.append((name,key,side,'ventricle' if label==4 else 'deep',group,[label+offset if label!=26 else (26 if side=='left' else 58)]))
# Label identities are defined by FreeSurferColorLUT, not hand-drawn cuts.
extras.extend([('Third ventricle','third-ventricle','midline','ventricle','Ventricles',[14]),('Fourth ventricle','fourth-ventricle','midline','ventricle','Ventricles',[15]),('Corpus callosum','corpus-callosum','midline','commissure','Commissural white matter',[251,252,253,254,255])])
# Right lateral ventricle uses 43, whereas hippocampus/amygdala use 53/54.
extras=[(n,k,s,t,g,[43] if k=='lateral-ventricle' and s=='right' else lab) for n,k,s,t,g,lab in extras]
for name,key,side,kind,group,codes in extras:
 mask=gaussian_filter(np.isin(data,codes).astype('float32'),.65);v,f,_,_=marching_cubes(mask,.5,step_size=1)
 v=nib.affines.apply_affine(aff,v);v=np.stack([v[:,0],v[:,2],-v[:,1]],axis=1)
 parts.append(dict(id=side+'-'+key,key=key,name=name,side=side,kind=kind,group=group,source='FreeSurfer fsaverage aseg',positions=np.round(v,3).flatten().tolist(),indices=f.astype(int).flatten().tolist()))
assert len({p['id'] for p in parts})==len(parts)
Path('dist/assets/atlas.json').write_text(json.dumps(parts,separators=(',',':')))
audit['source_sha256']={n:hashlib.sha256((cache/n).read_bytes()).hexdigest() for n in files};audit['total_meshes']=len(parts)
Path('dist/assets/atlas-audit.json').write_text(json.dumps(audit,indent=2));print(json.dumps({k:v for k,v in audit.items() if k!='source_sha256'},indent=2))
