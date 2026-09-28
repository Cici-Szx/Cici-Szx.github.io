(() => {
  'use strict';
  const groups = document.querySelectorAll('[data-tabs]');
  groups.forEach(group => {
    const tabs = [...group.querySelectorAll('[role="tab"]')];
    function select(tab) {
      tabs.forEach(item => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
      });
      scheduleReading();
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        select(tabs[next]);
        tabs[next].focus();
      });
    });
  });

  const viewer = document.querySelector('.image-viewer');
  let opener;
  document.querySelectorAll('[data-enlarge]').forEach(button => {
    button.addEventListener('click', () => {
      opener = button;
      const source = button.querySelector('img');
      const image = document.getElementById('viewer-image');
      image.src = source.src;
      image.alt = source.alt;
      document.getElementById('viewer-caption').textContent = source.alt;
      viewer.showModal();
      viewer.querySelector('.viewer-scroll').scrollTo(0, 0);
    });
  });
  viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => {
    const bounds = viewer.getBoundingClientRect();
    if (event.target === viewer && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) viewer.close();
  });
  viewer.addEventListener('close', () => opener?.focus({preventScroll:true}));

  const navigation = [...document.querySelectorAll('.case-nav a')];
  const sections = navigation.map(link => document.querySelector(link.hash));
  const progress = document.querySelector('.reading-progress');
  let frame = 0;
  function updateReading() {
    frame = 0;
    const total = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${total > 0 ? Math.max(0, Math.min(1, scrollY / total)) : 0})`;
    let current = -1;
    const offset = document.querySelector('.case-topbar').offsetHeight + document.querySelector('.case-nav').offsetHeight + 24;
    sections.forEach((section, index) => { if (section.getBoundingClientRect().top <= offset) current = index; });
    navigation.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function scheduleReading() { if (!frame) frame = requestAnimationFrame(updateReading); }
  addEventListener('scroll', scheduleReading, {passive:true});
  addEventListener('resize', scheduleReading, {passive:true});
  addEventListener('pageshow', scheduleReading);
  document.fonts.ready.then(() => {
    const target = location.hash && document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView({block:'start', behavior:'instant'});
    scheduleReading();
  });
  updateReading();
})();
