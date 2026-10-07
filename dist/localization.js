/* Clinical display rules are separate from atlas geometry. No region probabilities. */
(function(root){
const language=['aphasia','nonfluent','fluent'];
function inferAnatomy(s){
 const has=id=>s.ids.includes(id),top=s.inspected||s.top,regions=[],limits=[],votes=[];
 const vote=(side,why)=>votes.push({side,why});
 if(top==='Cortex'||top==='Subcortex'){
  if(s.right&&!s.left)vote('left','right-sided motor signs');if(s.left&&!s.right)vote('right','left-sided motor signs');
  if(has('rHemiSensory'))vote('left','right face and body sensory loss');if(has('lHemiSensory'))vote('right','left face and body sensory loss');
  if(has('neglect'))vote('right','left hemispatial neglect');
  if(has('rCorticalSensory'))vote('left','right cortical sensory deficit');if(has('lCorticalSensory'))vote('right','left cortical sensory deficit');
  if(has('rField'))vote('left','right homonymous field loss');if(has('lField'))vote('right','left homonymous field loss');
  if(language.some(has)&&s.dominance!=='unknown')vote(s.dominance,'known language dominance');
 }
 let side= votes.length&&votes.every(v=>v.side===votes[0].side)?votes[0].side:null;
 const sideConflict=new Set(votes.map(v=>v.side)).size>1;
 if(top==='Cerebellum')side=s.ataxiaRight&&!s.ataxiaLeft?'right':s.ataxiaLeft&&!s.ataxiaRight?'left':null;
 if(sideConflict)limits.push('Lateralizing findings disagree; no unilateral region map is assigned.');
 if(language.some(has)&&s.dominance==='unknown')limits.push('Language dominance is unconfirmed. A hemisphere inferred from other signs is conditional.');
 const add=(key,side,why)=>{if(side)regions.push({key,side,why})};
 const canRefine=s.best>0&&s.ties.length===1&&!s.conflicts&&!sideConflict&&top===s.top;
 if(canRefine&&top==='Cortex'){
  if(side&&(s.right!==s.left)){add('precentral',side,'Motor-cortex component of the candidate network; descending pathways remain alternatives.');if(has('rleg')||has('lleg'))add('paracentral',side,'Medial sensorimotor component; exact leg representation is not segmented.');}
  if(language.some(has)){
   const dominant=s.dominance==='unknown'?side:s.dominance;
   const keys=has('nonfluent')?['parsopercularis','parstriangularis']:has('fluent')?['superiortemporal','middletemporal','supramarginal','inferiorparietal']:['parsopercularis','parstriangularis','superiortemporal','supramarginal','inferiorparietal'];
   for(const key of keys)add(key,dominant,'Language-network context. Gyral parcels do not define Broca or Wernicke functional boundaries.');
   limits.push('Aphasia reflects a distributed network; these are contextual parcels, not a diagnosed lesion.');
  }
  if(has('neglect'))for(const key of ['inferiorparietal','superiorparietal','supramarginal'])add(key,'right','Parietal components of attention circuitry; frontal and subcortical components also matter.');
  for(const [id,side]of [['rCorticalSensory','left'],['lCorticalSensory','right']])if(has(id))for(const key of ['postcentral','superiorparietal'])add(key,side,'Somatosensory network candidate with intact elementary sensation; not a unique gyrus diagnosis.');
  for(const [id,side] of [['rHemiSensory','left'],['lHemiSensory','right']])if(has(id))add('postcentral',side,'Primary somatosensory component of the candidate network; thalamic and upper brainstem pathways remain alternatives.');
  if(has('field')||has('rField')||has('lField'))limits.push('Homonymous field loss may arise anywhere along the retrochiasmal pathway; it does not uniquely select occipital cortex.');
 }
 if(top==='Subcortex')limits.push('Internal capsule, thalamic nuclei and basal-ganglia subnuclei are not separately segmented. Visible nuclei are anatomical context.');
 if(top==='Cerebellum')limits.push('Hemisphere-level display only. Vermis, lobules, peduncles and deep cerebellar nuclei are not separately segmented.');
 if(top==='Brainstem')limits.push('Midbrain, pons, medulla and cranial-nerve nuclei are not separately segmented.');
 if(s.conflicts)limits.push('Conflicting observations suppress detailed region highlighting.');
 return {side,sideConflict,regions:[...new Map(regions.map(r=>[r.side+'-'+r.key,r])).values()],limits,votes,canRefine};
}
root.inferAnatomy=inferAnatomy;if(typeof module!=='undefined')module.exports={inferAnatomy};
})(typeof window!=='undefined'?window:globalThis);
