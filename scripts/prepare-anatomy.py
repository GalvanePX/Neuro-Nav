"""Convert published fsaverage anatomy into compact indexed surfaces. Requires nibabel, numpy, scipy, scikit-image. No patient data."""
import json, gzip, base64, zlib, xml.etree.ElementTree as ET
from pathlib import Path
import numpy as np
import nibabel as nib
from scipy.ndimage import gaussian_filter
from skimage.measure import marching_cubes
import urllib.request
cache=Path('/tmp/neurotopography-source');cache.mkdir(exist_ok=True)
for filename,url in {
'pial_left.gii.gz':'https://raw.githubusercontent.com/nilearn/nilearn/main/nilearn/datasets/data/fsaverage5/pial_left.gii.gz',
'pial_right.gii.gz':'https://raw.githubusercontent.com/nilearn/nilearn/main/nilearn/datasets/data/fsaverage5/pial_right.gii.gz',
'aseg.mgz':'https://raw.githubusercontent.com/mne-tools/mne-testing-data/master/subjects/fsaverage/mri/aseg.mgz'
}.items():
 if not (cache/filename).exists(): urllib.request.urlretrieve(url,cache/filename)
out=Path('dist/assets');parts=[]
def add(name,side,kind,v,f):
 # FreeSurfer surface RAS -> Three.js: right, superior, posterior.
 v=np.stack([v[:,0],v[:,2],-v[:,1]],axis=1)
 parts.append(dict(name=name,side=side,kind=kind,positions=np.round(v,3).flatten().tolist(),indices=f.astype(int).flatten().tolist()))
 print(name,side,len(v),np.round(v.min(0),1),np.round(v.max(0),1))
for side in ['left','right']:
 root=ET.fromstring(gzip.open(cache/('pial_'+side+'.gii.gz')).read());arrays=[]
 for d in root.findall('DataArray'):
  dtype='<f4' if 'FLOAT' in d.attrib['DataType'] else '<i4'
  arrays.append(np.frombuffer(zlib.decompress(base64.b64decode(d.find('Data').text)),dtype=dtype).reshape(-1,3))
 add('Cerebral cortex',side,'cortex',*arrays)
img=nib.load(cache/'aseg.mgz');data=np.asarray(img.dataobj);aff=img.header.get_vox2ras_tkr()
for name,side,kind,labels in [('Cerebellum','left','cerebellum',[7,8]),('Cerebellum','right','cerebellum',[46,47]),('Brainstem','midline','brainstem',[16]),('Thalamus','left','deep',[10]),('Thalamus','right','deep',[49]),('Caudate','left','deep',[11]),('Caudate','right','deep',[50]),('Putamen','left','deep',[12]),('Putamen','right','deep',[51]),('Globus pallidus','left','deep',[13]),('Globus pallidus','right','deep',[52])]:
 mask=gaussian_filter(np.isin(data,labels).astype('float32'),.65)
 v,f,_,_=marching_cubes(mask,level=.5,step_size=2 if kind=='cerebellum' else 1)
 v=nib.affines.apply_affine(aff,v)
 add(name,side,kind,v,f)
(out/'brain.json').write_text(json.dumps(parts,separators=(',',':')))
print('Saved',len(parts),'structures')
