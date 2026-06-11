# Jsonita · 单窗切换 + 状态栏 hover · v2

右侧两个控件现在 对称:平时只有文字「Switch to Single Panel」和「History」, hover / 键盘聚焦才滑出快捷键 (`⌘\` /`⌘Y`)。点 Switch 或按 `⌘\`:双栏合成单栏 + Run hint 滑入；窗口尺寸不因 toggle 主动变化。无图标、无冗余文字。

切换 Split / Single 把鼠标移到右下角 Switch… 或 History 上 → 看快捷键滑出 模拟「减弱动态效果」

Format Minify Tree →Str →JSON Settings

Input

```
{
  "name": "alice",
  "age": 30
}
```

⌘↵ Run Format

Output · 2 spaces

```
{
  "name": "alice",
  "age": 30
}
```

Valid JSON ·3 lines ·26 bytes ⌘\ Switch to Single Panel ⌘Y History

## Preserved prototype CSS

### CSS block 1

```css
:root{--ui:-apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang SC","Helvetica Neue",Arial,sans-serif;--mono:"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;--ease:cubic-bezier(0.32,0.72,0,1);}
  *{box-sizing:border-box;}
  body{margin:0;background:#0E0E10;color:#E7E8EA;font-family:var(--ui);padding:40px 24px 70px;-webkit-font-smoothing:antialiased;}
  body.rm *{transition-duration:1ms!important;animation-duration:1ms!important;}
  .head{max-width:900px;margin:0 auto 20px;}
  .head h1{font-weight:600;font-size:21px;margin:0 0 8px;}
  .head p{color:#9498A0;font-size:13.5px;line-height:1.6;margin:0;max-width:740px;}
  .wrap{max-width:900px;margin:0 auto;}
  .controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:14px;}
  .btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#E7E8EA;font:500 12px/1 var(--ui);padding:8px 13px;border-radius:8px;cursor:pointer;transition:background .12s ease,transform .08s ease;}
  .btn:hover{background:rgba(255,255,255,.11);}
  .btn:active{transform:scale(.97);}
  .tip{font-size:12px;color:#7E838C;}
  .tip b{color:#9DC0FF;font-weight:500;}
  .chk{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#9498A0;cursor:pointer;user-select:none;}

  .stage{position:relative;overflow:hidden;border-radius:16px;min-height:360px;display:flex;align-items:center;justify-content:center;padding:46px;background:linear-gradient(135deg,#2A2A5E 0%,#1C4E66 48%,#5A2A55 100%);}
  .stage::before{content:"";position:absolute;width:400px;height:400px;left:-70px;top:-130px;background:radial-gradient(circle,rgba(120,180,255,.5),transparent 62%);filter:blur(46px);}
  .stage::after{content:"";position:absolute;width:380px;height:380px;right:-90px;bottom:-150px;background:radial-gradient(circle,rgba(255,120,200,.4),transparent 62%);filter:blur(52px);}

  .win{position:relative;z-index:2;width:560px;max-width:100%;border-radius:15px;overflow:hidden;color:#EEF0F4;
    background:rgba(26,28,36,.55);-webkit-backdrop-filter:blur(42px) saturate(175%);backdrop-filter:blur(42px) saturate(175%);
    border:1px solid rgba(255,255,255,.16);box-shadow:0 28px 64px -20px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.22);
    transition:width .24s var(--ease);}
  .tabs{display:flex;align-items:center;gap:4px;padding:9px 11px;border-bottom:1px solid rgba(255,255,255,.1);}
  .tab{font:500 12px/1 var(--ui);border:1px solid transparent;background:transparent;padding:6px 10px;border-radius:7px;color:rgba(255,255,255,.6);white-space:nowrap;}
  .tab.active{background:rgba(255,255,255,.14);color:#7FB3FF;border-color:rgba(255,255,255,.2);}
  .tab-spacer{flex:1;}
  .gear{background:transparent;border:none;color:rgba(255,255,255,.5);display:flex;padding:4px;cursor:pointer;}
  .gear svg{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;}

  .body{display:grid;grid-template-columns:1fr 1fr;transition:grid-template-columns .24s var(--ease);overflow:hidden;}
  .body.single{grid-template-columns:1fr 0fr;}
  .pane{padding:13px 16px 16px;min-height:150px;position:relative;}
  .pane-out{border-left:1px solid rgba(255,255,255,.1);transition:opacity .16s var(--ease),border-color .2s var(--ease);overflow:hidden;white-space:nowrap;}
  .body.single .pane-out{opacity:0;border-left-color:transparent;}
  .plabel{font:500 10px/1 var(--ui);letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:11px;}
  pre{font:11.5px/1.7 var(--mono);margin:0;white-space:pre;}
  .k{color:#82C0FF;}.s{color:#84E08F;}.n{color:#FFB66B;}.p{color:rgba(255,255,255,.42);}
  .run-hint{position:absolute;right:13px;bottom:13px;padding:5px 9px;border-radius:8px;font:10.5px/1 var(--ui);display:flex;align-items:center;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.82);opacity:0;transform:translateY(5px);transition:opacity .18s var(--ease),transform .18s var(--ease);pointer-events:none;}
  .body.single .run-hint{opacity:1;transform:none;}

  .status{display:flex;justify-content:space-between;align-items:center;padding:8px 13px;border-top:1px solid rgba(255,255,255,.1);font:10.5px/1 var(--mono);color:rgba(255,255,255,.62);font-variant-numeric:tabular-nums;}
  .sb-left{display:flex;align-items:center;white-space:nowrap;}
  .dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#5BE3A0;margin-right:7px;box-shadow:0 0 6px rgba(91,227,160,.8);}
  .sb-sep{opacity:.45;margin:0 6px;}
  .sb-right{display:flex;align-items:center;gap:8px;}
  .sb-div{width:1px;height:13px;background:rgba(255,255,255,.16);}
  .kbd{font:9.5px/1 var(--mono);padding:2px 5px;border-radius:4px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);}

  .sc-btn{display:inline-flex;align-items:center;background:transparent;border:none;color:rgba(255,255,255,.62);font:inherit;cursor:pointer;padding:3px 5px;border-radius:7px;white-space:nowrap;transition:background .12s ease,color .12s ease;}
  .sc-btn:hover{background:rgba(255,255,255,.07);color:rgba(255,255,255,.9);}
  .sc-kbd{display:inline-block;overflow:hidden;max-width:0;opacity:0;transform:translateX(5px);margin-right:0;white-space:nowrap;
    transition:max-width .15s var(--ease),opacity .15s var(--ease),transform .15s var(--ease),margin-right .15s var(--ease);}
  .sc-btn:hover .sc-kbd,.sc-btn:focus-visible .sc-kbd{max-width:46px;opacity:1;transform:none;margin-right:6px;}
```

## Preserved prototype body source

```html
<header class="head">
  <h1>Jsonita · 单窗切换 + 状态栏 hover · v2</h1>
  <p>右侧两个控件现在<b>对称</b>:平时只有文字「Switch to Single Panel」和「History」,<b>hover / 键盘聚焦才滑出快捷键</b>(<code>⌘\</code> / <code>⌘Y</code>)。点 Switch 或按 <code>⌘\</code>:双栏合成单栏 + Run hint 滑入;窗口尺寸不因 toggle 主动变化。无图标、无冗余文字。</p>
</header>

<div class="wrap">
  <div class="controls">
    <button class="btn" onclick="toggleSplit()">切换 Split / Single</button>
    <span class="tip">把鼠标移到右下角 <b>Switch…</b> 或 <b>History</b> 上 → 看快捷键滑出</span>
    <label class="chk"><input type="checkbox" id="rm" onchange="document.body.classList.toggle('rm',this.checked)"> 模拟「减弱动态效果」</label>
  </div>

  <div class="stage">
    <div class="win" id="win">
      <div class="tabs">
        <button class="tab active">Format</button>
        <button class="tab">Minify</button>
        <button class="tab">Tree</button>
        <button class="tab">→Str</button>
        <button class="tab">→JSON</button>
        <span class="tab-spacer"></span>
        <button class="gear" aria-label="Settings"><svg width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
      </div>
      <div class="body" id="bodyGrid">
        <div class="pane">
          <div class="plabel" id="inLabel">Input</div>
<pre><span class="p">{</span>
  <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span>
  <span class="k">"age"</span><span class="p">:</span> <span class="n">30</span>
<span class="p">}</span></pre>
          <div class="run-hint"><span class="kbd" style="margin-right:6px;">⌘↵</span>Run Format</div>
        </div>
        <div class="pane pane-out">
          <div class="plabel">Output · 2 spaces</div>
<pre><span class="p">{</span>
  <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span>
  <span class="k">"age"</span><span class="p">:</span> <span class="n">30</span>
<span class="p">}</span></pre>
        </div>
      </div>
      <div class="status">
        <span class="sb-left"><span class="dot"></span>Valid JSON<span class="sb-sep">·</span>3 lines<span class="sb-sep">·</span>26 bytes</span>
        <span class="sb-right">
          <button class="sc-btn" id="splitBtn" onclick="toggleSplit()">
            <span class="sc-kbd"><span class="kbd">⌘\</span></span>
            <span id="splitLabel">Switch to Single Panel</span>
          </button>
          <span class="sb-div"></span>
          <button class="sc-btn" id="histBtn">
            <span class="sc-kbd"><span class="kbd">⌘Y</span></span>
            <span>History</span>
          </button>
        </span>
      </div>
    </div>
  </div>
</div>

<script>
  var win=document.getElementById('win'),
      bodyGrid=document.getElementById('bodyGrid'),
      splitLabel=document.getElementById('splitLabel'),
      inLabel=document.getElementById('inLabel'),
      single=false, W_DUAL=560, W_SINGLE=440;

  function toggleSplit(){
    single=!single;
    bodyGrid.classList.toggle('single',single);
    splitLabel.textContent = single ? 'Switch to Split Panel' : 'Switch to Single Panel';
    inLabel.textContent = single ? 'In-place editor' : 'Input';
    win.style.width = (single ? W_SINGLE : W_DUAL) + 'px';
  }

  document.addEventListener('keydown',function(e){
    if((e.metaKey||e.ctrlKey)&&e.key==='\\'){ e.preventDefault(); toggleSplit(); }
  });
</script>
```
