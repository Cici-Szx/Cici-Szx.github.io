/* An illustrative perspective model of the prototype, with a coupled umbrella linkage. */
(() => {
  'use strict';
  const art=document.querySelector('#flower-art');
  const project=([x,y,z])=>[300+x*.92-y*.48,422+x*.22+y*.38-z*1.04];
  const pt=p=>project(p).map(n=>n.toFixed(2)).join(',');
  const polygon=(ps,fill,extra='')=>`<path d="M${ps.map(pt).join('L')}Z" fill="${fill}" ${extra}/>`;
  const rod=(a,b,w=5)=>`<path d="M${pt(a)}L${pt(b)}" fill="none" stroke="#eee9dc" stroke-width="${w}" stroke-linecap="round"/><path d="M${pt(a)}L${pt(b)}" fill="none" stroke="#fffdf0" stroke-opacity=".55" stroke-width="1"/>`;
  const disc=(r,z,fill)=>polygon(Array.from({length:40},(_,i)=>{let a=i*Math.PI/20;return[r*Math.cos(a),r*Math.sin(a),z]}),fill);
  const collar=z=>`<g>${polygon([[-22,-17,z], [22,-17,z],[22,17,z],[-22,17,z]],'#faf7e9')}${polygon([[-22,17,z], [22,17,z],[22,17,z-10],[-22,17,z-10]],'#d6d6c9')}${polygon([[22,-17,z],[22,17,z],[22,17,z-10],[22,-17,z-10]],'#b4b9ac')}</g>`;
  art.innerHTML=`<defs><linearGradient id="model-column"><stop stop-color="#c6caba"/><stop offset=".45" stop-color="#faf5df"/><stop offset="1" stop-color="#9da99a"/></linearGradient><radialGradient id="model-glow"><stop stop-color="#ffe3a3" stop-opacity=".75"/><stop offset="1" stop-color="#ffd898" stop-opacity="0"/></radialGradient><pattern id="model-grass" width="9" height="11" patternUnits="userSpaceOnUse"><rect width="9" height="11" fill="#546b40"/><path d="M1 11l2-6M5 8l1-7M8 11L6 5" stroke="#8b9755" stroke-width=".7" opacity=".65"/></pattern></defs><ellipse cx="300" cy="430" rx="180" ry="26" fill="#243728" opacity=".12"/><g id="model-base"></g><g id="model-back"></g><g id="model-core"></g><g id="model-front"></g>`;
  const base=document.querySelector('#model-base'),back=document.querySelector('#model-back'),core=document.querySelector('#model-core'),front=document.querySelector('#model-front');
  base.innerHTML=polygon([[-108,-84,12],[108,-84,12],[108,84,12],[-108,84,12]],'url(#model-grass)')+polygon([[-108,84,12],[108,84,12],[108,84,-12],[-108,84,-12]],'#e4e1d3')+polygon([[108,-84,12],[108,84,12],[108,84,-12],[108,-84,-12]],'#bfc5b7');
  let amount=0,target=0,frame=0;
  function draw(value){
    amount=value;
    const angle=(12+30*value)*Math.PI/180,s=Math.sin(angle),c=Math.cos(angle),ring=230-124*c;
    const petals=[];
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4,radial=(r,z,w=0)=>[Math.cos(a)*r-Math.sin(a)*w,Math.sin(a)*r+Math.cos(a)*w,z];
      const root=radial(19,230),joint=radial(19+62*s,230-62*c),tip=radial(19+110*s,230-110*c);
      let geometry=rod(root,tip)+rod(radial(19,ring),joint,3.5);
      const j=project(joint);geometry+=`<circle cx="${j[0]}" cy="${j[1]}" r="3.2" fill="#a9aa99" stroke="#f5f0df" stroke-width="1"/>`;
      // A compact cup: neighbouring petals overlap and their upper edges curl inward.
      const frontFacing=Math.max(0,(Math.cos(a)*.22+Math.sin(a)*.38)/Math.hypot(.22,.38));
      const point=(u,v)=>{
        const width=64*(.64+.36*value)*Math.pow(Math.sin(Math.PI*u),.32)*(1+.065*Math.sin(u*42+i));
        const ripple=Math.sin(u*35+i*2)*1.8+Math.sin(u*63+i)*.8;
        const r=19+110*s+u*(16+10*value)+Math.sin(Math.PI*u)*10-14*value*u*u+(v*v)*8;
        const z=230-110*c+u*(132+28*value)-14*u*u-35*value*frontFacing*u+(Math.abs(v)*ripple);
        return radial(r,z,v*width);
      };
      geometry+=rod(tip,point(.82,0),3);
      let paper='';
      for(let row=0;row<12;row++)for(let col=0;col<3;col++){
        const u=row/12,v=-1+col*2/3,brightness=53+8*Math.sin(a)+1.2*Math.sin(row*2.4+col+i);
        paper+=polygon([point(u,v),point((row+1)/12,v),point((row+1)/12,v+2/3),point(u,v+2/3)],`hsl(${8+i%3*2} 57% ${brightness}%)`,'stroke="none"');
      }
      for(let seam=0;seam<5;seam++){
        const v=(seam-2)/2.5;paper+=`<path d="M${Array.from({length:13},(_,n)=>pt(point(n/12,v))).join('L')}" fill="none" stroke="#f4b19a" stroke-width=".55" opacity=".15"/>`;
      }
      geometry+=`<g class="prototype-paper">${paper}</g>`;
      petals.push({depth:Math.cos(a)*.22+Math.sin(a)*.38,geometry});
    }
    petals.sort((a,b)=>a.depth-b.depth);
    back.innerHTML=petals.filter(p=>p.depth<0).map(p=>p.geometry).join('');
    front.innerHTML=petals.filter(p=>p.depth>=0).map(p=>p.geometry).join('');
    let middle=polygon([[-15,-12,20],[15,-12,20],[15,-12,229],[-15,-12,229]],'#aab6a4')+polygon([[-15,12,20],[15,12,20],[15,12,229],[-15,12,229]],'url(#model-column)')+polygon([[15,-12,20],[15,12,20],[15,12,229],[15,-12,229]],'#b5c0ae');
    const light=project([0,15,158]);
    middle+=`<g id="flower-light"><g class="model-light-pulse"><ellipse cx="${light[0]}" cy="${light[1]}" rx="74" ry="115" fill="url(#model-glow)"/>`;
    for(let n=0;n<5;n++){const led=project([0,16,115+n*19]);middle+=`<circle cx="${led[0]}" cy="${led[1]}" r="4" fill="#fff2bd"/>`}
    middle+='</g></g>';
    // Rack and gear remain visibly connected to the sliding collar.
    middle+=rod([20,0,ring-5],[50,0,ring-5],5)+rod([50,0,12],[50,0,ring+30],7);
    for(let z=12+ring%6;z<ring+30;z+=6)middle+=rod([50,0,z],[56,0,z],2);
    middle+=polygon([[67,-8,13],[88,-8,13],[88,-8,50],[67,-8,50]],'#788471');
    const gear=[];for(let n=0;n<80;n++){const theta=n*Math.PI/40+value*2.5,r=n%4<2?27:23;gear.push([81+Math.cos(theta)*r,1,53+Math.sin(theta)*r])}
    middle+=polygon(gear,'#e2d7ab','stroke="#bcb796" stroke-width="1"');
    const axle=project([81,1,53]);middle+=`<circle cx="${axle[0]}" cy="${axle[1]}" r="3" fill="#8d967d"/>`;
    middle+=collar(ring)+collar(230)+disc(6,232,'#756e56');
    core.innerHTML=middle;
    art.dataset.openness=value.toFixed(3);
  }
  function setOpen(open){
    const next=open?1:0;if(next===target&& !matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    target=next;cancelAnimationFrame(frame);
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){draw(target);return}
    const start=amount,time=performance.now();
    function tick(now){const t=Math.min(1,(now-time)/1100),ease=t*t*(3-2*t);draw(start+(target-start)*ease);if(t<1)frame=requestAnimationFrame(tick)}
    frame=requestAnimationFrame(tick);
  }
  draw(0);window.shyBloomModel={setOpen};
})();
