// Minimal JS for the GitHub Pages site.
// 1. Scroll-reveal for .reveal elements.
// 2. Position the sliding active-tab pill inside each rendered .appwin window,
//    the same way the real app's TabBar measures tabs with a ResizeObserver —
//    so the pill sits exactly under the active tab regardless of label width
//    or locale. On the hero, the pill tours across the tabs once on load to
//    demonstrate "switch transforms," then settles.
// Reduced-motion users get elements visible immediately (CSS handles motion).

(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll reveal ---------- */
  (function reveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
  })();

  /* ---------- tab pill positioning (mirrors real TabBar measurement) ---------- */
  const appwins = Array.from(document.querySelectorAll('.appwin'));

  function activeTabOf(appwin) {
    const wanted = appwin.dataset.activeTab;
    const tabs = Array.from(appwin.querySelectorAll('.appwin-tab[data-tab]'));
    // match by data-tab; "ai" is not one of the four transform tabs → none active
    return tabs.find((t) => t.dataset.tab === wanted) || null;
  }

  function placePill(appwin) {
    const pill = appwin.querySelector('.appwin-pill');
    const tab = activeTabOf(appwin);
    if (!pill) return;
    if (!tab) {
      // AI Fix view: no transform tab is active — hide the pill.
      pill.style.opacity = '0';
      appwin.classList.remove('is-ready');
      return;
    }
    pill.style.width = tab.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    appwin.classList.add('is-ready');
  }

  function placeAll() {
    appwins.forEach(placePill);
  }

  // mark the active tab (drives its color) and place pills
  appwins.forEach((appwin) => {
    const tab = activeTabOf(appwin);
    if (tab) tab.classList.add('is-active');
  });

  // run once layout + fonts are ready, then again on resize (debounced)
  function bootstrap() {
    placeAll();
    if (reduce) return;
    heroTour();
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(placeAll);
  }
  window.addEventListener('load', bootstrap);
  let rT;
  window.addEventListener('resize', () => {
    clearTimeout(rT);
    rT = setTimeout(placeAll, 120);
  });

  /* ---------- hero pill tour: format → minify → tree → str → format ---------- */
  function heroTour() {
    const hero = document.querySelector('.appwin--hero');
    if (!hero) return;
    const tabs = Array.from(hero.querySelectorAll('.appwin-tab[data-tab]'));
    const pill = hero.querySelector('.appwin-pill');
    if (!pill || tabs.length < 2) return;
    const active = activeTabOf(hero) || tabs[0];

    // visit every tab in order, then settle on the active one
    const seq = tabs.concat(active);
    let i = 0;
    const step = () => {
      const t = seq[i];
      pill.style.width = t.offsetWidth + 'px';
      pill.style.transform = 'translateX(' + t.offsetLeft + 'px)';
      i += 1;
      if (i < seq.length) setTimeout(step, 260);
    };
    // small delay so the hero entrance animation (rise) finishes first
    setTimeout(step, 760);
  }
})();
