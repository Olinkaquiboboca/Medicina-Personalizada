(function(){
  const toggle=document.querySelector('.menu-toggle');
  const nav=document.querySelector('.main-nav');
  if(toggle&&nav){
    toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');}));
  }
  const page=document.body.dataset.page;
  document.querySelectorAll('.main-nav a').forEach(a=>{if(a.dataset.page===page)a.setAttribute('aria-current','page');});

  const progress=document.querySelector('[data-reading-progress]');
  if(progress){
    let ticking=false;
    window.addEventListener('scroll',()=>{
      if(!ticking){requestAnimationFrame(()=>{const d=document.documentElement;const ratio=d.scrollHeight>innerHeight?scrollY/(d.scrollHeight-innerHeight):0;progress.style.width=(ratio*100)+'%';ticking=false;});ticking=true;}
    },{passive:true});
  }

  // Visualizador de figuras: zoom por botões/roda, arraste, pinça, 100%, enquadrar e tela cheia.
  const box=document.querySelector('.lightbox');
  if(box){
    const image=box.querySelector('img');
    const wrap=box.querySelector('.lightbox-image-wrap');
    const cap=box.querySelector('.lightbox-caption');
    const close=box.querySelector('[data-close-lightbox]');
    const zoomIn=box.querySelector('[data-zoom-in]');
    const zoomOut=box.querySelector('[data-zoom-out]');
    const zoomReset=box.querySelector('[data-zoom-reset]');
    const zoomOne=box.querySelector('[data-zoom-one]');
    const fullscreen=box.querySelector('[data-fullscreen]');
    let scale=1,x=0,y=0,lastFocus=null,pointers=new Map(),dragStart=null,pinchStart=null;
    const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
    function paint(){image.style.transform=`translate(${x}px,${y}px) scale(${scale})`;image.style.cursor=scale>1?'grab':'zoom-in';}
    function setScale(next){scale=clamp(next,1,5);if(scale===1){x=0;y=0;}paint();}
    function reset(){scale=1;x=0;y=0;paint();wrap.scrollTop=0;wrap.scrollLeft=0;}
    function open(btn){lastFocus=btn;image.src=btn.dataset.imageOpen;image.alt=btn.dataset.alt||'Figura científica ampliada';cap.textContent=btn.dataset.caption||'';box.classList.add('open');box.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';reset();close?.focus();}
    async function shut(){box.classList.remove('open');box.setAttribute('aria-hidden','true');document.body.style.overflow='';if(document.fullscreenElement===box){try{await document.exitFullscreen()}catch(_){}}reset();if(lastFocus)lastFocus.focus();}
    document.addEventListener('click',e=>{const btn=e.target.closest('[data-image-open]');if(btn)open(btn);});
    close?.addEventListener('click',shut);
    box.addEventListener('click',e=>{if(e.target===box)shut();});
    zoomIn?.addEventListener('click',()=>setScale(scale*1.25));
    zoomOut?.addEventListener('click',()=>setScale(scale/1.25));
    zoomReset?.addEventListener('click',reset);
    zoomOne?.addEventListener('click',()=>setScale(1));
    fullscreen?.addEventListener('click',async()=>{try{if(document.fullscreenElement===box){await document.exitFullscreen()}else if(box.requestFullscreen){await box.requestFullscreen()}}catch(_){fullscreen.textContent='Tela cheia indisponível'}});
    wrap.addEventListener('wheel',e=>{if(!box.classList.contains('open'))return;e.preventDefault();setScale(scale*(e.deltaY<0?1.12:.89));},{passive:false});
    image.addEventListener('dblclick',()=>setScale(scale>1?1:2));
    image.addEventListener('pointerdown',e=>{
      if(!box.classList.contains('open'))return;
      image.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===1)dragStart={x:e.clientX,y:e.clientY,ox:x,oy:y};
      if(pointers.size===2){const pts=[...pointers.values()];pinchStart={distance:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y),scale};dragStart=null;}
    });
    image.addEventListener('pointermove',e=>{
      if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===2&&pinchStart){const pts=[...pointers.values()];const d=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);setScale(pinchStart.scale*(d/Math.max(1,pinchStart.distance)));}
      else if(dragStart&&scale>1){x=dragStart.ox+(e.clientX-dragStart.x);y=dragStart.oy+(e.clientY-dragStart.y);paint();}
    });
    function pointerEnd(e){pointers.delete(e.pointerId);if(pointers.size<2)pinchStart=null;if(pointers.size===0)dragStart=null;}
    image.addEventListener('pointerup',pointerEnd);image.addEventListener('pointercancel',pointerEnd);
    document.addEventListener('keydown',e=>{
      if(!box.classList.contains('open'))return;
      if(e.key==='Escape'){e.preventDefault();shut();}
      if(e.key==='+'||e.key==='='){e.preventDefault();setScale(scale*1.2)}
      if(e.key==='-'){e.preventDefault();setScale(scale/1.2)}
      if(e.key==='0'){e.preventDefault();reset()}
    });
  }

  // Destaca a cena mais próxima da área visível durante a leitura livre.
  const sceneLinks=[...document.querySelectorAll('.scene-nav a')];
  const scenes=[...document.querySelectorAll('.scene[data-scene]')];
  if('IntersectionObserver' in window&&sceneLinks.length&&scenes.length){
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible)return;sceneLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+visible.target.id));
    },{rootMargin:'-22% 0px -58% 0px',threshold:[0,.1,.25,.5]});
    scenes.forEach(s=>observer.observe(s));
  }
})();
