/* UI adapter: suggestions remain separate from the examination until Apply. */
(()=>{
 const input=document.querySelector('#exam-text'),list=document.querySelector('#exam-matches'),status=document.querySelector('#exam-status'),apply=document.querySelector('#exam-apply'),undo=document.querySelector('#exam-undo');
 let pending=null,timer=null,previous=null,ownChange=false;
 const make=(tag,text,className)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(className)n.className=className;return n;};
 function count(){const n=list.querySelectorAll('input:checked').length;apply.disabled=!n;apply.textContent=n?`Apply ${n} finding${n===1?'':'s'}`:'Apply matches';}
 function preview(){
  clearTimeout(timer);pending=window.parseExam(input.value,features);list.replaceChildren();
  for(const match of pending.matches){
   const label=make('label',null,'exam-match'),box=make('input');box.type='checkbox';box.value=match.id;box.checked=true;box.setAttribute('aria-label',features.find(f=>f.id===match.id).label);
   const copy=make('span');copy.append(make('strong',features.find(f=>f.id===match.id).label),make('small',match.sources.join(' · ')));label.append(box,copy);list.append(label);
  }
  const details=document.querySelector('#exam-review-details'),unmatched=document.querySelector('#exam-unmatched');unmatched.replaceChildren();details.hidden=!pending.review.length;
  document.querySelector('#exam-review-summary').textContent=`Review / excluded (${pending.review.length})`;
  for(const item of pending.review){const li=make('li');li.append(make('strong',item.reason),make('span',item.source));unmatched.append(li);}
  status.textContent=!input.value.trim()?'Paste or type to find matching checkboxes.':pending.matches.length?`${pending.matches.length} supported match${pending.matches.length===1?'':'es'} · review before applying.`:'No supported matches. Use explicit findings and sides, or select checkboxes manually.';
  count();
 }
 function edited(){previous=null;undo.hidden=true;document.querySelector('#exam-length').textContent=`${input.value.length.toLocaleString()} / 10,000`;apply.disabled=true;status.textContent='Matching…';clearTimeout(timer);timer=setTimeout(preview,180);}
 input.addEventListener('input',edited);list.addEventListener('change',count);
 document.querySelector('#exam-example').addEventListener('click',()=>{input.value='Right lower facial weakness. Right arm power 4/5. Aphasia. No sustained ankle clonus. Gait not assessed.';edited();preview();input.focus();});
 document.querySelector('#exam-clear').addEventListener('click',()=>{input.value='';edited();preview();input.focus();});
 apply.addEventListener('click',()=>{
  if(apply.disabled)return;const ids=[...list.querySelectorAll('input:checked')].map(i=>i.value);if(!ids.length)return;
  previous={ids:[...chosen],case:document.querySelector('#case').value,inspected};
  const adding=document.querySelector('#exam-mode').value==='add';chosen=new Set(adding?[...chosen,...ids]:ids);inspected=null;document.querySelector('#case').value='custom';ownChange=true;sync();ownChange=false;
  document.querySelectorAll('.feature-category').forEach(c=>c.open=[...c.querySelectorAll('input')].some(i=>i.checked));
  undo.hidden=false;status.textContent=`Applied ${ids.length} finding${ids.length===1?'':'s'}. ${adding?'Added to':'Replaced'} current findings.`;
 });
 undo.addEventListener('click',()=>{if(!previous)return;chosen=new Set(previous.ids);inspected=previous.inspected;document.querySelector('#case').value=previous.case;ownChange=true;sync();ownChange=false;previous=null;undo.hidden=true;document.querySelectorAll('.feature-category').forEach(c=>c.open=[...c.querySelectorAll('input')].some(i=>i.checked));status.textContent='Previous findings restored.';});
 window.addEventListener('neuro-change',()=>{if(!ownChange){previous=null;undo.hidden=true;}});
})();
