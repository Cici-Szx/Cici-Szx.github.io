(() => {
  'use strict';
  const root = document.documentElement;
  const book = document.querySelector('.opening-book');
  const cover = document.querySelector('.landing');
  const about = document.querySelector('.about-page');
  const work = document.querySelector('.work-page');
  const workWash = document.querySelector('.work-wash');
  const experience = document.querySelector('#experience-page');
  const experienceWash = document.querySelector('.experience-wash');
  const wash = document.querySelector('.light-wash');
  const identity = document.querySelector('.identity');
  const statement = document.querySelector('.background-statement');
  const hello = document.querySelector('.hello-position');
  const nav = document.querySelector('.entry-nav');
  const turn = document.querySelector('.cover-turn');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const shortMobile = matchMedia('(max-width: 700px) and (max-height: 740px)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = (a, b, value) => { const x = clamp((value-a)/(b-a)); return x*x*(3-2*x); };
  let pinned = false;
  let viewportHeight = innerHeight;
  let aboutHeight = innerHeight;
  let workHeight = innerHeight;
  let experienceHeight = innerHeight;
  let scrollFrame = 0;
  let navigationFrame = 0;
  let progress = 0;

  function configure() {
    pinned = !reduced.matches && !shortMobile.matches && innerHeight >= 520;
    root.classList.toggle('motion-ready', pinned);
    viewportHeight = document.querySelector('.landing').offsetHeight;
    aboutHeight = Math.max(viewportHeight, about.offsetHeight);
    workHeight = Math.max(viewportHeight, work.offsetHeight);
    experienceHeight = Math.max(viewportHeight, experience.offsetHeight);
    book.style.setProperty('--about-height', `${aboutHeight}px`);
    book.style.setProperty('--work-height', `${workHeight}px`);
    book.style.setProperty('--experience-height', `${experienceHeight}px`);
    root.classList.toggle('long-about', Math.max(aboutHeight, workHeight, experienceHeight) > viewportHeight + 2);
    updateScene();
  }
  function chapterTop(hash) {
    if (hash === '#home') return book.offsetTop;
    if (hash === '#about') return pinned ? book.offsetTop + viewportHeight : about.getBoundingClientRect().top + scrollY;
    if (hash === '#work') return pinned ? book.offsetTop + aboutHeight + viewportHeight : work.getBoundingClientRect().top + scrollY;
    return pinned ? book.offsetTop + aboutHeight + workHeight + viewportHeight : experience.getBoundingClientRect().top + scrollY;
  }
  function revealWash(element, value) {
    const mask = `linear-gradient(to bottom, rgba(0,0,0,${smooth(.42,1,value)}) 0%, rgba(0,0,0,${smooth(.12,.88,value)}) 48%, rgba(0,0,0,${smooth(0,.57,value)}) 100%)`;
    element.style.maskImage = mask;
    element.style.webkitMaskImage = mask;
  }
  function updateScene() {
    scrollFrame = 0;
    progress = clamp((scrollY - book.offsetTop) / viewportHeight);
    if (pinned) {
      const workProgress = clamp((scrollY - book.offsetTop - aboutHeight) / viewportHeight);
      const experienceProgress = clamp((scrollY - book.offsetTop - aboutHeight - workHeight) / viewportHeight);
      wash.style.opacity = 1;
      revealWash(wash, progress);
      revealWash(workWash, workProgress);
      revealWash(experienceWash, experienceProgress);
      identity.style.opacity = 1 - smooth(.02, .38, progress);
      identity.style.transform = `translateY(${-progress*viewportHeight*.17}px)`;
      statement.style.opacity = 1 - smooth(.08, .57, progress);
      statement.style.transform = `translateY(${-progress*viewportHeight*.22}px)`;
      hello.style.opacity = 1 - smooth(.2, .84, progress);
      hello.style.transform = `translate3d(${-progress*4}vw,${-progress*viewportHeight*.29}px,0) scale(${1+progress*.09})`;
      nav.style.opacity = 1 - smooth(0, .27, progress);
      nav.style.transform = `translateY(${-progress*50}px)`;
      turn.style.opacity = 1 - smooth(0, .18, progress);
      about.style.opacity = smooth(.24, .88, progress) * (1-smooth(.08,.7,workProgress));
      const readingOffset = Math.min(Math.max(0, scrollY-book.offsetTop-viewportHeight), aboutHeight-viewportHeight);
      about.style.transform = `translateY(${(1-progress)*viewportHeight*.82-readingOffset-workProgress*viewportHeight*.22}px)`;
      // Only the visible leaf participates in tab order and assistive reading.
      cover.inert = progress > .55;
      about.inert = progress <= .55 || workProgress > .55;
      const workReadingOffset = Math.min(Math.max(0, scrollY-book.offsetTop-aboutHeight-viewportHeight), workHeight-viewportHeight);
      work.style.opacity = smooth(.24,.88,workProgress) * (1-smooth(.08,.7,experienceProgress));
      work.style.transform = `translateY(${(1-workProgress)*viewportHeight*.82-workReadingOffset-experienceProgress*viewportHeight*.22}px)`;
      work.inert = workProgress <= .55 || experienceProgress > .55;
      const experienceReadingOffset = Math.min(Math.max(0, scrollY-book.offsetTop-aboutHeight-workHeight-viewportHeight), experienceHeight-viewportHeight);
      experience.style.opacity = smooth(.24,.88,experienceProgress);
      experience.style.transform = `translateY(${(1-experienceProgress)*viewportHeight*.82-experienceReadingOffset}px)`;
      experience.inert = experienceProgress <= .55;
    } else {
      for (const element of [identity, statement, hello, nav, turn, about, work, experience]) {
        element.style.removeProperty('opacity');
        element.style.removeProperty('transform');
      }
      cover.inert = false;
      about.inert = false;
      work.inert = false;
      experience.inert = false;
    }
    book.classList.toggle('offscreen', scrollY >= book.offsetTop + viewportHeight);
    const chapter = scrollY < viewportHeight*.55 ? 'home' : scrollY < chapterTop('#work')-viewportHeight*.4 ? 'about' : scrollY < chapterTop('#experience')-viewportHeight*.4 ? 'work' : 'experience';
    document.querySelectorAll('.entry-nav a').forEach(link => {
      if (link.hash === '#'+chapter) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
  }
  const requestScene = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScene); };
  addEventListener('scroll', requestScene, { passive: true });
  addEventListener('resize', configure, { passive: true });
  reduced.addEventListener('change', configure);
  shortMobile.addEventListener('change', configure);
  configure();
  const sceneObserver = new ResizeObserver(configure);
  sceneObserver.observe(about);
  sceneObserver.observe(work);
  sceneObserver.observe(experience);
  document.fonts.ready.then(() => {
    configure();
    if (['#home','#about','#work','#experience'].includes(location.hash)) {
      scrollTo({top:chapterTop(location.hash), behavior:'instant'});
      updateScene();
    }
  });

  function cancelNavigation() {
    if (!navigationFrame) return;
    cancelAnimationFrame(navigationFrame);
    navigationFrame = 0;
    root.classList.remove('navigating');
  }
  // Wheel/touch remain native; clicks use a slower, interruptible page turn.
  addEventListener('wheel', cancelNavigation, { passive: true });
  addEventListener('touchstart', cancelNavigation, { passive: true });
  addEventListener('keydown', event => {
    if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)) cancelNavigation();
  });
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.button !== 0) return;
      const target = document.querySelector(link.hash);
      if (!target) return;
      event.preventDefault();
      cancelNavigation();
      const from = scrollY;
      const to = chapterTop(link.hash);
      const duration = reduced.matches ? 0 : Math.min(1750, 1150 + Math.abs(to-from)*.22);
      const start = performance.now();
      root.classList.add('navigating');
      if (location.hash !== link.hash) history.pushState(null, '', link.hash);
      function move(now) {
        const t = duration ? clamp((now-start)/duration) : 1;
        const eased = t*t*t*(t*(t*6-15)+10);
        scrollTo({top:from+(to-from)*eased, behavior:'instant'});
        updateScene();
        if (t < 1) navigationFrame = requestAnimationFrame(move);
        else {
          navigationFrame = 0;
          root.classList.remove('navigating');
          const heading = link.hash === '#about' ? document.querySelector('#about-title') : link.hash === '#work' ? document.querySelector('#work-title') : link.hash === '#experience' ? document.querySelector('#experience-title') : (target.querySelector('h1,h2') || target);
          heading.setAttribute('tabindex','-1');
          heading.focus({preventScroll:true});
          heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), {once:true});
        }
      }
      navigationFrame = requestAnimationFrame(move);
    });
  });
  addEventListener('popstate', () => { cancelNavigation(); requestScene(); });
  addEventListener('pageshow', requestScene);
  // Keep the current chapter and reading position when translated copy changes its height.
  let languageAnchor;
  document.addEventListener('beforelanguagechange', () => {
    cancelNavigation();
    const chapters = ['#home', '#about', '#work', '#experience'];
    const index = chapters.reduce((current, hash, i) => scrollY >= chapterTop(hash) - 2 ? i : current, 0);
    const top = chapterTop(chapters[index]);
    const end = index < 3 ? chapterTop(chapters[index + 1]) : book.offsetTop + book.offsetHeight;
    languageAnchor = {hash:chapters[index], fraction:clamp((scrollY - top) / Math.max(1, end - top))};
  });
  document.addEventListener('languagechange', () => {
    configure();
    if (!languageAnchor) return;
    const chapters = ['#home', '#about', '#work', '#experience'];
    const index = chapters.indexOf(languageAnchor.hash);
    const top = chapterTop(languageAnchor.hash);
    const end = index < 3 ? chapterTop(chapters[index + 1]) : book.offsetTop + book.offsetHeight;
    scrollTo({top:top + languageAnchor.fraction * (end - top), behavior:'instant'});
    updateScene();
    languageAnchor = null;
  });

  // Reveal the dated entry once it enters the reading area; chapter motion stays scroll-driven.
  const timelineEntries = [...document.querySelectorAll('.timeline-entry')];
  if ('IntersectionObserver' in window && !reduced.matches) {
    root.classList.add('timeline-motion');
    const timelineObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        timelineObserver.unobserve(entry.target);
      });
    }, {threshold:.12});
    timelineEntries.forEach(entry => timelineObserver.observe(entry));
  }

  // A refracting glass texture: gentle liquid deformation and moving light.
  // Touch screens use the clean PNG and a small CSS float. Keep refraction on desktop.
  const canvas = document.querySelector('.hello-canvas');
  const holder = document.querySelector('.hello-float');
  const source = document.querySelector('.hello-image');
  const simpleGlass = matchMedia('(max-width: 700px), (hover: none) and (pointer: coarse)');
  let gl;
  try { gl = canvas.getContext('webgl', {alpha:true, antialias:false, premultipliedAlpha:false, powerPreference:'low-power'}); } catch (_) { return; }
  if (!gl) return;
  const vertex = `attribute vec2 a_position; varying vec2 v_uv; void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
  const fragment = `precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_image;
    uniform float u_time;
    uniform vec2 u_pointer;
    void main(){
      vec2 uv=v_uv;
      float t=u_time;
      uv.x += .0035*sin(uv.y*8.+t*.65) + u_pointer.x*.003;
      uv.y += .008*sin(uv.x*8.-t*.75)*sin(uv.x*3.14159) + u_pointer.y*.003;
      vec4 glass=texture2D(u_image,uv);
      float sweep=sin(uv.x*7.-uv.y*2.-t*.7);
      float light=pow(max(0.,sweep),14.);
      vec3 rose=vec3(1.,.72,.86);
      vec3 sage=vec3(.72,.93,1.);
      vec3 tint=mix(rose,sage,.5+.5*sin(t*.4+uv.x*4.));
      vec3 color=glass.rgb*(.85+light*.2)+tint*light*.09;
      gl_FragColor=vec4(color,glass.a);
    }`;
  function compile(type, code) {
    const shader=gl.createShader(type);
    gl.shaderSource(shader,code);gl.compileShader(shader);
    if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error('Glass shader unavailable');
    return shader;
  }
  let program;
  try {
    program=gl.createProgram();
    gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));
    gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) return;
  } catch (_) { return; }
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'a_position');
  gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const timeUniform=gl.getUniformLocation(program,'u_time');
  const pointerUniform=gl.getUniformLocation(program,'u_pointer');
  const texture=gl.createTexture();
  let ready=false, visible=true, glassFrame=0, startTime=performance.now();
  const pointer={x:0,y:0,tx:0,ty:0};
  cover.addEventListener('pointermove', event => {pointer.tx=event.clientX/innerWidth-.5;pointer.ty=event.clientY/innerHeight-.5;},{passive:true});
  cover.addEventListener('pointerleave',()=>{pointer.tx=0;pointer.ty=0;});
  function sizeCanvas(){
    const scale=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(holder.clientWidth*scale);
    canvas.height=Math.round(holder.clientHeight*scale);
    gl.viewport(0,0,canvas.width,canvas.height);
  }
  function draw(now){
    glassFrame=0;
    if(!ready || !visible || document.hidden || reduced.matches || simpleGlass.matches) return;
    pointer.x+=(pointer.tx-pointer.x)*.035;pointer.y+=(pointer.ty-pointer.y)*.035;
    gl.uniform1f(timeUniform,(now-startTime)/1000);
    gl.uniform2f(pointerUniform,pointer.x,pointer.y);
    gl.drawArrays(gl.TRIANGLES,0,6);
    glassFrame=requestAnimationFrame(draw);
  }
  function syncGlass(){
    const animateGlass = ready && !reduced.matches && !simpleGlass.matches;
    holder.classList.toggle('webgl-ready',animateGlass);
    if(glassFrame) cancelAnimationFrame(glassFrame);
    glassFrame=0;
    if(animateGlass&&visible&&!document.hidden) glassFrame=requestAnimationFrame(draw);
  }
  function upload(){
    if(ready || !source.naturalWidth) return;
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
    ready=true;sizeCanvas();syncGlass();
  }
  if(source.complete) upload(); else source.addEventListener('load',upload,{once:true});
  new ResizeObserver(sizeCanvas).observe(holder);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncGlass();},{threshold:0}).observe(hello);
  document.addEventListener('visibilitychange',syncGlass);
  reduced.addEventListener('change',syncGlass);
  simpleGlass.addEventListener('change',syncGlass);
  canvas.addEventListener('webglcontextlost',()=>{ready=false;syncGlass();});
})();
