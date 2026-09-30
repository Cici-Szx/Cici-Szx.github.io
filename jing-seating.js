/* Photo-informed, illustrative model. Dimensions are proportional, not CAD measurements. */
import * as THREE from './assets/vendor/three/three.module.min.js';
const host = document.querySelector('#seat-scene');
const fallback = document.querySelector('#seat-scene-fallback');
const status = document.querySelector('#seat-scene-status');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try { renderer = new THREE.WebGLRenderer({antialias:true,alpha:true}); }
catch { status.textContent='Original prototype view'; host.dataset.ready='false'; document.querySelectorAll('[data-seat-view]').forEach(b=>b.disabled=true); }
if (renderer) init();
function init() {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-3,3,2,-2,.1,50);
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<650?1.5:2));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
  scene.add(new THREE.HemisphereLight(0xfff9ec,0x627b6c,2.5));
  const light=new THREE.DirectionalLight(0xfff7e4,3.5);light.position.set(-3,6,5);light.castShadow=true;
  light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:20});light.shadow.bias=-.0007;light.shadow.normalBias=.025;scene.add(light);
  const fill=new THREE.DirectionalLight(0xb8d8cf,1.2);fill.position.set(4,3,-4);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.ShadowMaterial({opacity:.23}));floor.rotation.x=-Math.PI/2;floor.position.y=-.017;floor.receiveShadow=true;scene.add(floor);
  const L=.72,W=.70,T=.038;
  const materials=[0xe9e5d7,0xd8decb,0xc7d0b5].map(color=>new THREE.MeshStandardMaterial({color,roughness:.65,metalness:0}));
  // A continuous profile across the three equal-width pieces: low foot, concave seat, inclined back.
  const curves=[
    new THREE.CubicBezierCurve(new THREE.Vector2(-L/2,.035),new THREE.Vector2(-.15,.54),new THREE.Vector2(.03,.66),new THREE.Vector2(L/2,.55)),
    new THREE.CubicBezierCurve(new THREE.Vector2(-L/2,.55),new THREE.Vector2(-.12,.38),new THREE.Vector2(.15,.40),new THREE.Vector2(L/2,.64)),
    new THREE.CubicBezierCurve(new THREE.Vector2(-L/2,.64),new THREE.Vector2(-.12,.92),new THREE.Vector2(.19,1.34),new THREE.Vector2(L/2,1.52))
  ];
  function extrusion(points,depth,material,z){
    const shape=new THREE.Shape(points);const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.004,bevelThickness:.004,curveSegments:24});
    const mesh=new THREE.Mesh(geo,material);mesh.position.z=z;mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
  }
  function box(group,w,h,d,x,y,z,material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
  const modules=curves.map((curve,i)=>{
    const group=new THREE.Group(),top=curve.getPoints(48),material=materials[2-i];
    group.add(extrusion([...top,...top.map(p=>new THREE.Vector2(p.x,Math.max(.009,p.y-T))).reverse()],W,material,-W/2));
    // Thin printed frames at both sides; open bays remain visible from the default viewpoint.
    const upper=top.filter(p=>p.y>.12&&p.x>-L/2+.025&&p.x<L/2-.025);
    for(const z of [-W/2,W/2-T]){
      const outer=new THREE.Shape([new THREE.Vector2(-L/2,0),new THREE.Vector2(L/2,0),...top.slice().reverse()]);
      if(upper.length>2){const hole=new THREE.Path();hole.moveTo(upper[0].x,.05);for(const p of upper)hole.lineTo(p.x,p.y-.065);hole.lineTo(upper.at(-1).x,.05);hole.closePath();outer.holes.push(hole);}
      const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(outer,{depth:T,bevelEnabled:false,steps:1}),material);mesh.position.z=z;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
    }
    box(group,L,.032,W,0,.016,0,material);
    if(i===2)box(group,.034,1.52,W,L/2-.017,.76,0,material);
    if(i===2)for(const z of [-W/2+T/2,W/2-T/2])box(group,L,.045,T,0,.62,z,material);
    scene.add(group);return group;
  });
  const labels=['Leg-rest','Seat','Backrest'].map((name,i)=>{const span=document.createElement('span');span.className='seat-object-label';span.textContent=name;span.style.setProperty('--module-color',['#c7d0b5','#d8decb','#e9e5d7'][i]);host.append(span);return span;});
  const PI=Math.PI;
  // Independent rigid pieces: no invented hinge. Share turns two pieces onto their flat bases.
  const layouts={
    rest:[{p:[-.746,0,0],r:[0,0,0]},{p:[0,0,0],r:[0,0,0]},{p:[.746,0,0],r:[0,0,0]}],
    share:[{p:[.52,.582,0],r:[PI,0,0]},{p:[-.225,.645,0],r:[PI,0,0]},{p:[-.70,.36,0],r:[0,0,PI/2]}],
    gather:[{p:[-1.02,0,.58],r:[0,-.30,0]},{p:[.10,0,-.70],r:[0,PI+.24,0]},{p:[1.4,.36,.60],r:[0,PI-.28,-PI/2]}]
  };
  const views={perspective:[-2.8,2.1,5.6],side:[0,.85,7],above:[-1.4,6,3]};
  let mode='rest',view='perspective',frame=0,animation=null,from=[],target=[];
  let cameraFrom=new THREE.Vector3(),cameraTo=new THREE.Vector3(...views[view]);camera.position.copy(cameraTo);
  const lookAt=new THREE.Vector3(0,.58,0);
  function transforms(key){return layouts[key].map(s=>({position:new THREE.Vector3(...s.p),quaternion:new THREE.Quaternion().setFromEuler(new THREE.Euler(...s.r))}));}
  function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);const aspect=w/h;const half=Math.max(1.38,2.0/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();draw();}
  function draw(){
    camera.lookAt(lookAt);camera.updateMatrixWorld();scene.updateMatrixWorld(true);renderer.render(scene,camera);
    const w=host.clientWidth,h=host.clientHeight;
    const placed=[];
    modules.forEach((m,i)=>{
      const bounds=new THREE.Box3().setFromObject(m),p=bounds.getCenter(new THREE.Vector3());p.y=bounds.max.y+.13;p.project(camera);
      const label=labels[i],lw=label.offsetWidth,lh=label.offsetHeight;
      let x=Math.max(lw/2+4,Math.min(w-lw/2-4,(p.x*.5+.5)*w)),y=Math.max(lh+4,Math.min(h-4,(-p.y*.5+.5)*h));
      for(const prev of placed)if(x-lw/2<prev.right+4&&x+lw/2>prev.left-4&&y-lh<prev.bottom+4&&y>prev.top-4)y=Math.min(h-4,prev.bottom+lh+6);
      label.style.left=`${x}px`;label.style.top=`${y}px`;placed.push({left:x-lw/2,right:x+lw/2,top:y-lh,bottom:y});
    });
  }
  function tick(now){frame=0;const t=Math.min(1,(now-animation)/950),ease=t*t*(3-2*t);
    modules.forEach((m,i)=>{m.position.lerpVectors(from[i].position,target[i].position,ease);m.quaternion.slerpQuaternions(from[i].quaternion,target[i].quaternion,ease);if(t<1)m.position.y+=Math.sin(t*PI)*.22;});
    camera.position.lerpVectors(cameraFrom,cameraTo,ease);draw();if(t<1)frame=requestAnimationFrame(tick);else{animation=null;host.dataset.moving='false';}
  }
  function choose(nextMode=mode,nextView=view){
    mode=nextMode;view=nextView;cancelAnimationFrame(frame);from=modules.map(m=>({position:m.position.clone(),quaternion:m.quaternion.clone()}));target=transforms(mode);cameraFrom.copy(camera.position);cameraTo.set(...views[view]);
    host.dataset.arrangement=mode;host.dataset.view=view;host.dataset.moving=String(!reduced.matches);host.setAttribute('aria-label',`3D seating model: ${mode} arrangement, ${view} view. Three labelled modules: backrest, seat and leg-rest.`);
    document.querySelectorAll('[data-seat-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.seatView===view)));
    if(reduced.matches){modules.forEach((m,i)=>{m.position.copy(target[i].position);m.quaternion.copy(target[i].quaternion)});camera.position.copy(cameraTo);draw();host.dataset.moving='false';}
    else{animation=performance.now();frame=requestAnimationFrame(tick);}
  }
  transforms(mode).forEach((t,i)=>{modules[i].position.copy(t.position);modules[i].quaternion.copy(t.quaternion)});
  document.querySelectorAll('[data-seat]').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.seat)));
  document.querySelectorAll('[data-seat-view]').forEach(b=>b.addEventListener('click',()=>choose(mode,b.dataset.seatView)));
  new ResizeObserver(resize).observe(host);resize();
  fallback.hidden=true;status.textContent='Select a layout to rearrange the modules.';host.dataset.ready='true';host.dataset.arrangement=mode;host.dataset.view=view;
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);fallback.hidden=false;status.textContent='Original prototype view';host.dataset.ready='false';});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{resize();fallback.hidden=true;host.dataset.ready='true';status.textContent='Select a layout to rearrange the modules.';});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&frame){cancelAnimationFrame(frame);modules.forEach((m,i)=>{m.position.copy(target[i].position);m.quaternion.copy(target[i].quaternion)});camera.position.copy(cameraTo);animation=null;frame=0;host.dataset.moving='false';}else if(!document.hidden)draw();});
}
