(() => {
  'use strict';
  // Transcribed from Vela's disassembly tree, Figma node 555:184.
  // A missing second operation stays unspecified, as in the source.
  const assemblies = {
    back: {name:'Seat back', parts:[
      {id:'back-cushions', name:'Seat back cushions', action:'Lift', outputs:['Pocket']},
      {id:'back-panels', name:'Seat back panels', action:'Draw out', next:'Unscrew', outputs:['Table tray switch','Table tray','Table tray beams']},
      {id:'back-pillars', name:'Connecting pillars · back frame', action:'Rotate'},
      {id:'back-beams', name:'Back frame beams', action:'Unscrew'}
    ]},
    base: {name:'Seat base', parts:[
      {id:'seat-cushions', name:'Seat cushions', action:'Lift'},
      {id:'armrest', name:'Armrest', action:'Unscrew', next:'Unscrew', outputs:['Electronics','Control panel']},
      {id:'base-support', name:'Base support', action:'Unscrew', next:'Unscrew', outputs:['X-shape base support','Seat base hinges']},
      {id:'balancing-tube', name:'Balancing tube', action:'Unscrew'},
      {id:'base-pillars', name:'Connecting pillars · base support', action:'Rotate', next:'Unscrew', outputs:['Charging socket']}
    ]}
  };
  const root = document.querySelector('.disassembly-explorer');
  if (!root) return;
  const graph = root.querySelector('#disassembly-graph');
  const svgNS = 'http://www.w3.org/2000/svg';
  const edges = [];
  const nodes = [];
  const disclosures = [];
  let selection = null;
  let frame = 0;
  const svg = document.createElementNS(svgNS,'svg');
  svg.classList.add('tree-connectors');
  svg.setAttribute('aria-hidden','true');
  const defs = document.createElementNS(svgNS,'defs');
  for (const [id,color] of [['tree-arrow','#b7bfad'],['tree-arrow-active','#637d50']]) {
    const marker = document.createElementNS(svgNS,'marker');
    marker.id = id; marker.setAttribute('viewBox','0 0 8 8'); marker.setAttribute('refX','7'); marker.setAttribute('refY','4'); marker.setAttribute('markerWidth','5'); marker.setAttribute('markerHeight','5'); marker.setAttribute('orient','auto');
    const arrow = document.createElementNS(svgNS,'path'); arrow.setAttribute('d','M0 0 L8 4 L0 8 Z'); arrow.setAttribute('fill',color); marker.append(arrow); defs.append(marker);
  }
  svg.append(defs); graph.append(svg);
  function element(tag,cls,text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }
  function connect(from,to,branch=null,part=null,output=null) {
    const path = document.createElementNS(svgNS,'path');
    path.setAttribute('marker-end','url(#tree-arrow)'); svg.append(path);
    edges.push({from,to,branch,part,output,path});
  }
  function node(name,type,branch=null,part=null,output=null) {
    const button = element('button','graph-node node-'+type);
    button.type='button'; button.setAttribute('aria-pressed','false');
    if(type==='action') {
      const symbol = element('span','action-symbol',{'Lift':'↑','Draw out':'⇥','Rotate':'↶','Unscrew':'⟳'}[name]);
      symbol.setAttribute('aria-hidden','true'); button.append(symbol);
    }
    button.append(element('span','',name));
    if(type!=='action') button.addEventListener('click',() => select({branch,part,output,name}));
    nodes.push({button,branch,part,output});
    return button;
  }
  function matches(item) {
    if(!selection) return true;
    if(!item.branch) return true;
    if(item.branch!==selection.branch) return false;
    if(!selection.part || !item.part) return true;
    if(item.part!==selection.part) return false;
    return !selection.output || !item.output || item.output===selection.output;
  }
  function select(value) {
    selection = value?.branch ? value : null;
    graph.classList.toggle('has-selection',!!selection);
    nodes.forEach(item => {
      item.button.classList.toggle('on-path',matches(item));
      const chosen = selection && item.branch===selection.branch && item.part===selection.part && item.output===selection.output;
      if(!item.button.classList.contains('operation-disclosure')) item.button.setAttribute('aria-pressed',String(!!chosen));
    });
    edges.forEach(item => {
      const active = !!selection && matches(item);
      item.path.classList.toggle('on-path',active);
      item.path.classList.toggle('off-path',!!selection && !matches(item));
      item.path.setAttribute('marker-end',active?'url(#tree-arrow-active)':'url(#tree-arrow)');
    });
    let path='Designed seat → Seat back + Seat base';
    if(selection) {
      const assembly=assemblies[selection.branch];
      const part=assembly.parts.find(p=>p.id===selection.part);
      const labels=['Designed seat',assembly.name];
      if(part) {
        labels.push(part.action);
        if(!root.querySelector('#component-'+part.id).hidden) labels.push(part.name);
        if(part.next && !root.querySelector('#next-'+part.id).hidden) labels.push(part.next);
        if(selection.output) labels.push(selection.output);
      }
      path=labels.join(' → ');
    }
    root.querySelector('#disassembly-path').textContent=path;
    root.querySelector('#disassembly-status').textContent=selection?path:'Full disassembly tree shown.';
  }
  const origin=element('div','tree-origin');
  const originNode=node('Designed seat','origin'); origin.append(originNode); graph.append(origin);
  const branches=element('div','tree-branches'); graph.append(branches);
  Object.entries(assemblies).forEach(([key,assembly])=>{
    const section=element('section','graph-branch'); section.setAttribute('aria-label',assembly.name+' disassembly');
    const anchor=element('div','branch-anchor');
    const assemblyNode=node(assembly.name,'module',key); anchor.append(assemblyNode);
    const toggle=element('button','branch-toggle','− Fold branch'); toggle.type='button'; toggle.setAttribute('aria-expanded','true'); toggle.setAttribute('aria-controls','branch-'+key); anchor.append(toggle);
    const rows=element('div','branch-rows'); rows.id='branch-'+key;
    toggle.addEventListener('click',()=>{
      rows.hidden=!rows.hidden;
      toggle.setAttribute('aria-expanded',String(!rows.hidden));
      toggle.textContent=rows.hidden?'+ '+assembly.parts.length+' routes':'− Fold branch';
      section.classList.toggle('is-folded',rows.hidden);
      if(rows.hidden && selection?.branch===key)select({branch:key,part:null,output:null});
      scheduleDraw();
    });
    section.append(anchor,rows); branches.append(section); connect(originNode,assemblyNode,key);
    assembly.parts.forEach(part=>{
      const row=element('div','graph-row'); row.dataset.part=part.id;
      const action=node(part.action,'action',key,part.id);
      const component=node(part.name,part.outputs && part.next?'module':'part',key,part.id);
      const componentCell=element('div','component-cell'); componentCell.id='component-'+part.id; componentCell.append(component);
      const next=element('div','next-operation'); next.id='next-'+part.id;
      const outputs=element('div','graph-outputs'); outputs.id='outputs-'+part.id;
      row.append(action,componentCell,next,outputs); rows.append(row);
      connect(assemblyNode,action,key,part.id); connect(action,component,key,part.id);
      let secondary=null;
      let outputFrom=component;
      if(part.next) {
        const operation=node(part.next,'action',key,part.id);
        next.append(operation); connect(component,operation,key,part.id);
        outputFrom=operation;
        secondary=disclosure(operation,[outputs],part.next+' · '+part.name,key,part.id);
      }
      part.outputs?.forEach(name=>{
        const output=node(name,'part',key,part.id,name);
        outputs.append(output); connect(outputFrom,output,key,part.id,name);
      });
      // The source connects cushions directly to Pocket, without another operation.
      const targets=part.outputs && !part.next?[componentCell,next,outputs]:[componentCell,next];
      const primary=disclosure(action,targets,part.action+' · '+part.name,key,part.id);
      primary.child=secondary;
      outputs.hidden=true;
    });
  });
  function disclosure(button,targets,label,branch,part) {
    button.classList.add('operation-disclosure');
    button.removeAttribute('aria-pressed');
    button.setAttribute('aria-label',label);
    button.setAttribute('aria-controls',targets.map(target=>target.id).join(' '));
    const hint=element('small','operation-hint','Reveal'); button.append(hint);
    const item={button,targets,expanded:false,child:null};
    item.set=function(expanded){
      item.expanded=expanded;
      button.setAttribute('aria-expanded',String(expanded));
      targets.forEach(target=>target.hidden=!expanded);
      hint.textContent=expanded?'Hide':'Reveal';
      if(!expanded && item.child)item.child.set(false);
    };
    item.set(false);
    button.addEventListener('click',()=>{
      item.set(!item.expanded);
      select({branch,part,output:null});
      root.querySelector('#disassembly-status').textContent=label+(item.expanded?': next level revealed.':': next level hidden.');
      scheduleDraw();
    });
    disclosures.push(item);return item;
  }

  function draw() {
    frame=0;
    const bounds=graph.getBoundingClientRect();
    if(!bounds.width || !bounds.height)return;
    svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
    edges.forEach(({from,to,path})=>{
      if(!from.getClientRects().length || !to.getClientRects().length){path.style.display='none';return;}
      path.style.display='';
      const a=from.getBoundingClientRect(),b=to.getBoundingClientRect();
      const x1=a.right-bounds.left+2,y1=a.top+a.height/2-bounds.top;
      const x2=b.left-bounds.left-3,y2=b.top+b.height/2-bounds.top;
      const mid=(x1+x2)/2;
      path.setAttribute('d',`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`);
    });
  }
  function scheduleDraw(){if(!frame)frame=requestAnimationFrame(draw);}
  root.querySelector('.tree-reset').addEventListener('click',()=>{
    root.querySelectorAll('.branch-rows').forEach(row=>row.hidden=false);
    root.querySelectorAll('.graph-branch').forEach(branch=>branch.classList.remove('is-folded'));
    root.querySelectorAll('.branch-toggle').forEach(toggle=>{toggle.setAttribute('aria-expanded','true');toggle.textContent='− Fold branch';});
    disclosures.forEach(item=>item.set(true));
    select(null);scheduleDraw();
    root.querySelector('.tree-scroll').scrollTo({left:0,behavior:'instant'});
  });
  root.querySelector('.tree-collapse').addEventListener('click',()=>{
    disclosures.forEach(item=>item.set(false));
    select(null);scheduleDraw();
    root.querySelector('.tree-scroll').scrollTo({left:0,behavior:'instant'});
    root.querySelector('#disassembly-status').textContent='All operation levels collapsed. Choose a blue operation to begin.';
  });
  new ResizeObserver(scheduleDraw).observe(graph);
  document.fonts.ready.then(scheduleDraw);
  select(null);scheduleDraw();
})();
