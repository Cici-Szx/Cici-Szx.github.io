(() => {
  'use strict';
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const asset='assets/shybloom/';
  function select(selector,key,value){$$(selector).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[key]===String(value))))}
  function group(selector,key,fn){const buttons=$$(selector);buttons.forEach((b,i)=>{b.addEventListener('click',()=>fn(b.dataset[key]));b.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(i+1)%buttons.length;if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(i+buttons.length-1)%buttons.length;if(e.key==='Home')next=0;if(e.key==='End')next=buttons.length-1;if(next===undefined)return;e.preventDefault();buttons[next].focus();buttons[next].click()})})}
  function appear(el){el.getAnimations().forEach(a=>a.cancel());if(!reduced.matches)el.animate([{opacity:.3,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'})}
  function picture(el,name,alt){el.src=asset+name+'.webp';el.alt=alt;appear(el)}
  const state={ambient:80,intensity:65,shadow:false,hover:false,breathing:false};
  let visible=false;
  const stage=$('#bloom-stage');
  function renderBloom(){
    const shaded=state.shadow||state.hover;
    // Normalised demonstrator only: threshold and shadow multiplier are illustrative, not measured.
    const sensed=state.ambient*(shaded?.25:1),open=sensed<50;
    stage.dataset.open=String(open);stage.classList.toggle('is-shaded',shaded);stage.classList.toggle('is-breathing',open&&state.breathing);stage.style.setProperty('--led-level',state.intensity/100);
    $('#ambient-value').textContent=state.ambient+'%';$('#brightness-value').textContent=state.intensity+'%';
    $('#ambient-light').setAttribute('aria-valuetext',state.ambient+' percent relative ambient light');
    $('#led-brightness').setAttribute('aria-valuetext',state.intensity+' percent light intensity');
    $('#bloom-state').textContent=open?'Awake / Open':'Resting / Closed';$('#petal-readout').textContent=open?'Open':'Closed';
    $('#light-readout').textContent=!open||state.intensity===0?'Off':state.breathing?'Breathing':'Steady';
    $('#sensor-readout').textContent=shaded?'Shaded':state.ambient<50?'Low light':'Bright';
    $('#shade-button').setAttribute('aria-pressed',String(state.shadow));$('#flower-touch').setAttribute('aria-pressed',String(state.shadow));$('#shade-button>span').textContent=state.shadow?'Remove the shadow':'Shade the sensor';
    $('#breathing-button').disabled=!open;$('#breathing-button').setAttribute('aria-pressed',String(state.breathing));
    $('#flower-instruction').textContent=state.shadow?'Shadow held · Tap to release':state.hover?'A passing shadow opens the flower':'Hover to shade · Tap to hold a shadow';
    let message=!open?'In bright light, the flower closes and the LEDs switch off. Shade the sensor or dim the room to open it.':shaded?'The shadow lowers the sensed light. The petals open and the light becomes available.':'Low ambient light opens the petals and enables the light.';
    if(open&&state.intensity===0)message+=' Intensity is at zero, so the LEDs remain off.';
    else if(open&&state.breathing)message+=reduced.matches?' Breathing mode is selected; its animation is held still for reduced motion.':' Breathing mode gently raises and lowers the glow.';
    else if(open)message+=' Adjust the intensity or try breathing mode.';
    if($('#bloom-explanation').textContent!==message)$('#bloom-explanation').textContent=message;
    window.shyBloomModel.setOpen(open);
    syncPlayback();
  }
  function syncPlayback(){stage.classList.toggle('is-playing',visible&&!document.hidden&&!reduced.matches)}
  $('#ambient-light').addEventListener('input',e=>{state.ambient=Number(e.target.value);renderBloom()});
  $('#led-brightness').addEventListener('input',e=>{state.intensity=Number(e.target.value);renderBloom()});
  function toggleShadow(){state.shadow=!state.shadow;renderBloom()}
  $('#shade-button').addEventListener('click',toggleShadow);$('#flower-touch').addEventListener('click',toggleShadow);
  $('#flower-touch').addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){state.hover=true;renderBloom()}});
  $('#flower-touch').addEventListener('pointerleave',()=>{state.hover=false;renderBloom()});
  $('#breathing-button').addEventListener('click',()=>{state.breathing=!state.breathing;renderBloom()});
  $('#reset-bloom').addEventListener('click',()=>{Object.assign(state,{ambient:80,intensity:65,shadow:false,hover:false,breathing:false});$('#ambient-light').value=80;$('#led-brightness').value=65;stage.dataset.view='prototype';select('[data-model-view]','modelView','prototype');renderBloom()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)state.hover=false;renderBloom()});
  reduced.addEventListener('change',renderBloom);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncPlayback()},{threshold:.05}).observe(stage);else visible=true;
  group('[data-model-view]','modelView',view=>{stage.dataset.view=view;select('[data-model-view]','modelView',view)});
  renderBloom();
  // Separate views show the same coupled movement without overlapping every component.
  $('#gear-wheel').innerHTML=Array.from({length:20},(_,i)=>`<rect x="187" y="148" width="6" height="12" rx="1" transform="rotate(${i*18} 190 190)"/>`).join('')+'<circle cx="190" cy="190" r="33"/><circle cx="190" cy="190" r="8" fill="#f0ece4"/>';
  group('[data-motion-step]','motionStep',step=>{
    select('[data-motion-step]','motionStep',step);
    $$('[data-motion-panel]').forEach(panel=>panel.classList.toggle('is-current',panel.dataset.motionPanel===step));
  });
  let motionFrame=0,position=0;
  function drawMechanism(value){
    position=value;const p=value/100,d=176-90*p,cos=d/180,sin=Math.sqrt(1-cos*cos),x=150,y=60;
    for(const [side,sign] of [['left',-1],['right',1]]){
      const end=[x+sign*148*sin,y+148*cos],joint=[x+sign*90*sin,y+90*cos];
      $('#rib-'+side).setAttribute('d',`M${x} ${y}L${end.join(' ')}`);
      $('#link-'+side).setAttribute('d',`M${x} ${y+d}L${joint.join(' ')}`);
      $('#joint-'+side).setAttribute('cx',joint[0]);$('#joint-'+side).setAttribute('cy',joint[1]);
    }
    $('#sliding-ring').setAttribute('y',y+d-8);
    $('#lift-ring').setAttribute('y',207-90*p);
    $('#lift-caption').setAttribute('transform',`translate(0 ${-90*p})`);
    $('#moving-rack').setAttribute('transform',`translate(0 ${-90*p})`);
    $('#gear-wheel').setAttribute('transform',`rotate(${value*1.6} 190 190)`);
  }
  function travel(value,animate){
    cancelAnimationFrame(motionFrame);motionFrame=0;
    $('#mechanism-travel').value=value;$('#travel-value').textContent=value+'%';$('#mechanism-state').textContent=value===0?'Closed':value===100?'Open':'Opening / '+value+'%';select('[data-travel]','travel',value);
    if(!animate||reduced.matches){drawMechanism(value);return}
    const start=position,t0=performance.now();
    const tick=now=>{const t=Math.min(1,(now-t0)/650),e=1-Math.pow(1-t,3);drawMechanism(start+(value-start)*e);if(t<1)motionFrame=requestAnimationFrame(tick);else motionFrame=0};motionFrame=requestAnimationFrame(tick);
  }
  $('#mechanism-travel').addEventListener('input',e=>travel(Number(e.target.value),false));group('[data-travel]','travel',v=>travel(Number(v),true));drawMechanism(0);
  reduced.addEventListener('change',()=>{if(reduced.matches)travel(Number($('#mechanism-travel').value),false)});
  const parts={
    sensor:['Light sensor','Read the light, at the top.','The LDR sits at the top of the pillar, where a hand or changing room light can affect its reading.','sensor','Original prototype detail of the LDR at the flower centre'],
    rings:['Fixed + sliding rings','Give each ring a different job.','The fixed upper ring anchors the arms. The lower ring travels with the rack and drives their coordinated movement.','lower-ring','Original CAD detail of the lower ring and linked arms'],
    drive:['Rack + pinion','Translate rotation into travel.','The servo turns the gear. Its teeth engage the vertical rack, moving the lower ring to open or close the flower.','rack','Original CAD detail of the rack and its connection to the moving ring'],
    guides:['Rack guides','Keep the motion on track.','Guiding supports constrain unwanted movement of the rack. The physical build added front/back supports and side pieces to improve alignment.','guides','Original CAD detail of the rotating supports that guide the rack']
  };
  function part(key){select('[data-part]','part',key);const item=parts[key];$('#part-keyword').textContent=item[0];$('#part-keyword').dataset.partLabel=key;appear($('#part-keyword'));$('#part-title').textContent=item[1];$('#part-copy').textContent=item[2];picture($('#part-image'),item[3],item[4])}
  group('.assembly-map [data-part]','part',part);group('.part-tabs [data-part]','part',part);
  const fixes={
    joints:['The beams were not held firmly and could shift sideways.','Washers on both sides of each beam and two nuts — one to secure the joint and one to lock it — reduce unwanted movement.','joint-after','Original prototype joint detail showing washers and nuts at the arm connection','Joint detail / Physical prototype, page 5'],
    slots:['An overly long hollow section allowed excess travel and inconsistent linkage angles.','The team shortened the slotted section of the longer beam so the shorter beam stayed at the intended connection point through the motion.','linkage-prototype','Original physical linkage prototype illustrating the arm and slot arrangement','Linkage assembly / Physical prototype, page 5'],
    rack:['The rack drifted forward and backward during vertical travel, making the structure inconsistent.','Two round supports guide the front and back, while two wood pieces constrain the left and right sides.','rack-prototype','Original prototype rack detail showing wood guides and the gear drive','Rack guidance / Physical prototype, page 5'],
    motion:['The servo’s visible movement was difficult to slow and control.','The movement command was divided into small increments. This addresses the pace of motion in software, alongside the mechanical refinements.','code-stepping','Original source code excerpt showing incremental servo commands and a delay','Motion refinement / Source code excerpt, page 5']
  };
  group('[data-fix]','fix',key=>{select('[data-fix]','fix',key);const f=fixes[key];$('#fix-problem').textContent=f[0];$('#fix-response').textContent=f[1];picture($('#fix-image'),f[2],f[3]);$('#fix-caption').textContent=f[4]});
  if(!reduced.matches&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target)}}),{threshold:.06});$$('[data-reveal]').forEach(el=>{el.classList.add('bloom-reveal');observer.observe(el)})}
})();
