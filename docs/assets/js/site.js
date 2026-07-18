// Minimal JS for the GitHub Pages site.
// 1. Scroll-reveal for .reveal elements.
// 2. Position the sliding active-tab pill inside each .appwin window (mirrors
//    the real app's TabBar measurement).
// 3. On the hero, slowly cycle the four transforms — the pill slides AND the
//    pane content actually changes (format → minify → tree → to-string), so
//    the motion demonstrates the product instead of being decorative.

(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const zh = document.documentElement.lang === 'zh-CN';

  /* ---------- scroll reveal ---------- */
  (function reveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach((el) => el.classList.add('in')); return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
  })();

  /* ---------- tab pill positioning ---------- */
  const appwins = Array.from(document.querySelectorAll('.appwin'));
  function tabByData(w, name) { return w.querySelector('.appwin-tab[data-tab="' + name + '"]'); }
  function activeTabOf(w) { return w.querySelector('.appwin-tab.is-active') || tabByData(w, w.dataset.activeTab); }
  function placePill(w) {
    const pill = w.querySelector('.appwin-pill');
    if (!pill) return;
    const tab = activeTabOf(w);
    if (!tab) { pill.style.opacity = '0'; w.classList.remove('is-ready'); return; }
    pill.style.width = tab.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    pill.style.opacity = '1';
    w.classList.add('is-ready');
  }
  // non-hero windows: mark active from data-active-tab
  appwins.forEach((w) => {
    if (w.classList.contains('appwin--hero')) return;
    const t = tabByData(w, w.dataset.activeTab);
    if (t) t.classList.add('is-active');
  });
  function placeAll() { appwins.forEach(placePill); }

  /* ---------- hero: switch a transform (pill + pane + run pill) ---------- */
  const hero = document.querySelector('.appwin--hero');
  const RUN_LABEL = zh
    ? { format: '运行 格式化', minify: '运行 压缩', str: '运行 转字符串' }
    : { format: 'Run format', minify: 'Run minify', str: 'Run to string' };

  function setHero(name) {
    if (!hero) return;
    hero.querySelectorAll('.appwin-tab').forEach((t) => t.classList.toggle('is-active', t.dataset.tab === name));
    hero.querySelectorAll('.appwin-pane[data-variant]').forEach((p) => {
      if (p.dataset.variant === name) p.removeAttribute('hidden');
      else p.setAttribute('hidden', '');
    });
    const run = hero.querySelector('[data-run]');
    if (run) {
      const label = run.querySelector('.appwin-run-label');
      if (name === 'tree') run.setAttribute('hidden', '');
      else { run.removeAttribute('hidden'); if (label) label.textContent = RUN_LABEL[name] || ''; }
    }
    // position pill
    const tab = tabByData(hero, name);
    const pill = hero.querySelector('.appwin-pill');
    if (tab && pill) {
      pill.style.width = tab.offsetWidth + 'px';
      pill.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    }
  }

  function startTour() {
    if (!hero) return;
    // settle immediately on format so users see the default
    setHero('format');
    if (reduce) return;
    // cycle through the four transforms slowly so readers see the pane change
    const seq = ['format', 'minify', 'tree', 'str'];
    let idx = 0;
    const STEP_MS = 2200;
    const CYCLES = 1;
    let ticks = 0;
    const total = seq.length * CYCLES;
    function advance() {
      ticks += 1;
      idx = (idx + 1) % seq.length;
      setHero(seq[idx]);
      if (ticks >= total - 1) {
        // settle back on format after showing everything
        clearInterval(handle);
        window.setTimeout(() => setHero('format'), STEP_MS);
      }
    }
    const handle = window.setInterval(advance, STEP_MS);
  }

  /* ---------- bootstrap ---------- */
  window.addEventListener('load', () => {
    placeAll();
    startTour();
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeAll);
  let rT;
  window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(placeAll, 120); });
})();
