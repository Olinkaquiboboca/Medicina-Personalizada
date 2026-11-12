(function(){
 const scenes=[...document.querySelectorAll('.scene[data-scene]')];if(!scenes.length)return;
 const body=document.body,modeBtn=document.querySelector('[data-present-toggle]'),prev=document.querySelector('[data-present-prev]'),next=document.querySelector('[data-present-next]'),counter=document.querySelector('[data-present-count]');let idx=0,enabled=false;
 function show(i){
  idx=Math.max(0,Math.min(scenes.length-1,i));
  scenes.forEach((s,n)=>{s.classList.toggle('current-scene',n===idx);s.setAttribute('aria-hidden',String(enabled&&n!==idx));});
  if(counter)counter.textContent=`Cena ${idx+1} de ${scenes.length}`;
  if(prev)prev.disabled=idx===0;if(next)next.disabled=idx===scenes.length-1;
  if(enabled)window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 }
 function toggle(){
  enabled=!enabled;body.classList.toggle('present-mode',enabled);
  if(modeBtn){modeBtn.setAttribute('aria-pressed',String(enabled));modeBtn.textContent=enabled?'Sair da apresentação':'Modo apresentação';}
  show(idx);
 }
 modeBtn?.addEventListener('click',toggle);prev?.addEventListener('click',()=>show(idx-1));next?.addEventListener('click',()=>show(idx+1));
 document.addEventListener('keydown',e=>{
  if(!enabled||document.querySelector('.lightbox.open'))return;
  if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();show(idx+1)}
  if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();show(idx-1)}
  if(e.key==='Escape'){e.preventDefault();toggle()}
 });
 document.querySelectorAll('[data-scene-link]').forEach(a=>a.addEventListener('click',e=>{
  const target=scenes.findIndex(s=>s.id===a.getAttribute('href').slice(1));
  if(target>=0&&enabled){e.preventDefault();show(target)}
 }));
 show(0);
})();
