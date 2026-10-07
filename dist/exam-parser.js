/* Local phrase matcher. No diagnosis inference, external service, or persistent exam storage. */
(function(root){
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[–—-]/g,' ').replace(/\s+/g,' ').trim();
const rules=[
 ['dysarthria',/\b(dysarthria|disartria)\b/],
 ['nuchal',/\b(nuchal rigidity|rigidez de nuca)\b/],
 ['kernig',/\b(positive kernig(?: sign)?|kernig (?:sign )?positive|kernig positivo)\b/],
 ['brudzinski',/\b(positive brudzinski(?: sign)?|brudzinski (?:sign )?positive|brudzinski positivo)\b/],
 ['inattention',/\b(impaired sustained attention|inatencao ao exame)\b/],
 ['hypotonia',/\b(hypotonia|hipotonia)\b/],
 ['fasciculations',/\b(visible limb fasciculations|fasciculacoes nos membros)\b/],
 ['saddleLoss',/\b(saddle (?:anesthesia|anaesthesia|sensory loss)|anestesia em sela)\b/],
 ['anisocoria',/\b(anisocoria|unequal pupils)\b/],

 ['aphasia',/\b(aphasia|afasia)\b/],
 ['hyper',/\b(hyperreflexia|hiperreflexia|brisk reflexes|reflexos exaltados)\b/],
 ['areflexia',/\b(areflexia|hyporeflexia|hiporreflexia|(?:absent|reduced|diminished) reflexes|reflexos (?:ausentes|reduzidos|abolidos))\b/],
 ['spastic',/\b(spasticity|espasticidade|velocity dependent (?:increase in tone|hypertonia))\b/],
 ['rigidity',/\b(cogwheel rigidity|lead pipe rigidity|rigidez em roda dentada)\b/],
 ['hoffmann',/\b(?:positive hoffmann|hoffmann(?:'s)? (?:sign positive|positive)|hoffmann positivo)\b/],
 ['intention',/\b(intention tremor|tremor de intencao)\b/],
 ['gaitNormal',/\b(gait (?:is )?normal|normal gait|marcha normal)\b/],
 ['normalLanguage',/\b(language (?:is )?(?:normal|intact)|normal language|linguagem (?:normal|preservada))\b/],
 ['sensoryNormal',/\b(sensation (?:is )?(?:normal|intact)|sensibilidade (?:normal|preservada))\b/],
 ['positionNormal',/\b((?:joint position|position sense|proprioception) (?:is )?(?:normal|intact)|propriocepcao (?:normal|preservada))\b/],
 ['positionLoss',/\b((?:impaired|reduced|absent) (?:joint position|position|vibration) sense|(?:position|vibration) sense (?:is )?(?:impaired|reduced|absent)|(?:perda|reducao) (?:da )?(?:propriocepcao|sensibilidade vibratoria))\b/],
 ['coordNormal',/\b((?:bilateral(?:ly)? (?:limb )?coordination (?:is )?normal)|(?:coordination normal bilaterally)|(?:coordenacao (?:normal bilateralmente|bilateral normal)))\b/],
 ['steppage',/\b(steppage gait|foot drop|marcha escarvante|pe caido)\b/],
 ['scissor',/\b(spastic scissoring gait|scissoring gait|marcha em tesoura)\b/],
 ['circum',/\b(circumduction gait|circumducting gait|marcha ceifante)\b/],
 ['shuffle',/\b(shuffling gait|shuffling steps|marcha em pequenos passos)\b/],
 ['magnetic',/\b(gait initiation failure|feet (?:appear |are )?stuck|marcha magnetica)\b/],
 ['waddle',/\b(waddling gait|marcha anserina)\b/],
 ['tandem',/\b(unable to (?:perform |walk )?tandem(?: gait)?|cannot (?:perform |walk )?tandem|incapaz de (?:realizar )?(?:marcha )?tandem)\b/],
 ['wideGait',/\b(wide based (?:irregular |ataxic )gait|marcha ataxica de base alargada)\b/],
 ['centralNystagmus',/\b(vertical nystagmus|direction changing gaze evoked nystagmus|nistagmo vertical)\b/],
 ['field',/\b(homonymous (?:hemianopia|visual field (?:defect|loss))|hemianopsia homonima)\b/],
 ['level',/\b(truncal sensory level|sensory level at (?:t|c|l)\d+|nivel sensitivo (?:em |a partir de )?(?:t|c|l)\d+)\b/],
 ['proximal',/\b(symmetric(?:al)? proximal weakness|fraqueza proximal simetrica)\b/],
 ['distal',/\b(symmetric(?:al)? distal sensory loss|perda sensitiva distal simetrica)\b/],
 ['dermatome',/\b(dermatomal (?:pain|sensory loss)|dor dermatomica|perda sensitiva dermatomica)\b/],
 ['ocular',/\b(fluctuating (?:ptosis|diplopia)|(?:ptose|diplopia) flutuante)\b/],
];
function parseExam(text,features){
 const allowed=new Set(features.map(f=>f.id));
 const matches=new Map(),excluded=new Set(),review=[],labels=new Map(features.map(f=>[normalize(f.label),f.id]));
 const fragments=text.slice(0,10000).split(/[\n;.!]+/).flatMap(sentence=>labels.has(normalize(sentence))?[sentence]:sentence.split(/\s+(?:but|however|mas|porem)\s+|,|\s+(?:and|e)\s+(?=(?:right|left|bilateral|no|sem|nega|aphasia|afasia|hyperreflexia|hiperreflexia)\b)/i)).map(s=>s.trim()).filter(Boolean);
 for(const source of fragments){
  const s=normalize(source),ids=new Set();
  if(labels.has(s))ids.add(labels.get(s));
  const right=/\b(right|direit[oa]s?|msd|mid)\b/.test(s),left=/\b(left|esquerd[oa]s?|mse|mie)\b/.test(s),bilateral=/\b(bilateral(?:ly)?|bilaterais)\b/.test(s);
  const sides=bilateral?['r','l']:right&&!left?['r']:left&&!right?['l']:[];
  for(const [id,pattern] of rules)if(pattern.test(s))ids.add(id);
  if(/\b(weakness|weak|paresis|fraqueza|paresia)\b/.test(s)||/\b[0-4]\s*\/\s*5\b/.test(s)){
   for(const side of sides){
    if(/\b(arm|upper limb|upper extremity|braco|membro superior|msd|mse)\b/.test(s))ids.add(side+'arm');
    if(/\b(leg|lower limb|lower extremity|perna|membro inferior|mid|mie)\b/.test(s))ids.add(side+'leg');
    if(/\b(lower (?:face|facial)|face inferior|facial inferior)\b/.test(s)||(/\b(facial|face)\b/.test(s)&&/\b(forehead sparing|fronte preservada)\b/.test(s)))ids.add(side+'face');
   }
  }
  for(const side of sides){
   if(/\b(pronator drift)\b/.test(s))ids.add(side+'Drift');
   if(/\b(dysmetria|dismetria)\b/.test(s)&&/\b(finger to nose|finger nose|index nose|indice nariz|dedo nariz)\b/.test(s))ids.add(side+'fn');
   if(/\b(dysmetria|dismetria)\b/.test(s)&&/\b(heel to shin|heel shin|calcanhar joelho|calcanhar tibia)\b/.test(s))ids.add(side+'hs');
   if(/\b(dysdiadochokinesia|disdiadococinesia|irregular rapid alternating movements)\b/.test(s))ids.add(side+'ram');
   if(!/\b(brief|unsustained|non sustained|extinguish|few beats)\b/.test(s)&&/\b(sustained ankle clonus|clonus sustentado (?:no |em )?tornozelo)\b/.test(s))ids.add(side+'clonus');
   if(/\b(extensor plantar response|upgoing plantar|positive babinski|babinski positive|babinski positivo|resposta plantar extensora)\b/.test(s))ids.add(side+'plantar');
   if(ids.has('field')&&sides.length===1){ids.delete('field');ids.add(side==='r'?'rField':'lField');}
  }
  if(/\b(left|esquerdo|esquerda)\b/.test(s)&&/\b(hemispatial neglect|heminegligencia)\b/.test(s))ids.add('neglect');
  // Required qualifiers are not inferred from a diagnosis or a vaguely named test.
  const exact=labels.has(s);
  let scope=s.replace(/\bno (?=membro|tornozelo|braco|teste|exame|lado|pe\b)/g,'').replace(/without language impairment|not velocity dependent|absent reflexes|reflexos ausentes|unable to (?=(?:perform |walk )?tandem)|cannot (?=(?:perform |walk )?tandem)|incapaz de (?=(?:realizar )?(?:marcha )?tandem)/g,'');
  const uncertain=/\?|\b(possible|possibly|suspected|query|rule out|cannot exclude|uncertain|maybe|except|exceto|suspeita|possivel|duvidoso|a esclarecer)\b/.test(s);
  const historical=/\b(history of|previous(?:ly)?|prior|resolved|historico|antecedente|previ[oa]|resolvid[oa])\b/.test(s);
  const negated=!exact&&(/\b(no|not|unable|cannot|incapaz|ruled out|excluded|without|denies|denied|negative|absent|sem|nega|negou|ausente|negativo|nao)\b/.test(scope));
  if(uncertain||historical||negated){if(negated&&!uncertain&&!historical)for(const id of ids)excluded.add(id);review.push({source,reason:uncertain?'Uncertain wording — not selected':historical?'Historical / resolved — not selected':'Negative wording — not selected'});continue;}
  const motorSites=[/\b(arm|upper limb|upper extremity|braco|membro superior|msd|mse)\b/,/\b(leg|lower limb|lower extremity|perna|membro inferior|mid|mie)\b/,/\b(face|facial)\b/].filter(pattern=>pattern.test(s)).length;
  if(!exact&&motorSites>1&&[...ids].some(id=>/^[rl](arm|leg|face)$/.test(id))){review.push({source,reason:'Multiple motor regions in one phrase — separate each region and its strength'});continue;}
  if(bilateral&&ids.has('field')){review.push({source,reason:'Bilateral field description — characterize each visual field manually'});continue;}
  if(right&&left&&!bilateral){review.push({source,reason:'More than one side in this phrase — split into separate findings'});continue;}
  for(const id of ids)if(!allowed.has(id))ids.delete(id);
  if(!ids.size){review.push({source,reason:'No exact supported match — check the finding and any required qualifiers manually'});continue;}
  for(const id of ids){if(!matches.has(id))matches.set(id,{id,sources:[]});matches.get(id).sources.push(source);}
 }
 for(const id of excluded){if(matches.has(id)){review.push({source:matches.get(id).sources.join('; '),reason:'Both positive and negative wording — reconcile before selecting'});matches.delete(id);}}
 if(matches.has('rField')||matches.has('lField'))matches.delete('field');
 if(matches.has('nonfluent')||matches.has('fluent'))matches.delete('aphasia');
 return {matches:[...matches.values()],review};
}
root.parseExam=parseExam;
})(typeof module!=='undefined'?module.exports:window);
