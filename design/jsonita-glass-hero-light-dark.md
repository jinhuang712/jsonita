# Jsonita · 原生玻璃方向(精修)

主浮窗 hero(Format · valid JSON),light + dark 两版毛玻璃。系统蓝作为唯一强调色贯穿明暗;窗体半透叠在桌面壁纸上才看得出 vibrancy。这一轮只打磨这一屏,确认后再铺其余屏并落进 tokens。

Dark glass

Format Minify Tree →Str →JSON Settings

Input

```
{"name":"alice","age":30,"items":["a","b","c"]}
```

Output · 2 spaces Copy

```
{
  "name": "alice",
  "age": 30,
  "items": ["a", "b", "c"]
}
```

Valid JSON ·5 lines ·76 bytes ⌘Y History

Light glass

Format Minify Tree →Str →JSON Settings

Input

```
{"name":"alice","age":30,"items":["a","b","c"]}
```

Output · 2 spaces Copy

```
{
  "name": "alice",
  "age": 30,
  "items": ["a", "b", "c"]
}
```

Valid JSON ·5 lines ·76 bytes ⌘Y History

系统蓝是唯一强调色,明暗都靠它(dark 用提亮蓝 #7FB3FF 文字 / light 用 #0A6CE0);valid 状态点单独走绿。语法高亮在两版都重新调过对比度。下面是这版的取色,确认方向后我会整理成 token 落到 src/styles/tokens.css。

dark glass

light glass

## Preserved prototype CSS

### CSS block 1

```css
:root{
    --ui: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Helvetica Neue", Arial, sans-serif;
    --mono: "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
  }
  *{ box-sizing:border-box; }
  body{ margin:0; background:#0E0E10; color:#E7E8EA; font-family:var(--ui); padding:46px 24px 70px; -webkit-font-smoothing:antialiased; }
  .page-head{ max-width:880px; margin:0 auto 30px; }
  .page-head h1{ font-weight:600; font-size:22px; margin:0 0 9px; letter-spacing:.2px; }
  .page-head p{ color:#9498A0; font-size:14px; line-height:1.65; margin:0; max-width:740px; }

  .block{ max-width:880px; margin:0 auto 30px; }
  .mode-label{ font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#6E727B; margin:0 0 13px; display:flex; align-items:center; gap:8px; }
  .mode-dot{ width:8px; height:8px; border-radius:50%; }

  .stage{ display:flex; align-items:center; justify-content:center; padding:48px 38px; border-radius:18px; position:relative; overflow:hidden; }
  .stage-d{ background:linear-gradient(135deg, #2A2A5E 0%, #1C4E66 48%, #5A2A55 100%); }
  .stage-d::before{ content:""; position:absolute; width:420px; height:420px; left:-80px; top:-150px; background:radial-gradient(circle, rgba(120,180,255,.55), transparent 62%); filter:blur(48px); }
  .stage-d::after{ content:""; position:absolute; width:400px; height:400px; right:-100px; bottom:-160px; background:radial-gradient(circle, rgba(255,120,200,.42), transparent 62%); filter:blur(56px); }
  .stage-l{ background:linear-gradient(135deg, #D7E2F5 0%, #ECD9EC 50%, #F4E7D5 100%); }
  .stage-l::before{ content:""; position:absolute; width:420px; height:420px; left:-80px; top:-150px; background:radial-gradient(circle, rgba(110,165,255,.45), transparent 62%); filter:blur(50px); }
  .stage-l::after{ content:""; position:absolute; width:400px; height:400px; right:-100px; bottom:-160px; background:radial-gradient(circle, rgba(255,170,120,.4), transparent 62%); filter:blur(56px); }

  .win{ position:relative; z-index:1; width:760px; max-width:100%; border-radius:16px; overflow:hidden; }
  .tabs{ display:flex; align-items:center; gap:5px; padding:10px 12px; }
  .tab{ font:500 12.5px/1 var(--ui); border:1px solid transparent; background:transparent; padding:6px 12px; border-radius:8px; cursor:default; transition:background .12s; }
  .tab-spacer{ flex:1; }
  .gear{ background:transparent; border:none; cursor:default; padding:5px; display:flex; border-radius:7px; }
  .ico{ display:block; }
  .body{ display:grid; grid-template-columns:1fr 1fr; }
  .pane{ padding:14px 17px 18px; min-height:158px; }
  .pane-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; min-height:16px; }
  .pane-label{ font:500 10.5px/1 var(--ui); letter-spacing:1.1px; text-transform:uppercase; margin:0; }
  .copy-btn{ background:transparent; border:none; cursor:default; padding:0; display:flex; }
  .code{ font:12.5px/1.78 var(--mono); margin:0; white-space:pre; }
  .status{ display:flex; justify-content:space-between; align-items:center; padding:9px 16px; font:11.5px/1 var(--mono); font-variant-numeric:tabular-nums; }
  .dot{ display:inline-block; width:7px; height:7px; border-radius:50%; vertical-align:middle; margin-right:8px; }
  .st-sep{ opacity:.45; margin:0 6px; }
  .kbd{ font:11px/1 var(--mono); padding:2px 6px; border-radius:5px; border:1px solid; margin-right:6px; }

  /* ---------- DARK GLASS ---------- */
  .win-d{ background:rgba(26,28,36,.52); -webkit-backdrop-filter:blur(42px) saturate(175%); backdrop-filter:blur(42px) saturate(175%); border:1px solid rgba(255,255,255,.16); box-shadow:0 32px 74px -22px rgba(0,0,0,.66), inset 0 1px 0 rgba(255,255,255,.22); color:#EEF0F4; }
  .win-d .tabs{ border-bottom:1px solid rgba(255,255,255,.1); }
  .win-d .tab{ color:rgba(255,255,255,.62); }
  .win-d .tab.active{ background:rgba(255,255,255,.14); color:#7FB3FF; border-color:rgba(255,255,255,.2); }
  .win-d .gear{ color:rgba(255,255,255,.55); }
  .win-d .pane + .pane{ border-left:1px solid rgba(255,255,255,.1); }
  .win-d .pane-label{ color:rgba(255,255,255,.5); }
  .win-d .copy-btn{ color:rgba(255,255,255,.45); }
  .win-d .code{ color:#E7EAEF; }
  .win-d .k{ color:#82C0FF; } .win-d .s{ color:#84E08F; } .win-d .n{ color:#FFB66B; } .win-d .p{ color:rgba(255,255,255,.42); }
  .win-d .status{ border-top:1px solid rgba(255,255,255,.1); color:rgba(255,255,255,.62); }
  .win-d .dot{ background:#5BE3A0; box-shadow:0 0 8px rgba(91,227,160,.85); }
  .win-d .kbd{ border-color:rgba(255,255,255,.2); color:#EEF0F4; background:rgba(255,255,255,.1); }

  /* ---------- LIGHT GLASS ---------- */
  .win-l{ background:rgba(255,255,255,.6); -webkit-backdrop-filter:blur(42px) saturate(180%); backdrop-filter:blur(42px) saturate(180%); border:1px solid rgba(0,0,0,.07); box-shadow:0 32px 74px -22px rgba(40,40,90,.3), inset 0 1px 0 rgba(255,255,255,.85); color:#1D1F26; }
  .win-l .tabs{ border-bottom:1px solid rgba(0,0,0,.07); }
  .win-l .tab{ color:rgba(20,22,30,.55); }
  .win-l .tab.active{ background:rgba(10,122,255,.12); color:#0A6CE0; border-color:rgba(10,122,255,.22); }
  .win-l .gear{ color:rgba(20,22,30,.5); }
  .win-l .pane + .pane{ border-left:1px solid rgba(0,0,0,.07); }
  .win-l .pane-label{ color:rgba(20,22,30,.45); }
  .win-l .copy-btn{ color:rgba(20,22,30,.4); }
  .win-l .code{ color:#23262E; }
  .win-l .k{ color:#0B66C2; } .win-l .s{ color:#2E7D4F; } .win-l .n{ color:#B5651D; } .win-l .p{ color:rgba(20,22,30,.4); }
  .win-l .status{ border-top:1px solid rgba(0,0,0,.07); color:rgba(20,22,30,.55); }
  .win-l .dot{ background:#1F9E5A; box-shadow:0 0 7px rgba(31,158,90,.5); }
  .win-l .kbd{ border-color:rgba(0,0,0,.14); color:rgba(20,22,30,.6); background:rgba(0,0,0,.05); }

  footer{ max-width:880px; margin:40px auto 0; color:#7A7F88; font-size:12.5px; line-height:1.7; border-top:1px solid rgba(255,255,255,.08); padding-top:20px; }
  .pal{ display:flex; gap:18px; flex-wrap:wrap; margin:14px 0 4px; }
  .pal-group{ }
  .pal-title{ font-size:11px; letter-spacing:.5px; color:#9498A0; margin-bottom:7px; }
  .chips{ display:flex; gap:6px; }
  .chip{ width:22px; height:22px; border-radius:6px; border:1px solid rgba(255,255,255,.14); }
  @media (max-width:700px){ .body{ grid-template-columns:1fr; } .win-d .pane + .pane{ border-left:none; border-top:1px solid rgba(255,255,255,.1);} .win-l .pane + .pane{ border-left:none; border-top:1px solid rgba(0,0,0,.07);} }
```

## Preserved prototype body source

```html
<header class="page-head">
  <h1>Jsonita · 原生玻璃方向(精修)</h1>
  <p>主浮窗 hero(Format · valid JSON),light + dark 两版毛玻璃。系统蓝作为唯一强调色贯穿明暗;窗体半透叠在桌面壁纸上才看得出 vibrancy。这一轮只打磨这一屏,确认后再铺其余屏并落进 tokens。</p>
</header>

<!-- ===== DARK ===== -->
<section class="block">
  <div class="mode-label"><span class="mode-dot" style="background:#5BE3A0"></span>Dark glass</div>
  <div class="stage stage-d">
    <div class="win win-d">
      <div class="tabs">
        <button class="tab active">Format</button>
        <button class="tab">Minify</button>
        <button class="tab">Tree</button>
        <button class="tab">→Str</button>
        <button class="tab">→JSON</button>
        <span class="tab-spacer"></span>
        <button class="gear" aria-label="Settings"><svg class="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
      </div>
      <div class="body">
        <div class="pane">
          <div class="pane-head"><span class="pane-label">Input</span></div>
<pre class="code"><span class="p">{</span><span class="k">"name"</span><span class="p">:</span><span class="s">"alice"</span><span class="p">,</span><span class="k">"age"</span><span class="p">:</span><span class="n">30</span><span class="p">,</span><span class="k">"items"</span><span class="p">:</span><span class="p">[</span><span class="s">"a"</span><span class="p">,</span><span class="s">"b"</span><span class="p">,</span><span class="s">"c"</span><span class="p">]</span><span class="p">}</span></pre>
        </div>
        <div class="pane">
          <div class="pane-head"><span class="pane-label">Output · 2 spaces</span><button class="copy-btn" aria-label="Copy"><svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></div>
<pre class="code"><span class="p">{</span>
  <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span>
  <span class="k">"age"</span><span class="p">:</span> <span class="n">30</span><span class="p">,</span>
  <span class="k">"items"</span><span class="p">:</span> <span class="p">[</span><span class="s">"a"</span><span class="p">,</span> <span class="s">"b"</span><span class="p">,</span> <span class="s">"c"</span><span class="p">]</span>
<span class="p">}</span></pre>
        </div>
      </div>
      <div class="status">
        <span><span class="dot"></span>Valid JSON<span class="st-sep">·</span>5 lines<span class="st-sep">·</span>76 bytes</span>
        <span><span class="kbd">⌘Y</span>History</span>
      </div>
    </div>
  </div>
</section>

<!-- ===== LIGHT ===== -->
<section class="block">
  <div class="mode-label"><span class="mode-dot" style="background:#1F9E5A"></span>Light glass</div>
  <div class="stage stage-l">
    <div class="win win-l">
      <div class="tabs">
        <button class="tab active">Format</button>
        <button class="tab">Minify</button>
        <button class="tab">Tree</button>
        <button class="tab">→Str</button>
        <button class="tab">→JSON</button>
        <span class="tab-spacer"></span>
        <button class="gear" aria-label="Settings"><svg class="ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
      </div>
      <div class="body">
        <div class="pane">
          <div class="pane-head"><span class="pane-label">Input</span></div>
<pre class="code"><span class="p">{</span><span class="k">"name"</span><span class="p">:</span><span class="s">"alice"</span><span class="p">,</span><span class="k">"age"</span><span class="p">:</span><span class="n">30</span><span class="p">,</span><span class="k">"items"</span><span class="p">:</span><span class="p">[</span><span class="s">"a"</span><span class="p">,</span><span class="s">"b"</span><span class="p">,</span><span class="s">"c"</span><span class="p">]</span><span class="p">}</span></pre>
        </div>
        <div class="pane">
          <div class="pane-head"><span class="pane-label">Output · 2 spaces</span><button class="copy-btn" aria-label="Copy"><svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></div>
<pre class="code"><span class="p">{</span>
  <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span>
  <span class="k">"age"</span><span class="p">:</span> <span class="n">30</span><span class="p">,</span>
  <span class="k">"items"</span><span class="p">:</span> <span class="p">[</span><span class="s">"a"</span><span class="p">,</span> <span class="s">"b"</span><span class="p">,</span> <span class="s">"c"</span><span class="p">]</span>
<span class="p">}</span></pre>
        </div>
      </div>
      <div class="status">
        <span><span class="dot"></span>Valid JSON<span class="st-sep">·</span>5 lines<span class="st-sep">·</span>76 bytes</span>
        <span><span class="kbd">⌘Y</span>History</span>
      </div>
    </div>
  </div>
</section>

<footer>
  系统蓝是唯一强调色,明暗都靠它(dark 用提亮蓝 #7FB3FF 文字 / light 用 #0A6CE0);valid 状态点单独走绿。语法高亮在两版都重新调过对比度。下面是这版的取色,确认方向后我会整理成 token 落到 src/styles/tokens.css。
  <div class="pal">
    <div class="pal-group">
      <div class="pal-title">dark glass</div>
      <div class="chips">
        <span class="chip" style="background:#1A1C24" title="玻璃底 rgba(26,28,36,.52)"></span>
        <span class="chip" style="background:#0A84FF" title="强调 系统蓝 #0A84FF / 文字 #7FB3FF"></span>
        <span class="chip" style="background:#82C0FF" title="key #82C0FF"></span>
        <span class="chip" style="background:#84E08F" title="string #84E08F"></span>
        <span class="chip" style="background:#FFB66B" title="number #FFB66B"></span>
        <span class="chip" style="background:#5BE3A0" title="valid #5BE3A0"></span>
      </div>
    </div>
    <div class="pal-group">
      <div class="pal-title">light glass</div>
      <div class="chips">
        <span class="chip" style="background:#F2F4F8; border-color:rgba(0,0,0,.12)" title="玻璃底 rgba(255,255,255,.6)"></span>
        <span class="chip" style="background:#0A6CE0" title="强调 系统蓝 #0A6CE0"></span>
        <span class="chip" style="background:#0B66C2" title="key #0B66C2"></span>
        <span class="chip" style="background:#2E7D4F" title="string #2E7D4F"></span>
        <span class="chip" style="background:#B5651D" title="number #B5651D"></span>
        <span class="chip" style="background:#1F9E5A" title="valid #1F9E5A"></span>
      </div>
    </div>
  </div>
</footer>
```
