(() => {
  'use strict';
  // Preserve the source's separate legend and Figma orientation in the shared viewer.
  const legend = document.getElementById('viewer-legend');
  const image = document.getElementById('viewer-image');
  document.querySelectorAll('[data-enlarge]').forEach(button => {
    button.addEventListener('click', () => {
      const source = button.dataset.legend;
      legend.hidden = !source;
      if (source) legend.src = source;
      else legend.removeAttribute('src');
      image.classList.toggle('source-flip-y', button.dataset.flip === 'vertical');
    });
  });
})();
