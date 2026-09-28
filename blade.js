(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const base = 'assets/blade/';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const datasets = {
    initial: {
      cfrp: {stress:101.76,deflection:7.65,frequency:69.37,mass:.81,insight:'The inner curve is the critical region. CFRP is lighter than aluminium, but the initial geometry still concentrates stress in the bend.'},
      al: {stress:102.37,deflection:6.99,frequency:54.54,mass:1.58,insight:'Slightly less deflection, but almost twice the mass of CFRP and a lower first natural frequency. The same inner bend remains critical.'}
    },
    refined: {
      cfrp: {stress:76.26,deflection:5.30,frequency:71.12,mass:.80,insight:'The preferred combination in this study: lower peak stress, higher first natural frequency and 0.80 kg estimated mass. The inner bend remains the stress-critical region.'},
      al: {stress:76.49,deflection:4.85,frequency:55.92,mass:1.57,insight:'Geometry refinement also benefits aluminium. It deflects less than CFRP, but retains the higher mass and lower first natural frequency.'}
    }
  };
  const units = {stress:'MPa',deflection:'mm',frequency:'Hz',mass:'kg'};
  const names = {stress:'Peak equivalent stress',deflection:'Maximum deformation',frequency:'First natural frequency'};
  const mesh = {
    initial:{stress:[94.95,101.25,101.76],deflection:[7.63,7.64,7.65],frequency:[70.14,69.76,69.37]},
    refined:{stress:[77.13,76.40,76.26],deflection:[5.296,5.2945,5.3045],frequency:[71.53,71.62,71.12]}
  };
  function pressed(selector, attr, value) { $$(selector).forEach(b => b.setAttribute('aria-pressed', String(b.dataset[attr] === String(value)))); }
  // Set source immediately so rapid selections and the image viewer always use the latest case.
  function swapImage(img, filename, alt) {
    img.src = base + filename;
    img.alt = alt;
    if (!reduced.matches && img.animate) img.animate([{opacity:.4},{opacity:1}],{duration:300,easing:'ease-out'});
  }
  function group(selector, attr, callback) {
    const buttons=$$(selector);
    buttons.forEach((b,i) => {
      b.addEventListener('click',()=>callback(b.dataset[attr]));
      b.addEventListener('keydown', e=> {
        let n;
        if(e.key==='ArrowRight'||e.key==='ArrowDown') n=(i+1)%buttons.length;
        if(e.key==='ArrowLeft'||e.key==='ArrowUp') n=(i+buttons.length-1)%buttons.length;
        if(e.key==='Home') n=0;
        if(e.key==='End') n=buttons.length-1;
        if(n===undefined)return;
        e.preventDefault();buttons[n].focus();buttons[n].click();
      });
    });
  }
  const loads={
    support:['support.png','Report Figure 1: fixed socket support','The upper attachment is fixed to represent the socket connection. This restraint defines how the blade carries the applied load.'],
    normal:['normal-load.png','Report Figure 2: 2,100 N normal force on the bottom surface','A 2,100 N normal reaction is applied at the bottom surface. The curved blade carries this force back toward the fixed socket.'],
    friction:['friction-load.png','Report Figure 3: 500 N backward friction on the bottom surface','A 500 N backward friction force acts alongside the normal reaction. Both loads are included in the reported static case.']
  };
  group('[data-load]','load',value=> {
    pressed('[data-load]','load',value);$('.load-visual').dataset.active=value;
    $('#load-copy').textContent=loads[value][2];swapImage($('#load-image'),loads[value][0],loads[value][1]);
  });
  let design='initial',material='cfrp',view='stress';
  function renderResult(){
    const d=datasets[design][material], label=`${design==='initial'?'Initial':'Refined'} ${material==='cfrp'?'CFRP':'aluminium'}`;
    pressed('[data-design]','design',design);pressed('[data-material]','material',material);pressed('[data-view]','view',view);
    $('#result-name').textContent=label.toUpperCase();$('#result-insight').textContent=d.insight;
    Object.keys(units).forEach(key=>{
      $('#value-'+key).innerHTML=`${d[key].toFixed(2)} <small>${units[key]}</small>`;
      $('#bar-'+key).style.width=(d[key]/{stress:110,deflection:8,frequency:80,mass:1.7}[key]*100)+'%';
    });
    const detail=view==='modes'?`First natural frequency ${d.frequency.toFixed(2)} Hz. Original ANSYS mode table.`:view==='stress'?`Peak ${d.stress.toFixed(2)} MPa. Original ANSYS equivalent-stress contour with its own legend.`:`Maximum ${d.deflection.toFixed(2)} mm (rounded). Original ANSYS total-deformation contour with its own legend.`;
    swapImage($('#result-image'),`${design}-${material}-${view}.${view==='modes'?'png':'jpeg'}`,`${label}, fine mesh: ${detail}`);
    $('.contour-frame').dataset.analysis=view;
  }
  group('[data-design]','design',v=>{design=v;renderResult()});
  group('[data-material]','material',v=>{material=v;renderResult()});
  group('[data-view]','view',v=>{view=v;renderResult()});
  renderResult();
  const changes={radius:['01 / RADIUS','Ease the transition.','The initial peak stress sits on the inside of the curve. Increasing the radius makes this transition less abrupt, targeting the observed concentration.'],thickness:['02 / LOCAL THICKNESS','Add material with purpose.','The baseline is approximately 15 mm thick. The refined design thickens the most highly stressed bending region to 18 mm, placing material where the analysis indicates it is needed.'],foot:['03 / FOREFOOT','Shorten the reach.','A shorter front foot is part of the refinement. Together with the larger radius and thicker bend, the design reduces estimated CFRP mass from 0.81 to 0.80 kg and produces a stiffer response.']};
  const geometryKeywords={radius:'Larger inner radius',thickness:'18 mm bend',foot:'Shorter forefoot'};
  function change(v){
    pressed('[data-change]','change',v);
    $('#change-number').textContent=changes[v][0];
    $('#change-title').textContent=changes[v][1];
    $('#change-copy').textContent=changes[v][2];
    const keyword=$('#geometry-keyword');
    keyword.textContent=geometryKeywords[v];
    keyword.dataset.for=v;
    keyword.hidden=false;
    keyword.getAnimations().forEach(animation=>animation.cancel());
    if(!reduced.matches) keyword.animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'ease-out'});
  }
  group('.geometry-image [data-change]','change',change);group('.geometry-copy [data-change]','change',change);
  let meshDesign='initial',metric='stress',step=2;
  const stages=['Coarse','Medium','Fine'];
  function renderMesh(){
    const values=mesh[meshDesign][metric],unit=units[metric],precision=metric==='deflection'&&meshDesign==='refined'?4:2;
    pressed('[data-mesh-design]','meshDesign',meshDesign);pressed('[data-mesh-metric]','meshMetric',metric);pressed('[data-mesh-step]','meshStep',step);
    const min=Math.min(...values),max=Math.max(...values),pad=Math.max((max-min)*.25,.008),lo=min-pad,hi=max+pad;
    const points=values.map((v,i)=>[85+i*225,230-(v-lo)/(hi-lo)*190]);
    $('#chart-line').setAttribute('d',points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '));
    $('#chart-points').innerHTML=points.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" class="${i===step?'active':''}"/>`).join('');
    $('#axis-high').textContent=hi.toFixed(metric==='deflection'?3:1);$('#axis-mid').textContent=((hi+lo)/2).toFixed(metric==='deflection'?3:1);$('#axis-low').textContent=lo.toFixed(metric==='deflection'?3:1);
    $('#chart-unit').textContent=names[metric]+' / '+unit;
    $('#chart-description').textContent=`${meshDesign} CFRP ${names[metric]}. ${values.map((v,i)=>stages[i]+' '+v+' '+unit).join('; ')}. Selected: ${stages[step]}.`;
    $('#chart-title').textContent=`${meshDesign} CFRP ${metric} convergence`;
    $('#mesh-step').value=step;$('#mesh-step').setAttribute('aria-valuetext',`${stages[step]}, global/local mesh ${['22/11','16/8','10/5'][step]} millimetres`);
    $('#mesh-step-label').textContent=stages[step]+' · '+values[step].toFixed(precision)+' '+unit;$('#mesh-readout-label').textContent=`${stages[step]} MESH / ${metric}`.toUpperCase();
    $('#mesh-value').innerHTML=values[step].toFixed(precision)+` <small>${unit}</small>`;
    const delta=step===0?null:Math.abs((values[step]-values[step-1])/values[step-1])*100;
    $('#mesh-delta').textContent=delta===null?'Starting point':delta.toFixed(2)+'%';
    $('#mesh-verdict').textContent=delta===null?'The first solve sets a reference. Refine once to compare successive results.':delta<1?'Change from the previous mesh. Below the 1% criterion.':'Change from the previous mesh. Above 1% — refine again to check stability.';
    $('.mesh-grid-demo').style.setProperty('--cell',[28,17,10][step]+'px');
  }
  group('[data-mesh-design]','meshDesign',v=>{meshDesign=v;renderMesh()});
  group('[data-mesh-metric]','meshMetric',v=>{metric=v;renderMesh()});
  group('[data-mesh-step]','meshStep',v=>{step=Number(v);renderMesh()});
  $('#mesh-step').addEventListener('input',e=>{step=Number(e.target.value);renderMesh()});renderMesh();
  if(!reduced.matches&&'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target)}}),{threshold:.06});
    $$('[data-reveal]').forEach(el=>{el.classList.add('blade-reveal');observer.observe(el)});
  }
})();
