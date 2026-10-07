const fs=require('fs'),vm=require('vm'),assert=require('assert');
const nodes=new Map();function node(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'unknown',addEventListener(){},focus(){}});return nodes.get(id)}
const context={document:{querySelector:node,querySelectorAll:()=>[]},window:{dispatchEvent(e){context.event=e}},CustomEvent:class{constructor(type,args){this.type=type;this.detail=args.detail}},module:{exports:{}}};vm.createContext(context);vm.runInContext(fs.readFileSync('dist/localization.js','utf8'),context);context.inferAnatomy=context.window.inferAnatomy;vm.runInContext(fs.readFileSync('dist/app.js','utf8'),context);
const {calculate,cases}=context.module.exports;for(const [c,l]of Object.entries({cortical:'Cortex',deep:'Subcortex',crossed:'Brainstem'}))assert.equal(calculate(new Set(cases[c])).rank[0],l);
assert.equal(context.window.neuroState.top,'Cortex');assert(context.window.neuroState.right&&!context.window.neuroState.left);
vm.runInContext("chosen=new Set();render()",context);assert.equal(context.window.neuroState.ids.length,0);
vm.runInContext("chosen=new Set(['rarm']);render()",context);assert(context.window.neuroState.ties.length>1);
vm.runInContext("chosen=new Set(['lface','larm','aphasia']);render()",context);assert(context.window.neuroState.left&&!context.window.neuroState.right);
const parts=JSON.parse(fs.readFileSync('dist/assets/brain.json'));assert.equal(parts.length,13);
for(const p of parts){assert(p.positions.every(Number.isFinite));assert.equal(p.positions.length%3,0);assert.equal(p.indices.length%3,0);assert(p.indices.every(i=>Number.isInteger(i)&&i>=0&&i<p.positions.length/3));if(p.kind==='cortex'){const xs=p.positions.filter((_,i)=>i%3===0);const mean=xs.reduce((a,b)=>a+b)/xs.length;assert(p.side==='left'?mean<0:mean>0)}}
const html=fs.readFileSync('dist/index.html','utf8');for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(!/^(http|data:|\.\/$)/.test(match[1]))assert(fs.existsSync('dist/'+match[1]),match[1])}
for(const filename of ['brain.js','vendor/OrbitControls.js']){const source=fs.readFileSync('dist/'+filename,'utf8');for(const m of source.matchAll(/from ['"](.+?)['"]/g))assert(fs.existsSync(require('path').resolve('dist',require('path').dirname(filename),m[1])),m[1])}
console.log('Passed: 3 core patterns, 3D state bridge, laterality, conflicts, ties, empty state; 13 finite indexed meshes, hemisphere orientation, and local asset/module references.');

// Expanded examination: prevent over-localization and ipsi/contralateral mix-ups.
for(const [c,l]of Object.entries({cerebellarRight:'Cerebellum',cerebellarLeft:'Cerebellum',axial:'Cerebellum',parkinsonian:'Subcortex'}))assert.equal(calculate(new Set(cases[c])).rank[0],l,c);
const pyramidal=calculate(new Set(cases.pyramidal));assert.equal(pyramidal.scores.Cortex,pyramidal.scores['Spinal cord']);
vm.runInContext("chosen=new Set(cases.cerebellarRight);inspected=null;render()",context);assert(context.window.neuroState.ataxiaRight&&!context.window.neuroState.ataxiaLeft);assert(node('#result').innerHTML.includes('Right cerebellar circuitry'));
vm.runInContext("chosen=new Set(cases.cerebellarLeft);inspected=null;render()",context);assert(context.window.neuroState.ataxiaLeft&&!context.window.neuroState.ataxiaRight);assert(node('#result').innerHTML.includes('Left cerebellar circuitry'));
vm.runInContext("chosen=new Set(cases.parkinsonian);render()",context);assert(node('#differential').innerHTML.includes('Parkinsonian motor'));
assert.equal(new Set(context.module.exports.features.map(f=>f.id)).size,context.module.exports.features.length);
console.log('Passed expanded exam: cerebellar laterality, pyramidal ambiguity, and parkinsonian differential.');

const atlas=JSON.parse(fs.readFileSync('dist/assets/atlas.json'));assert.equal(atlas.length,92);assert.equal(atlas.filter(p=>p.kind==='cortex'&&p.key!=='medialwall').length,68);
assert.equal(new Set(atlas.map(p=>p.id)).size,92);
for(const side of ['left','right']){assert.equal(atlas.filter(p=>p.kind==='cortex'&&p.side===side).reduce((n,p)=>n+p.indices.length/3,0),20480)}
for(const p of atlas){assert(p.positions.every(Number.isFinite));assert(p.indices.every(i=>Number.isInteger(i)&&i>=0&&i<p.positions.length/3));if(p.normals)assert.equal(p.normals.length,p.positions.length)}
function display(ids,dominance='unknown'){node('#dominance').value=dominance;context.exam=ids;vm.runInContext("chosen=new Set(exam);inspected=null;render()",context);return context.inferAnatomy(context.window.neuroState)}
let map=display(['neglect']);assert.equal(map.side,'right');assert(map.regions.every(r=>r.side==='right'));assert(node('#result').innerHTML.includes('Right cerebral hemisphere'));
map=display(['rCorticalSensory']);assert.equal(map.side,'left');assert(map.regions.some(r=>r.key==='postcentral'));
map=display(['nonfluent','rface','rarm']);assert.equal(map.side,'left');assert(map.regions.some(r=>r.key==='parsopercularis'));
map=display(['nonfluent'],'right');assert.equal(map.side,'right');assert(map.regions.every(r=>r.side==='right'));
map=display(['nonfluent']);assert.equal(map.side,null);assert.equal(map.regions.length,0);
map=display(['aphasia','rarm'],'right');assert(map.sideConflict);assert.equal(map.regions.length,0);
map=display(['neglect','rarm']);assert(map.sideConflict);assert.equal(map.regions.length,0);
map=display(['rField']);assert.equal(map.regions.length,0);
assert.equal(calculate(new Set(['aphasia','nonfluent'])).scores.Cortex,calculate(new Set(['nonfluent'])).scores.Cortex);
assert.equal(calculate(new Set(['field','rField'])).scores.Cortex,calculate(new Set(['rField'])).scores.Cortex);
map=display(['rfn','rhs']);assert.equal(map.side,'right');
map=display(['nonfluent','fluent']);assert.equal(map.regions.length,0);
for(const c of Object.values(cases)){const m=display(c);for(const r of m.regions)assert(atlas.some(p=>p.id===r.side+'-'+r.key),r.key)}
console.log('Passed atlas matching: 68 parcels, conserved cortical triangles, all valid geometry and regional targets; neglect, cortical sensation, language dominance, contradictory laterality, visual pathway ambiguity and duplicate-evidence safeguards.');

require('./verify-exam.cjs');

// Examination categories and clinically important new observations.
const expectedGroups=['Mental status','Cranial nerves','Motor system','Sensory','Coordination','Reflexes','Gait / station','Miscellaneous'];
assert.deepEqual([...new Set(context.module.exports.features.map(f=>f.group))],expectedGroups);
const drift=calculate(new Set(['rDrift']));assert.equal(drift.scores.Cortex,drift.scores['Spinal cord']);
assert.deepEqual(calculate(new Set(['rarm','rDrift'])).scores,calculate(new Set(['rarm'])).scores);
map=display(['rDrift','aphasia']);assert.equal(map.side,'left');
console.log('Passed examination update: ordered categories, pronator-drift laterality and duplicate suppression.');

const retained=context.module.exports.features;
assert(retained.every(f=>['Cortex','Subcortex','Brainstem','Cerebellum'].some(k=>f.weights[k]>0)));
for(const ids of Object.values(cases))assert(ids.every(id=>retained.some(f=>f.id===id)));
vm.runInContext("chosen=new Set();findingMode='simple'",context);
assert(vm.runInContext("isFindingVisible('aphasia')&&!isFindingVisible('rclonus')",context));
vm.runInContext("chosen.add('rclonus')",context);assert(vm.runInContext("isFindingVisible('rclonus')",context));
const before=JSON.stringify(calculate(new Set(['rclonus'])).scores);
vm.runInContext("findingMode='expanded'",context);assert(vm.runInContext("features.every(f=>isFindingVisible(f.id))",context));
assert.equal(before,JSON.stringify(calculate(new Set(['rclonus'])).scores));
map=display(['rHemiSensory','aphasia']);assert.equal(map.side,'left');
map=display(['rHemiSensory','rCorticalSensory']);assert(context.window.neuroState.conflicts>0);assert.equal(map.regions.length,0);
map=display(['dysarthria','aphasia']);assert.equal(context.window.neuroState.conflicts,0);
console.log(`Passed brain-focused modes: ${retained.length} findings, retained selections, stable scores, valid presets, sensory laterality, and speech coexistence.`);

// Exercise DOM visibility with actual feature rows and category group membership.
const rows=retained.map(f=>({id:f.id,group:f.group,hidden:false,querySelector:()=>({value:f.id})}));
const groups=[...new Set(retained.map(f=>f.group))].map(group=>({group,hidden:false,querySelectorAll:()=>rows.filter(r=>r.group===group)}));
const buttons=['simple','expanded'].map(mode=>({dataset:{findingMode:mode},setAttribute(k,v){this[k]=v}}));
context.document.querySelectorAll=selector=>selector==='#features .finding'?rows:selector==='.feature-category'?groups:selector==='[data-finding-mode]'?buttons:[];
vm.runInContext("chosen=new Set();findingMode='simple';updateFindingVisibility()",context);
assert.equal(rows.filter(r=>!r.hidden).length,18);assert(groups.find(g=>g.group==='Reflexes').hidden);assert.equal(buttons[0]['aria-pressed'],'true');
vm.runInContext("chosen.add('rclonus');updateFindingVisibility()",context);
assert(!rows.find(r=>r.id==='rclonus').hidden);assert(!groups.find(g=>g.group==='Reflexes').hidden);assert(node('#finding-mode-note').textContent.includes('1 expanded selection retained'));
vm.runInContext("findingMode='expanded';updateFindingVisibility()",context);assert(rows.every(r=>!r.hidden));assert.equal(buttons[1]['aria-pressed'],'true');
console.log('Passed mode UI: 18 simple rows, empty sections hidden, selected expanded rows exposed, and accessible toggle state.');
