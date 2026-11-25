(() => {
  for (const group of document.querySelectorAll('[data-switch]')) {
    const choices = group.querySelector('.choices');
    const buttons = [...choices.querySelectorAll('button')];
    const panels = [...group.querySelectorAll('[data-panel]')];
    function show(id) {
      for (const panel of panels) panel.hidden = panel.id !== id;
      for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.show === id));
    }
    for (const button of buttons) {
      button.setAttribute('aria-controls', button.dataset.show);
      button.addEventListener('click', () => show(button.dataset.show));
    }
    show(buttons[0].dataset.show);
    choices.hidden = false;
  }

  const reader = document.querySelector('.reading-surface');
  const links = [...document.querySelectorAll('.node-nav a')];
  const chapters = links.map(link => document.querySelector(link.hash));
  function markSection() {
    const threshold = reader.getBoundingClientRect().top + reader.clientHeight * 0.32;
    let current = 0;
    chapters.forEach((chapter, i) => {
      if (chapter.getBoundingClientRect().top <= threshold) current = i;
    });
    if (reader.scrollHeight - reader.clientHeight - reader.scrollTop < 3) current = chapters.length - 1;
    links.forEach((link, i) => {
      if (i === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  reader.addEventListener('scroll', markSection, { passive: true });
  window.addEventListener('resize', markSection);
  window.addEventListener('load', markSection);
  markSection();
})();
