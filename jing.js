(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pending = new WeakMap();
  async function swapImage(element, file, alt) {
    const token = {};
    pending.set(element, token);
    const next = new Image();
    next.src = `assets/jing/${file}.png`;
    try { await next.decode(); } catch { return; }
    if (pending.get(element) !== token) return;
    element.src = next.src;
    element.alt = alt;
    element.width = next.naturalWidth;
    element.height = next.naturalHeight;
    if (!reduced.matches) element.animate([{opacity:.2,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:350,easing:'ease-out'});
  }
  const seasons = [
    ['February','shadow-february','Longer winter shadows reinforce the need for comfortable alternatives to sitting on the grass.'],
    ['April','shadow-april','Shorter shadows bring more sunlight onto the lawn. Seating can offer a choice between open and sheltered areas.'],
    ['June','shadow-june','The summer study shows more sunlight reaching the site. Shaded places become part of the comfort strategy.'],
    ['October','shadow-october','Longer shadows return in autumn, reinforcing the value of dry seating and a choice of conditions.']
  ];
  function chooseMonth(index) {
    const [month, file, response] = seasons[index];
    $('#season-month').value = String(index);
    $('#season-month').setAttribute('aria-valuetext', month);
    $('#month-output').textContent = month;
    $('#sun-response').textContent = response;
    $('#shadow-caption').textContent = `${month} · 14:00 / Original shadow study, Discovery report p. 4`;
    document.querySelectorAll('[data-month]').forEach(button => button.setAttribute('aria-pressed',String(Number(button.dataset.month) === index)));
    swapImage($('#shadow-image'),file,`Original ${month} shadow study of Queen’s Lawn at 14:00`);
  }
  $('#season-month').addEventListener('input',event => chooseMonth(Number(event.target.value)));
  document.querySelectorAll('[data-month]').forEach(button => button.addEventListener('click',() => chooseMonth(Number(button.dataset.month))));
  const arrangements = {
    rest: {capacity:'1 person',label:'INDIVIDUAL USE',title:'Room to recline.',copy:'Bring the modules together to support a reclined posture for one person.',file:'seat-test-rest',alt:'Participant trying the full-scale cardboard chair in a reclined posture',caption:'Full-scale cardboard prototype / individual rest'},
    share: {capacity:'2 people',label:'SHARED USE',title:'A place for two.',copy:'A compact, flat-topped bench, with the curved leg-rest leaning at one end—as photographed in the lawn test.',file:'seat-test-shared',alt:'Cardboard seat components configured for shared use on the lawn',caption:'Full-scale cardboard prototype / shared seating configuration'},
    gather: {capacity:'3 people',label:'SEPARATE MODULES',title:'Make room for a group.',copy:'Separate the three components to create individual places around a shared space.',file:'seat-test-separated',alt:'Three separated cardboard seating modules arranged on the lawn',caption:'Full-scale cardboard prototype / separated components'}
  };
  document.querySelectorAll('[data-seat]').forEach(button => button.addEventListener('click',() => {
    const key = button.dataset.seat;
    const state = arrangements[key];
    document.querySelectorAll('[data-seat]').forEach(item => item.setAttribute('aria-pressed',String(item === button)));
    $('#seat-capacity').textContent = state.capacity;
    $('#seat-use-label').textContent = state.label;
    $('#seat-use-title').textContent = state.title;
    $('#seat-use-copy').textContent = state.copy;
    $('#seat-photo-caption').textContent = state.caption;
    swapImage($('#seat-photo'),state.file,state.alt);
    if ($('#seat-scene').dataset.ready === 'false') {
      swapImage($('#seat-scene-fallback'),state.file,state.alt);
      $('#seat-scene').setAttribute('aria-label',`Original prototype photograph: ${key} arrangement`);
    }
  }));
  const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    reveal.unobserve(entry.target);
  }),{threshold:.08});
  if (!reduced.matches) document.querySelectorAll('[data-reveal]').forEach(element => {
    if (element.getBoundingClientRect().top >= innerHeight) {element.classList.add('jing-reveal');reveal.observe(element);}
  });
})();
