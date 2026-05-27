/* ==========================================================================
   Jsonita Documentation Navigation
   - Renders sidebar + pagination based on body data attributes
   - Each plan/spec HTML file declares its chapter via:
       <body data-section="plan" data-chapter="00">
   ========================================================================== */

const SECTIONS = {
  plan: {
    label: 'Plan',
    chapters: [
      { num: '00', slug: 'overview',      title: '项目概览' },
      { num: '01', slug: 'features',      title: '功能清单' },
      { num: '02', slug: 'interaction',   title: '交互草图' },
      { num: '03', slug: 'tech_stack',    title: '技术选型' },
      { num: '04', slug: 'nfr',           title: '非功能性需求' }
    ]
  },
  spec: {
    label: 'Spec',
    chapters: [
      { num: '00', slug: 'architecture',  title: '系统架构' },
      { num: '01', slug: 'mockups',       title: '原型图 & 交互细节' },
      { num: '02', slug: 'ipc',           title: 'IPC 合约' },
      { num: '03', slug: 'design_tokens', title: '设计令牌' },
      { num: '04', slug: 'components',    title: '组件库映射' },
      { num: '05', slug: 'icons_theme',   title: '图标资源 & 主题' },
      { num: '06', slug: 'window',        title: '窗口 runtime' },
      { num: '07', slug: 'menubar',       title: '菜单栏 & 快捷键' },
      { num: '08', slug: 'editor',        title: '编辑器 & 树 UI' },
      { num: '09', slug: 'json_engine',   title: 'JSON 引擎' },
      { num: '10', slug: 'storage',       title: '存储 & 会话' },
      { num: '11', slug: 'ai_client',     title: 'AI 客户端' },
      { num: '12', slug: 'packaging',     title: '打包、签名、验收' },
      { num: '13', slug: 'schemas',       title: '数据模型参考' },
      { num: '14', slug: 'i18n_a11y',     title: '国际化 & 无障碍' },
      { num: '15', slug: 'logging',       title: '日志 & 可观测性' }
    ]
  }
};

/* ===== Doc TOC helpers ===== */

function ensureHeadingIds() {
  document.querySelectorAll('.doc-article h2, .doc-article h3').forEach(el => {
    if (el.id) return;
    const numEl = el.querySelector('.h2-num, .h3-num');
    const num = numEl ? numEl.textContent.trim() : '';
    const prefix = el.tagName === 'H2' ? 'h2' : 'h3';
    if (num) {
      el.id = `${prefix}-${num.replace(/\./g, '-')}`;
    } else {
      const text = el.textContent.trim().slice(0, 28).toLowerCase()
        .replace(/[^a-z0-9一-鿿]+/g, '-')
        .replace(/^-+|-+$/g, '');
      el.id = `${prefix}-${text || Math.random().toString(36).slice(2, 7)}`;
    }
  });
}

function buildDocTOC() {
  const headings = document.querySelectorAll('.doc-article h2[id], .doc-article h3[id]');
  if (headings.length === 0) return '';
  const items = Array.from(headings).map(h => {
    const isH2 = h.tagName === 'H2';
    const numEl = h.querySelector('.h2-num, .h3-num');
    const num = numEl ? numEl.textContent.trim() : '';
    const clone = h.cloneNode(true);
    const n = clone.querySelector('.h2-num, .h3-num');
    if (n) n.remove();
    const title = clone.textContent.trim();
    const cls = isH2 ? 'toc-h2' : 'toc-h3';
    return `<li><a href="#${h.id}" class="${cls}" data-toc-target="${h.id}"><span class="toc-num">${num}</span><span>${title}</span></a></li>`;
  }).join('');
  return `<ul class="toc toc-doc">${items}</ul>`;
}

function setupScrollspy() {
  const headings = Array.from(document.querySelectorAll('.doc-article h2[id], .doc-article h3[id]'));
  if (headings.length === 0) return;
  const tocLinks = new Map();
  document.querySelectorAll('.toc-doc a[data-toc-target]').forEach(a => {
    tocLinks.set(a.dataset.tocTarget, a);
  });
  if (tocLinks.size === 0) return;

  let activeId = null;
  const OFFSET = 130;

  function updateActive() {
    let current = null;
    for (const h of headings) {
      const top = h.getBoundingClientRect().top;
      if (top <= OFFSET) current = h;
      else break;
    }
    const id = current ? current.id : headings[0].id;
    if (id === activeId) return;
    if (activeId && tocLinks.has(activeId)) {
      tocLinks.get(activeId).classList.remove('active');
    }
    activeId = id;
    if (tocLinks.has(id)) {
      const a = tocLinks.get(id);
      a.classList.add('active');
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        const aRect = a.getBoundingClientRect();
        const sRect = sidebar.getBoundingClientRect();
        if (aRect.top < sRect.top + 60 || aRect.bottom > sRect.bottom - 60) {
          a.scrollIntoView({ block: 'nearest' });
        }
      }
    }
  }

  let raf = null;
  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(() => { updateActive(); raf = null; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  updateActive();
}

/* ===== Sidebar = 当前文档 TOC ===== */

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const section = document.body.dataset.section;
  const currentChapter = document.body.dataset.chapter;
  const def = SECTIONS[section];
  if (!def) return;
  const chapter = def.chapters.find(c => c.num === currentChapter);

  ensureHeadingIds();
  const tocHtml = buildDocTOC() || '<div class="toc-empty">本页无章节标题</div>';

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <a href="../index.html" class="sidebar-title">Jsonita</a>
      <div class="sidebar-subtitle">${chapter ? `${chapter.num} · ${chapter.title}` : def.label}</div>
    </div>
    <div class="sidebar-section">目录</div>
    ${tocHtml}
    <div class="sidebar-section">导航</div>
    <ul class="toc">
      <li><a href="../index.html"><span class="toc-num">↩</span><span>文档首页</span></a></li>
      <li><a href="../README.md"><span class="toc-num">md</span><span>README</span></a></li>
      <li><a href="../TODO.md"><span class="toc-num">md</span><span>TODO</span></a></li>
      <li><a href="../CHANGELIST.md"><span class="toc-num">md</span><span>CHANGELIST</span></a></li>
    </ul>
  `;

  setupScrollspy();
}

/* ===== Topbar = breadcrumb 行 + 章节 strip 行 ===== */

function renderTopbar() {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;
  const section = document.body.dataset.section;
  const currentChapter = document.body.dataset.chapter;
  const def = SECTIONS[section];
  if (!def) return;
  const chapter = def.chapters.find(c => c.num === currentChapter);

  const stripHtml = def.chapters.map(c => `
    <a href="${c.num}_${c.slug}.html" class="${c.num === currentChapter ? 'active' : ''}">
      <span class="strip-num">${c.num}</span><span>${c.title}</span>
    </a>
  `).join('');

  topbar.innerHTML = `
    <div class="topbar-row row-breadcrumb">
      <div class="topbar-crumb">
        <a href="../index.html">Jsonita</a>
        <span class="sep">/</span>
        <a href="../index.html#${section}">${section}</a>
        <span class="sep">/</span>
        <span class="current">${chapter ? `${chapter.num} · ${chapter.title}` : ''}</span>
      </div>
      <div class="topbar-spacer"></div>
      <a class="topbar-action" href="../index.html">↩ 文档首页</a>
    </div>
    <div class="topbar-row row-strip">
      <nav class="chapter-strip">${stripHtml}</nav>
    </div>
  `;

  // 让当前 strip 项滚动可见
  requestAnimationFrame(() => {
    const active = topbar.querySelector('.chapter-strip a.active');
    if (active) active.scrollIntoView({ block: 'nearest', inline: 'center' });
  });
}

function renderPagination() {
  const pag = document.getElementById('pagination');
  if (!pag) return;
  const section = document.body.dataset.section;
  const currentChapter = document.body.dataset.chapter;
  const def = SECTIONS[section];
  if (!def) return;
  const idx = def.chapters.findIndex(c => c.num === currentChapter);
  const prev = def.chapters[idx - 1];
  const next = def.chapters[idx + 1];

  const prevHtml = prev
    ? `<a href="${prev.num}_${prev.slug}.html" class="pagination-link prev">
         <span class="pagination-direction">← 上一节</span>
         <span class="pagination-title">${prev.num} · ${prev.title}</span>
       </a>`
    : `<span class="pagination-link prev disabled">
         <span class="pagination-direction">已是首节</span>
         <span class="pagination-title">—</span>
       </span>`;
  const nextHtml = next
    ? `<a href="${next.num}_${next.slug}.html" class="pagination-link next">
         <span class="pagination-direction">下一节 →</span>
         <span class="pagination-title">${next.num} · ${next.title}</span>
       </a>`
    : `<a href="../index.html" class="pagination-link next">
         <span class="pagination-direction">完成 →</span>
         <span class="pagination-title">返回文档首页</span>
       </a>`;
  pag.innerHTML = prevHtml + nextHtml;
}

function highlightJsonText(text) {
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return html.replace(
    /("(?:[^"\\]|\\.)*")(\s*:)?|(\b(?:true|false|null)\b)|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/g,
    function(match, str, colon, kw, num) {
      if (str) {
        return colon
          ? '<span class="json-key">' + str + '</span>' + colon
          : '<span class="json-string">' + str + '</span>';
      } else if (kw) {
        return kw === 'null'
          ? '<span class="json-null">' + kw + '</span>'
          : '<span class="json-bool">' + kw + '</span>';
      } else if (num) {
        return '<span class="json-number">' + num + '</span>';
      }
      return match;
    }
  );
}

function highlightJsonBlocks() {
  document.querySelectorAll('pre code').forEach(el => {
    if (el.dataset.highlighted) return;
    const text = el.textContent.trim();
    if (!/^[\["{]/.test(text)) return;
    el.dataset.highlighted = '1';
    el.innerHTML = highlightJsonText(el.textContent);
  });
}

/* ===== Mermaid 时序图 / 流程图 ===== */

async function renderMermaid() {
  const blocks = document.querySelectorAll('.mermaid');
  if (blocks.length === 0) return;

  let mermaid;
  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs');
    mermaid = mod.default;
  } catch (e) {
    // CDN 加载失败 → 显示原始文本 + 提示
    blocks.forEach(b => {
      b.innerHTML = '<pre style="white-space: pre-wrap; color: var(--text-muted); font-size: 12px;">' +
                    b.textContent.replace(/&/g, '&amp;').replace(/</g, '&lt;') +
                    '</pre><div style="font-size: 11px; color: var(--text-faint); margin-top: 8px;">⚠ Mermaid CDN 加载失败，显示源文本</div>';
    });
    return;
  }

  mermaid.initialize({
    startOnLoad:  false,
    securityLevel:'loose',
    theme:        'base',
    themeVariables: {
      fontFamily:        '"SF Pro Display", -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
      fontSize:          '13px',
      primaryColor:      '#F2F5FF',
      primaryTextColor:  '#1F2329',
      primaryBorderColor:'#245BDB',
      lineColor:         '#646A73',
      secondaryColor:    '#FFFFFF',
      tertiaryColor:     '#F7F8FA',
      noteBkgColor:      '#FFF7E8',
      noteBorderColor:   '#A45F00',
      noteTextColor:     '#6B4400',
      actorBkg:          '#245BDB',
      actorTextColor:    '#FFFFFF',
      actorBorder:       '#245BDB',
      signalColor:       '#1F2329',
      signalTextColor:   '#1F2329',
      labelBoxBkgColor:  '#F2F5FF',
      labelBoxBorderColor:'#245BDB',
      labelTextColor:    '#1F2329',
    },
    sequence: {
      diagramMarginX: 30,
      diagramMarginY: 12,
      boxMargin: 10,
      mirrorActors: false,
      wrap: true,
      width: 160,
      messageFontSize: 12,
      actorFontSize: 13,
      noteFontSize: 12,
    },
  });

  try {
    await mermaid.run({ querySelector: '.mermaid' });
  } catch (e) {
    console.error('mermaid render error', e);
  }

  attachMermaidZoom();
}

function attachMermaidZoom() {
  document.querySelectorAll('.mermaid').forEach(el => {
    if (el.dataset.zoomAttached) return;
    el.dataset.zoomAttached = '1';
    el.style.cursor = 'zoom-in';
    el.title = '点击放大 · 滚轮缩放 · 拖动平移';
    el.addEventListener('click', () => openMermaidZoom(el));
  });
}

async function loadSvgPanZoom() {
  if (window.svgPanZoom) return window.svgPanZoom;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.2/dist/svg-pan-zoom.min.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return window.svgPanZoom;
}

async function openMermaidZoom(sourceEl) {
  const svg = sourceEl.querySelector('svg');
  if (!svg) return;

  const overlay = document.createElement('div');
  overlay.className = 'mermaid-zoom-overlay';
  overlay.innerHTML = `
    <div class="mermaid-zoom-toolbar">
      <button data-action="zoom-in"  title="放大">+</button>
      <button data-action="zoom-out" title="缩小">−</button>
      <button data-action="reset"    title="重置">100%</button>
      <button data-action="close"    title="关闭 (Esc)">×</button>
    </div>
    <div class="mermaid-zoom-stage"></div>
    <div class="mermaid-zoom-hint">滚轮缩放 · 拖动平移 · Esc 关闭</div>
  `;
  const stage = overlay.querySelector('.mermaid-zoom-stage');

  // 克隆 SVG 并去掉 max-width / 固定尺寸约束
  const cloned = svg.cloneNode(true);
  cloned.removeAttribute('style');
  cloned.setAttribute('width',  '100%');
  cloned.setAttribute('height', '100%');
  cloned.style.maxWidth  = 'none';
  cloned.style.maxHeight = 'none';
  stage.appendChild(cloned);

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  let inst = null;
  try {
    const svgPanZoom = await loadSvgPanZoom();
    inst = svgPanZoom(cloned, {
      zoomEnabled:           true,
      controlIconsEnabled:   false,
      panEnabled:            true,
      mouseWheelZoomEnabled: true,
      minZoom:  0.3,
      maxZoom:  10,
      contain:  false,
      fit:      true,
      center:   true,
      zoomScaleSensitivity: 0.4,
    });
  } catch (e) {
    // svg-pan-zoom 加载失败：只能看不能放大，但仍能关闭
    console.warn('svg-pan-zoom load failed', e);
  }

  function close() {
    if (inst) inst.destroy();
    overlay.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
    else if (e.key === '+' || e.key === '=') inst?.zoomIn();
    else if (e.key === '-' || e.key === '_') inst?.zoomOut();
    else if (e.key === '0') { inst?.resetZoom(); inst?.resetPan(); }
  }
  document.addEventListener('keydown', onKey);

  overlay.addEventListener('click', (e) => {
    const action = e.target.dataset?.action;
    if (action === 'zoom-in')  inst?.zoomIn();
    else if (action === 'zoom-out') inst?.zoomOut();
    else if (action === 'reset')    { inst?.resetZoom(); inst?.resetPan(); }
    else if (action === 'close')    close();
    else if (e.target === overlay || e.target === stage) close();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderTopbar();
  renderSidebar();
  renderPagination();
  highlightJsonBlocks();
  renderMermaid();
});
