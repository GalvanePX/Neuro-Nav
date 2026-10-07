const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync('dist/app.js','utf8').split('for(const f of features)')[0]+';this.examFeatures=features;',context);
context.module={exports:{}};vm.runInContext(fs.readFileSync('dist/exam-parser.js','utf8'),context);const {parseExam}=context.module.exports;const features=context.examFeatures;
const parse=text=>parseExam(text,features),ids=text=>Array.from(parse(text).matches,m=>m.id).sort();
for(const [text,expected] of [
 ['Right lower facial weakness. Right arm power 4/5. Aphasia.',['rface','rarm','aphasia']],
 ['Fraqueza no membro superior direito; afasia; hiperreflexia.',['rarm','aphasia','hyper']],
 ['Força 3/5 MSE. Força 5/5 MSD.',['larm']],
 ['Right finger-to-nose dysmetria. Left heel-to-shin dysmetria.',['rfn','lhs']],
 ['Dismetria indice-nariz direita; clonus sustentado no tornozelo esquerdo.',['rfn','lclonus']],
 ['Bilateral sustained ankle clonus.',['rclonus','lclonus']],
 ['Dysarthria. Aphasia.',['dysarthria','aphasia']],
 ['Nuchal rigidity. Saddle anesthesia. Symmetric proximal weakness.',[]],
 ['Right face and body sensory loss.',['rHemiSensory']],
 ['Right homonymous hemianopia.',['rField']],
 ['Gait normal. Language intact. Sensation intact.',[]],
 ['No aphasia. Right arm weakness.',['rarm']],
 ['Right arm weakness but no aphasia.',['rarm']],
 ['Aphasia absent. No right arm weakness.',[]],
 ['Possible aphasia? History of right arm weakness. Left leg weakness resolved.',[]],
 ['Aphasia ruled out. Gait not assessed.',[]],
 ['Right facial weakness. Dysmetria. Romberg positive.',[]],
 ['Right arm weakness and left leg weakness.',['rarm','lleg']],
 ['Right arm weakness. No right arm weakness.',[]],
 ['Absent reflexes.',[]],
 ['Unable to perform tandem gait.',['tandem']],
 ['Left arm 4/5. Right arm 5/5.',['larm']],
 ['Patient has Parkinson disease or a stroke.',[]],
 ['Sensation normal except in the right foot.',[]],
 ['<img src=x onerror=alert(1)>',[]],
 ['Right arm weakness with normal leg strength.',[]],
 ['Bilateral homonymous hemianopia.',[]],
 ['Unable to assess right arm weakness.',[]],
 ['Unable to walk with normal gait.',[]],
 ['',[]],
])assert.deepEqual(ids(text),expected.sort(),text);
for(const f of features){const result=parse(f.label);assert(result.matches.some(m=>m.id===f.id),'Exact feature label: '+f.id);}
assert(parse('Dysmetria.').review.length===1);
assert.equal(ids('Aphasia. Aphasia.').length,1);
const start=performance.now();for(let i=0;i<20;i++)parse('No aphasia. Right arm weakness. '.repeat(320));assert(performance.now()-start<3000,'Long-input processing budget');
console.log('Passed exam import: bilingual matching, laterality, explicit strength, negation, history, uncertainty, contradictions, duplicates and bounded input.');
