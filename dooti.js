(() => {
  'use strict';
  // A native, keyboard-accessible tab set for the three prototype stages.
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function selectPrototype(tab) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectPrototype(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectPrototype(tabs[next]);
      tabs[next].focus();
    });
  });

  const systems = {
    refill: { image: 'exploded.png', alt: 'Exploded Dooti assembly showing the variable-length refill roll', caption: 'FINAL ARCHITECTURE / REFILL ROLL', label: 'MATERIAL EFFICIENCY', title: 'Pull only what you need.', body: 'Users select the length of compostable refill material to suit different dog sizes. The design aims to avoid the excess of a fixed, oversized bag.' },
    mechanism: { image: 'handheld.png', alt: 'Physical handheld prototype with the material emerging beside the cutting control', caption: 'PHYSICAL PROTOTYPE / HANDHELD MECHANISM', label: 'FUNCTIONAL INTEGRATION', title: 'Bring sealing and cutting together.', body: 'The blade, heat wire, electronics and casing are integrated into a guided mechanism. This makes bag preparation part of a compact handheld routine.' },
    pouch: { image: 'pouch.png', alt: 'Open mint-coloured carry pouch containing a used bag', caption: 'ADDED AFTER FEEDBACK / CARRY-HOME POUCH', label: 'DESIGNED AROUND USER FEEDBACK', title: 'Give carrying the same attention as collecting.', body: 'A detachable, odour-resistant pouch provides temporary storage. It responds directly to the discomfort users described when carrying used bags during a walk.' }
  };
  const choices = [...document.querySelectorAll('[data-system]')];
  const systemImage = document.querySelector('#system-image');
  const systemDetail = document.querySelector('#system-detail');
  choices.forEach(button => button.addEventListener('click', () => {
    const item = systems[button.dataset.system];
    choices.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
    systemImage.src = 'assets/dooti/' + item.image;
    systemImage.alt = item.alt;
    document.querySelector('#system-image-caption').textContent = item.caption;
    systemDetail.replaceChildren();
    const label = document.createElement('p');
    label.className = 'small-label';
    label.textContent = item.label;
    const title = document.createElement('h3');
    title.textContent = item.title;
    const body = document.createElement('p');
    body.textContent = item.body;
    systemDetail.append(label, title, body);
  }));

  const range = document.querySelector('#bag-length');
  const demo = document.querySelector('.bag-demo');
  const seal = document.querySelector('#seal-bag');
  const state = document.querySelector('#bag-state');
  const status = document.querySelector('#demo-status');
  let sealed = false;
  function updateLength() {
    const value = Number(range.value);
    const label = value < 34 ? 'Short' : value < 67 ? 'Medium' : 'Long';
    demo.style.setProperty('--bag-length', value);
    document.querySelector('#length-value').textContent = label;
    range.setAttribute('aria-valuetext', label + ' bag length');
    state.textContent = 'Ready to seal';
    status.textContent = label + ' length selected. Seal and cut to complete the bag.';
  }
  range.addEventListener('input', updateLength);
  seal.addEventListener('click', () => {
    sealed = !sealed;
    demo.classList.toggle('sealed', sealed);
    range.disabled = sealed;
    if (sealed) {
      state.textContent = 'Sealed & cut';
      status.textContent = 'Bag ready. The selected length is separated from the refill.';
      seal.textContent = 'Make another bag ↻';
    } else {
      seal.textContent = 'Seal & cut →';
      updateLength();
      range.focus();
    }
  });

  // Read progress and location without replacing native scrolling or history.
  const navigation = [...document.querySelectorAll('.case-nav a')];
  const sections = navigation.map(link => document.querySelector(link.hash));
  const progress = document.querySelector('.reading-progress');
  let frame = 0;
  function updateReading() {
    frame = 0;
    const total = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${total > 0 ? Math.min(1, scrollY / total) : 0})`;
    let current = -1;
    sections.forEach((section, index) => { if (section.getBoundingClientRect().top <= 175) current = index; });
    navigation.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function scheduleReading() { if (!frame) frame = requestAnimationFrame(updateReading); }
  addEventListener('scroll', scheduleReading, {passive: true});
  addEventListener('resize', scheduleReading, {passive: true});
  addEventListener('pageshow', scheduleReading);
  document.fonts.ready.then(() => {
    // Correct initial fragment positioning after the local fonts settle.
    const target = location.hash && document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView({block:'start', behavior:'instant'});
    scheduleReading();
  });
  updateReading();
})();
