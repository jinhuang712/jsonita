# Jsonita · 动画 demo

点按钮触发动画,直接感受节奏。先用顶部「缓动」切换曲线,反复点「呼出」对比 原生 vs Material 的脚感差别——这是我说的第 1 条。blur 全程不动,只动 transform/opacity。

缓动

原生 Material 轻弹 即时

呼出 隐藏 Format Minify Tree 触发 AI Fix 智能缩放 切换主题 重置

Format

Minify

Tree

→Str

AI Fix

Settings

Input

```
{"name":"alice","age":30}
```

Output · 2 spaces

```
{
  "name": "alice",
  "age": 30
}
```

Valid JSON · 3 lines · 26 bytes ⌘Y History

## Preserved prototype CSS

### CSS block 1

```css
:root{--ui:-apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang SC","Helvetica Neue",Arial,sans-serif;--mono:"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;}
  *{box-sizing:border-box;}
  body{margin:0;background:#0E0E10;color:#E7E8EA;font-family:var(--ui);padding:40px 24px 70px;-webkit-font-smoothing:antialiased;}
  .head{max-width:920px;margin:0 auto 22px;}
  .head h1{font-weight:600;font-size:22px;margin:0 0 8px;}
  .head p{color:#9498A0;font-size:13.5px;line-height:1.6;margin:0;max-width:720px;}
  .wrap{max-width:920px;margin:0 auto;}

  .controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:16px;}
  .seg{display:inline-flex;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:9px;padding:3px;gap:2px;}
  .seg button{background:transparent;border:none;color:rgba(255,255,255,.6);font:500 12px/1 var(--ui);padding:6px 11px;border-radius:6px;cursor:pointer;}
  .seg button.on{background:rgba(127,179,255,.18);color:#9DC0FF;}
  .seg-label{font-size:11px;color:#6E727B;letter-spacing:.5px;margin-right:2px;}
  .btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#E7E8EA;font:500 12px/1 var(--ui);padding:8px 13px;border-radius:8px;cursor:pointer;transition:background .12s ease,transform .08s ease;}
  .btn:hover{background:rgba(255,255,255,.11);}
  .btn:active{transform:scale(.97);}
  .btn.accent{background:rgba(255,182,107,.16);border-color:rgba(255,182,107,.34);color:#FFC58A;}
  .readout{font:11.5px/1.5 var(--mono);color:#7E838C;margin:2px 0 16px;}
  .readout b{color:#9DC0FF;font-weight:500;}

  .stage{position:relative;overflow:hidden;border-radius:16px;min-height:420px;display:flex;align-items:center;justify-content:center;padding:48px;
    background:linear-gradient(135deg,#2A2A5E 0%,#1C4E66 48%,#5A2A55 100%);}
  .stage::before{content:"";position:absolute;width:420px;height:420px;left:-70px;top:-130px;background:radial-gradient(circle,rgba(120,180,255,.5),transparent 62%);filter:blur(46px);}
  .stage::after{content:"";position:absolute;width:400px;height:400px;right:-90px;bottom:-150px;background:radial-gradient(circle,rgba(255,120,200,.4),transparent 62%);filter:blur(52px);}
  .wall-l{position:absolute;inset:0;opacity:0;transition:opacity .2s ease;background:linear-gradient(135deg,#D7E2F5 0%,#ECD9EC 50%,#F4E7D5 100%);}
  .stage.light .wall-l{opacity:1;}

  .win{position:relative;z-index:2;width:460px;border-radius:15px;overflow:hidden;transform-origin:50% 0;
    background:var(--glass-bg);-webkit-backdrop-filter:blur(42px) saturate(175%);backdrop-filter:blur(42px) saturate(175%);
    border:1px solid var(--glass-bd);box-shadow:0 28px 64px -20px rgba(0,0,0,.6),inset 0 1px 0 var(--hl);color:var(--txt);}
  #win{--glass-bg:rgba(26,28,36,.55);--glass-bd:rgba(255,255,255,.16);--hl:rgba(255,255,255,.22);--txt:#EEF0F4;--muted:rgba(255,255,255,.5);--hair:rgba(255,255,255,.1);--accent:#7FB3FF;--pill:rgba(255,255,255,.14);--pillbd:rgba(255,255,255,.2);--k:#82C0FF;--s:#84E08F;--n:#FFB66B;--p:rgba(255,255,255,.42);--valid:#5BE3A0;--danger:#F2A0A0;--kbdbg:rgba(255,255,255,.1);--kbdbd:rgba(255,255,255,.2);}
  #win[data-theme="light"]{--glass-bg:rgba(255,255,255,.62);--glass-bd:rgba(0,0,0,.07);--hl:rgba(255,255,255,.85);--txt:#1D1F26;--muted:rgba(20,22,30,.5);--hair:rgba(0,0,0,.07);--accent:#0A6CE0;--pill:rgba(10,122,255,.12);--pillbd:rgba(10,122,255,.22);--k:#0B66C2;--s:#2E7D4F;--n:#B5651D;--p:rgba(20,22,30,.4);--valid:#1F9E5A;--danger:#C0392B;--kbdbg:rgba(0,0,0,.05);--kbdbd:rgba(0,0,0,.14);}
  .win.hidden{opacity:0;transform:translateY(-6px) scale(.96);pointer-events:none;}
  .theming .win,.theming .win *{transition:background-color .18s ease,color .18s ease,border-color .18s ease!important;}

  .tabs{position:relative;display:flex;align-items:center;gap:4px;padding:9px 10px;border-bottom:1px solid var(--hair);}
  #pill{position:absolute;top:7px;height:26px;border-radius:7px;background:var(--pill);border:1px solid var(--pillbd);z-index:0;}
  .tab{position:relative;z-index:1;font:500 12px/1 var(--ui);border:none;background:transparent;padding:6px 10px;border-radius:7px;cursor:pointer;color:var(--muted);white-space:nowrap;}
  .tab.active{color:var(--accent);}
  .tab-spacer{flex:1;}
  .aitab{position:relative;z-index:1;font:500 12px/1 var(--ui);border:1px solid rgba(255,182,107,.34);background:rgba(255,182,107,.16);color:#FFC58A;padding:6px 10px;border-radius:7px;opacity:0;transform:translateX(10px);pointer-events:none;}
  #win[data-theme="light"] .aitab{color:#A4621A;background:rgba(181,101,29,.13);border-color:rgba(181,101,29,.28);}
  .aitab.show{opacity:1;transform:none;}
  .aitab.glow{animation:glowOnce 1.1s ease .05s 1;}
  @keyframes glowOnce{0%{box-shadow:0 0 0 0 rgba(255,182,107,0);}25%{box-shadow:0 0 0 4px rgba(255,182,107,.32);}100%{box-shadow:0 0 0 0 rgba(255,182,107,0);}}
  .gear{margin-left:2px;background:transparent;border:none;color:var(--muted);cursor:pointer;display:flex;padding:4px;}
  .gear svg{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;}

  .body{display:grid;grid-template-columns:1fr 1fr;}
  .pane{padding:12px 15px 15px;min-height:138px;}
  .pane+.pane{border-left:1px solid var(--hair);}
  .plabel{font:500 10px/1 var(--ui);letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:10px;}
  pre{font:11.5px/1.7 var(--mono);margin:0;white-space:pre;color:var(--txt);}
  #outWrap{transition:opacity .1s linear;}
  .k{color:var(--k);}.s{color:var(--s);}.n{color:var(--n);}.p{color:var(--p);}
  .status{display:flex;justify-content:space-between;align-items:center;padding:8px 13px;border-top:1px solid var(--hair);font:10.5px/1 var(--mono);color:var(--muted);}
  .dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--valid);margin-right:7px;vertical-align:middle;box-shadow:0 0 6px var(--valid);transition:background .15s ease,box-shadow .15s ease;}
  .kbd{font:10px/1 var(--mono);padding:2px 5px;border-radius:4px;border:1px solid var(--kbdbd);background:var(--kbdbg);margin-right:5px;}
  .status.err{color:var(--danger);}
  .status.err .dot{background:var(--danger);box-shadow:none;}
  @media (prefers-reduced-motion:reduce){.win,.win *{transition-duration:1ms!important;animation-duration:1ms!important;}}
```

## Preserved prototype body source

```html
<header class="head">
  <h1>Jsonita · 动画 demo</h1>
  <p>点按钮触发动画,直接感受节奏。先用顶部「缓动」切换曲线,反复点「呼出」对比 <b>原生 vs Material</b> 的脚感差别——这是我说的第 1 条。blur 全程不动,只动 transform/opacity。</p>
</header>

<div class="wrap">
  <div class="controls">
    <span class="seg-label">缓动</span>
    <div class="seg" id="easeSeg">
      <button data-ease="native" class="on">原生</button>
      <button data-ease="material">Material</button>
      <button data-ease="spring">轻弹</button>
      <button data-ease="instant">即时</button>
    </div>
  </div>
  <div class="controls">
    <button class="btn" onclick="summon()">呼出</button>
    <button class="btn" onclick="dismiss()">隐藏</button>
    <button class="btn" onclick="setTab('format')">Format</button>
    <button class="btn" onclick="setTab('minify')">Minify</button>
    <button class="btn" onclick="setTab('tree')">Tree</button>
    <button class="btn accent" onclick="triggerAi()">触发 AI Fix</button>
    <button class="btn" onclick="toggleResize()">智能缩放</button>
    <button class="btn" onclick="toggleTheme()">切换主题</button>
    <button class="btn" onclick="resetAll()">重置</button>
  </div>
  <div class="readout" id="readout"></div>

  <div class="stage" id="stage">
    <div class="wall-l"></div>
    <div class="win" id="win" data-theme="dark">
      <div class="tabs" id="tabs">
        <div id="pill"></div>
        <button class="tab active" data-tab="format" onclick="setTab('format')">Format</button>
        <button class="tab" data-tab="minify" onclick="setTab('minify')">Minify</button>
        <button class="tab" data-tab="tree" onclick="setTab('tree')">Tree</button>
        <button class="tab" data-tab="str" onclick="setTab('str')">→Str</button>
        <span class="tab-spacer"></span>
        <button class="aitab" id="aitab" onclick="setTab('ai')">AI Fix</button>
        <button class="gear" aria-label="Settings"><svg width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
      </div>
      <div class="body">
        <div class="pane">
          <div class="plabel" id="inLabel">Input</div>
          <pre id="inCode"><span class="p">{</span><span class="k">"name"</span><span class="p">:</span><span class="s">"alice"</span><span class="p">,</span><span class="k">"age"</span><span class="p">:</span><span class="n">30</span><span class="p">}</span></pre>
        </div>
        <div class="pane">
          <div class="plabel" id="outLabel">Output · 2 spaces</div>
          <div id="outWrap"><pre id="outCode"><span class="p">{</span>
  <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span>
  <span class="k">"age"</span><span class="p">:</span> <span class="n">30</span>
<span class="p">}</span></pre></div>
        </div>
      </div>
      <div class="status" id="status">
        <span><span class="dot" id="dot"></span><span id="statusText">Valid JSON · 3 lines · 26 bytes</span></span>
        <span><span class="kbd">⌘Y</span>History</span>
      </div>
    </div>
  </div>
</div>

<script>
  var EASES={native:'cubic-bezier(0.32,0.72,0,1)',material:'cubic-bezier(0.4,0,0.2,1)',spring:'linear(0,0.494 7.5%,0.892 15%,1.08 22.5%,1.103 26%,1.06 32%,0.998 41%,0.984,1)',instant:'linear'};
  var ease='native', current='format';
  var win=document.getElementById('win'), pill=document.getElementById('pill'),
      stage=document.getElementById('stage'), aitab=document.getElementById('aitab'),
      outWrap=document.getElementById('outWrap'), outCode=document.getElementById('outCode'),
      outLabel=document.getElementById('outLabel'), inCode=document.getElementById('inCode'),
      statusEl=document.getElementById('status'), statusText=document.getElementById('statusText'),
      readout=document.getElementById('readout');

  function dur(ms){ return ease==='instant'?1:ms; }
  function easeIn(){ return ease==='instant'?'linear':'cubic-bezier(0.4,0,1,1)'; }
  function updateReadout(){
    var label={native:'原生 cubic-bezier(0.32,0.72,0,1)',material:'Material cubic-bezier(0.4,0,0.2,1)',spring:'轻弹 linear() spring',instant:'即时 (≈reduced-motion)'}[ease];
    readout.innerHTML='当前缓动 · <b>'+label+'</b>　|　呼出 '+dur(150)+'ms ease-out　·　隐藏 '+dur(140)+'ms ease-in　·　缩放/主题 '+dur(200)+'/'+dur(180)+'ms';
  }

  var CONTENT={
    format:{inLabel:'Input',in:'<span class="p">{</span><span class="k">"name"</span><span class="p">:</span><span class="s">"alice"</span><span class="p">,</span><span class="k">"age"</span><span class="p">:</span><span class="n">30</span><span class="p">}</span>',
      outLabel:'Output · 2 spaces',out:'<span class="p">{</span>\n  <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span>\n  <span class="k">"age"</span><span class="p">:</span> <span class="n">30</span>\n<span class="p">}</span>',status:'Valid JSON · 3 lines · 26 bytes'},
    minify:{inLabel:'Input',in:'<span class="p">{</span>\n  <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span>\n  <span class="k">"age"</span><span class="p">:</span> <span class="n">30</span>\n<span class="p">}</span>',
      outLabel:'Output · single line',out:'<span class="p">{</span><span class="k">"name"</span><span class="p">:</span><span class="s">"alice"</span><span class="p">,</span><span class="k">"age"</span><span class="p">:</span><span class="n">30</span><span class="p">}</span>',status:'Valid JSON · 1 line · 26 bytes'},
    tree:{inLabel:'Input',in:'<span class="p">{</span>\n  <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span>\n  <span class="k">"age"</span><span class="p">:</span> <span class="n">30</span>\n<span class="p">}</span>',
      outLabel:'Tree',out:'▾ <span class="k">root</span> <span class="p">{2}</span>\n   <span class="k">name</span>: <span class="s">"alice"</span>\n   <span class="k">age</span>: <span class="n">30</span>',status:'Valid JSON · 3 nodes'},
    str:{inLabel:'Input',in:'<span class="p">{</span><span class="k">"name"</span><span class="p">:</span><span class="s">"alice"</span><span class="p">}</span>',
      outLabel:'Output · escaped string',out:'<span class="s">"{\\"name\\":\\"alice\\"}"</span>',status:'Valid JSON · 1 line'},
    long:{inLabel:'Input · 长行',in:'<span class="p">{</span><span class="k">"desc"</span><span class="p">:</span><span class="s">"a very long single-line value that triggers auto-resize"</span><span class="p">}</span>',
      outLabel:'Output · 2 spaces',out:'<span class="p">{</span>\n  <span class="k">"desc"</span><span class="p">:</span> <span class="s">"a very long single-line value\n          that triggers auto-resize"</span>\n<span class="p">}</span>',status:'Valid JSON · auto-sized for content'}
  };

  function positionPill(){
    var t=win.querySelector('.tab.active'); if(!t){pill.style.opacity=0;return;}
    pill.style.opacity=1;
    pill.style.left=t.offsetLeft+'px';
    pill.style.width=t.offsetWidth+'px';
  }
  function applyContent(name){
    var c=CONTENT[name]; if(!c) return;
    document.getElementById('inLabel').textContent=c.inLabel;
    inCode.innerHTML=c.in; outLabel.textContent=c.outLabel; outCode.innerHTML=c.out;
    statusEl.classList.remove('err'); statusText.textContent=c.status;
  }

  function summon(){
    win.style.transition='opacity '+dur(150)+'ms '+EASES[ease]+', transform '+dur(150)+'ms '+EASES[ease];
    win.classList.add('hidden');
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ win.classList.remove('hidden'); }); });
  }
  function dismiss(){
    win.style.transition='opacity '+dur(140)+'ms '+easeIn()+', transform '+dur(140)+'ms '+easeIn();
    win.classList.add('hidden');
  }
  function setTab(name){
    if(win.classList.contains('hidden')) win.classList.remove('hidden');
    if(name==='ai'){ statusErr(); return; }
    var t=win.querySelector('.tab[data-tab="'+name+'"]'); if(!t) return;
    win.querySelectorAll('.tab').forEach(function(x){ x.classList.toggle('active',x===t); });
    current=name;
    pill.style.transition='left '+dur(180)+'ms '+EASES[ease]+', width '+dur(180)+'ms '+EASES[ease];
    positionPill();
    outWrap.style.transition='opacity '+dur(100)+'ms linear';
    outWrap.style.opacity=0;
    setTimeout(function(){ applyContent(name); outWrap.style.opacity=1; }, dur(100));
  }
  function triggerAi(){
    inCode.innerHTML='<span class="p">{</span>\n  name<span class="p">:</span> <span class="s">\'alice\'</span><span class="p">,</span>\n<span class="p">}</span>';
    document.getElementById('inLabel').textContent='Input · 非法';
    outLabel.textContent='Output · 错误';
    outCode.innerHTML='<span style="opacity:.5;font-style:italic">// 等待修复后输出</span>';
    statusErr();
    aitab.classList.add('show');
    aitab.classList.remove('glow'); void aitab.offsetWidth; aitab.classList.add('glow');
    aitab.style.transition='opacity '+dur(150)+'ms '+EASES[ease]+', transform '+dur(150)+'ms '+EASES[ease];
  }
  function statusErr(){ statusEl.classList.add('err'); statusText.textContent='Line 2, Col 3: key must be a string'; }

  var big=false;
  function toggleResize(){
    big=!big;
    win.style.transition='width '+dur(200)+'ms '+EASES[ease];
    win.style.width=big?'660px':'460px';
    setTab(big?'long':'format');
    setTimeout(positionPill, dur(200)+20);
  }
  function toggleTheme(){
    stage.classList.add('theming');
    var toLight=win.getAttribute('data-theme')==='dark';
    win.setAttribute('data-theme', toLight?'light':'dark');
    stage.classList.toggle('light', toLight);
    setTimeout(function(){ stage.classList.remove('theming'); }, 240);
  }
  function resetAll(){
    big=false; win.style.width='460px';
    win.setAttribute('data-theme','dark'); stage.classList.remove('light');
    aitab.classList.remove('show','glow');
    setTab('format');
  }

  document.getElementById('easeSeg').addEventListener('click',function(e){
    var b=e.target.closest('button[data-ease]'); if(!b) return;
    ease=b.dataset.ease;
    this.querySelectorAll('button').forEach(function(x){ x.classList.toggle('on',x===b); });
    updateReadout();
  });

  window.addEventListener('resize', positionPill);
  updateReadout();
  requestAnimationFrame(function(){ requestAnimationFrame(positionPill); });
</script>
```
