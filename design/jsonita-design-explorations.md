# Jsonita · 视觉方向探索

同一个主浮窗(Format · valid JSON),三种高级审美方向 —— 一样的功能骨架(Tab 条 / 双栏 / 状态栏 / 语法高亮),不一样的气质。挑一个对味的,我再铺到全部 13 屏 + light/dark 双主题,并落进真实 tokens。

方向 A

石墨极简 · Graphite

Raycast / Linear / Vercel 一脉。近黑石墨分层、单一靛紫强调、发丝级边框、紧凑字排、柔和大投影。冷静、克制、纯粹的"开发者高级感"。

Format Minify Tree →Str →JSON ⚙

Input

```

{"name":"alice","age":30,"items":["a","b","c"]}

```

Output · 2 spaces

```

{
  "name": "alice",
  "age": 30,
  "items": ["a", "b", "c"]
}

```

Valid JSON ·5 lines ·76 bytes ⌘Y History

方向 B

暖调编辑感 · Paper & Ink

纸感浅色、暖琥珀强调(承接你现有的 accent #B7792D)、墨色文字、大留白、近乎零阴影、active tab 走细下划线而非色块。安静、考究,像高级文本编辑器 / Things。

Format Minify Tree →Str →JSON ⚙

Input

```

{"name":"alice","age":30,"items":["a","b","c"]}

```

Output · 2 spaces

```

{
  "name": "alice",
  "age": 30,
  "items": ["a", "b", "c"]
}

```

Valid JSON ·5 lines ·76 bytes ⌘Y History

方向 C

原生玻璃 · Vibrancy

macOS 毛玻璃质感。半透磨砂窗体(backdrop blur)、系统蓝强调、大圆角、明亮高光描边、柔和大投影。最贴近"原生 macOS 高级感",浮窗叠在桌面上时尤其出彩。

Format Minify Tree →Str →JSON ⚙

Input

```

{"name":"alice","age":30,"items":["a","b","c"]}

```

Output · 2 spaces

```

{
  "name": "alice",
  "age": 30,
  "items": ["a", "b", "c"]
}

```

Valid JSON ·5 lines ·76 bytes ⌘Y History

三个方向用的都是同一份内容与骨架,只换视觉语言,方便你公平对比。选定后我会:① 把该方向的色板 / 圆角 / 阴影 / 字阶整理成 token;② 铺到 6 态主窗 + 设置 / 历史 / AI Fix / 空状态等其余屏;③ 出 light + dark 双版;④ 落进 src/styles/tokens.css 并修掉上一轮评审的硬编码问题。

## Preserved prototype CSS

### CSS block 1

```css
:root{
    --ui: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Helvetica Neue", Arial, sans-serif;
    --mono: "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
  }
  *{ box-sizing: border-box; }
  body{ margin:0; background:#0E0E10; color:#E7E8EA; font-family:var(--ui); padding:46px 24px 70px; -webkit-font-smoothing:antialiased; }
  .page-head{ max-width:860px; margin:0 auto 30px; }
  .page-head h1{ font-weight:600; font-size:22px; margin:0 0 9px; letter-spacing:.2px; }
  .page-head p{ color:#9498A0; font-size:14px; line-height:1.65; margin:0; max-width:720px; }

  .dir{ max-width:860px; margin:0 auto 34px; }
  .dir-meta{ margin:0 0 15px; }
  .dir-kicker{ font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#6E727B; margin-bottom:6px; }
  .dir-name{ font-size:17px; font-weight:600; margin-bottom:7px; }
  .dir-vibe{ font-size:13px; line-height:1.6; color:#979CA4; max-width:700px; }
  .swatches{ display:flex; gap:6px; margin-top:13px; }
  .sw{ width:22px; height:22px; border-radius:6px; border:1px solid rgba(255,255,255,.13); }

  .stage{ display:flex; align-items:center; justify-content:center; padding:44px 34px; border-radius:16px; position:relative; overflow:hidden; }
  .stage-a{ background:radial-gradient(125% 125% at 28% 0%, #1c1f26 0%, #0c0d10 72%); }
  .stage-b{ background:linear-gradient(158deg, #F4EFE7 0%, #E8E0D2 100%); }
  .stage-c{ background:linear-gradient(135deg, #2C2A57 0%, #1E4E63 52%, #592A51 100%); }
  .stage-c::before{ content:""; position:absolute; width:400px; height:400px; left:-70px; top:-130px; background:radial-gradient(circle, rgba(120,180,255,.55), transparent 62%); filter:blur(44px); }
  .stage-c::after{ content:""; position:absolute; width:380px; height:380px; right:-90px; bottom:-150px; background:radial-gradient(circle, rgba(255,120,200,.42), transparent 62%); filter:blur(52px); }

  .win{ position:relative; z-index:1; width:720px; max-width:100%; border-radius:14px; overflow:hidden; }
  .tabs{ display:flex; align-items:center; gap:4px; padding:9px 11px; }
  .tab{ font:500 12.5px/1 var(--ui); border:1px solid transparent; background:transparent; padding:6px 11px; border-radius:7px; cursor:default; }
  .tab-spacer{ flex:1; }
  .gear{ background:transparent; border:none; font-size:14px; cursor:default; padding:4px 6px; }
  .body{ display:grid; grid-template-columns:1fr 1fr; }
  .pane{ padding:13px 16px 17px; min-height:150px; }
  .pane-label{ font:500 10.5px/1 var(--ui); letter-spacing:.9px; text-transform:uppercase; margin-bottom:11px; }
  .code{ font:12.5px/1.74 var(--mono); margin:0; white-space:pre; }
  .status{ display:flex; justify-content:space-between; align-items:center; padding:9px 15px; font:11.5px/1 var(--mono); }
  .dot{ display:inline-block; width:7px; height:7px; border-radius:50%; vertical-align:middle; margin-right:8px; }
  .st-sep{ opacity:.5; margin:0 5px; }
  .kbd{ font:11px/1 var(--mono); padding:2px 5px; border-radius:4px; border:1px solid; margin-right:6px; }

  /* ---------- A · Graphite ---------- */
  .win-a{ background:#16181C; border:1px solid rgba(255,255,255,.07); box-shadow:0 24px 62px -18px rgba(0,0,0,.82), inset 0 1px 0 rgba(255,255,255,.05); color:#E6E8EC; }
  .win-a .tabs{ border-bottom:1px solid rgba(255,255,255,.06); }
  .win-a .tab{ color:#868C95; }
  .win-a .tab.active{ background:rgba(129,140,248,.15); color:#AEB6FF; border-color:rgba(129,140,248,.28); }
  .win-a .gear{ color:#6B7079; }
  .win-a .pane + .pane{ border-left:1px solid rgba(255,255,255,.06); }
  .win-a .pane-label{ color:#5E646E; }
  .win-a .code{ color:#C9CDD4; }
  .win-a .k{ color:#84B6FF; } .win-a .s{ color:#9FD0A8; } .win-a .n{ color:#E3B24E; } .win-a .p{ color:#5A616B; }
  .win-a .status{ border-top:1px solid rgba(255,255,255,.06); color:#7A808A; }
  .win-a .dot{ background:#57D08A; box-shadow:0 0 7px rgba(87,208,138,.8); }
  .win-a .kbd{ border-color:rgba(255,255,255,.14); color:#9298A2; background:rgba(255,255,255,.04); }

  /* ---------- B · Warm Editorial ---------- */
  .win-b{ background:#FCFBF8; border:1px solid #E8E1D5; box-shadow:0 13px 36px -14px rgba(90,70,30,.2), inset 0 1px 0 #fff; color:#26231C; }
  .win-b .tabs{ border-bottom:1px solid #EFEAE0; gap:2px; }
  .win-b .tab{ color:#9A9183; border-radius:0; padding:7px 12px 9px; position:relative; }
  .win-b .tab.active{ color:#1E1B16; }
  .win-b .tab.active::after{ content:""; position:absolute; left:10px; right:10px; bottom:-1px; height:2px; background:#B7792D; }
  .win-b .gear{ color:#A89F8F; }
  .win-b .pane + .pane{ border-left:1px solid #EFEAE0; }
  .win-b .pane-label{ color:#A89F8F; }
  .win-b .code{ color:#2A271F; }
  .win-b .k{ color:#2D6A9F; } .win-b .s{ color:#5E7C3F; } .win-b .n{ color:#9A6B2D; } .win-b .p{ color:#B0A693; }
  .win-b .status{ border-top:1px solid #EFEAE0; color:#8C8474; }
  .win-b .dot{ background:#3F8F75; }
  .win-b .kbd{ border-color:#E0D8C9; color:#8C8474; background:#F4EFE6; }

  /* ---------- C · Glass ---------- */
  .win-c{ background:rgba(26,28,36,.5); -webkit-backdrop-filter:blur(40px) saturate(170%); backdrop-filter:blur(40px) saturate(170%); border:1px solid rgba(255,255,255,.16); border-radius:16px; box-shadow:0 30px 72px -22px rgba(0,0,0,.66), inset 0 1px 0 rgba(255,255,255,.2); color:#EEF0F4; }
  .win-c .tabs{ border-bottom:1px solid rgba(255,255,255,.1); }
  .win-c .tab{ color:rgba(255,255,255,.6); }
  .win-c .tab.active{ background:rgba(255,255,255,.14); color:#fff; border-color:rgba(255,255,255,.2); }
  .win-c .gear{ color:rgba(255,255,255,.55); }
  .win-c .pane + .pane{ border-left:1px solid rgba(255,255,255,.1); }
  .win-c .pane-label{ color:rgba(255,255,255,.5); }
  .win-c .code{ color:#E7EAEF; }
  .win-c .k{ color:#82C0FF; } .win-c .s{ color:#84E08F; } .win-c .n{ color:#FFB66B; } .win-c .p{ color:rgba(255,255,255,.45); }
  .win-c .status{ border-top:1px solid rgba(255,255,255,.1); color:rgba(255,255,255,.6); }
  .win-c .dot{ background:#5BE3A0; box-shadow:0 0 8px rgba(91,227,160,.85); }
  .win-c .kbd{ border-color:rgba(255,255,255,.2); color:#EEF0F4; background:rgba(255,255,255,.1); }

  footer{ max-width:860px; margin:40px auto 0; color:#6E727B; font-size:12.5px; line-height:1.65; border-top:1px solid rgba(255,255,255,.08); padding-top:20px; }
  @media (max-width:680px){ .body{ grid-template-columns:1fr; } .win-a .pane + .pane,.win-b .pane + .pane,.win-c .pane + .pane{ border-left:none; border-top:1px solid rgba(128,128,128,.18); } }
```

## Preserved prototype body source

```html
<header class="page-head">
  <h1>Jsonita · 视觉方向探索</h1>
  <p>同一个主浮窗(Format · valid JSON),三种高级审美方向 —— 一样的功能骨架(Tab 条 / 双栏 / 状态栏 / 语法高亮),不一样的气质。挑一个对味的,我再铺到全部 13 屏 + light/dark 双主题,并落进真实 tokens。</p>
</header>

<!-- ============ A · Graphite ============ -->
<section class="dir">
  <div class="dir-meta">
    <div class="dir-kicker">方向 A</div>
    <div class="dir-name">石墨极简 · Graphite</div>
    <div class="dir-vibe">Raycast / Linear / Vercel 一脉。近黑石墨分层、单一靛紫强调、发丝级边框、紧凑字排、柔和大投影。冷静、克制、纯粹的"开发者高级感"。</div>
    <div class="swatches">
      <span class="sw" style="background:#16181C" title="窗体 #16181C"></span>
      <span class="sw" style="background:#22262E" title="表面 #22262E"></span>
      <span class="sw" style="background:#818CF8" title="强调 靛紫 #818CF8"></span>
      <span class="sw" style="background:#9FD0A8" title="string #9FD0A8"></span>
      <span class="sw" style="background:#84B6FF" title="key #84B6FF"></span>
      <span class="sw" style="background:#E3B24E" title="number #E3B24E"></span>
    </div>
  </div>
  <div class="stage stage-a">
    <div class="win win-a">
      <div class="tabs">
        <button class="tab active">Format</button>
        <button class="tab">Minify</button>
        <button class="tab">Tree</button>
        <button class="tab">→Str</button>
        <button class="tab">→JSON</button>
        <span class="tab-spacer"></span>
        <button class="gear" aria-label="Settings">⚙</button>
      </div>
      <div class="body">
        <div class="pane">
          <div class="pane-label">Input</div>
<pre class="code"><span class="p">{</span><span class="k">"name"</span><span class="p">:</span><span class="s">"alice"</span><span class="p">,</span><span class="k">"age"</span><span class="p">:</span><span class="n">30</span><span class="p">,</span><span class="k">"items"</span><span class="p">:</span><span class="p">[</span><span class="s">"a"</span><span class="p">,</span><span class="s">"b"</span><span class="p">,</span><span class="s">"c"</span><span class="p">]</span><span class="p">}</span></pre>
        </div>
        <div class="pane">
          <div class="pane-label">Output · 2 spaces</div>
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

<!-- ============ B · Warm Editorial ============ -->
<section class="dir">
  <div class="dir-meta">
    <div class="dir-kicker">方向 B</div>
    <div class="dir-name">暖调编辑感 · Paper &amp; Ink</div>
    <div class="dir-vibe">纸感浅色、暖琥珀强调(承接你现有的 accent #B7792D)、墨色文字、大留白、近乎零阴影、active tab 走细下划线而非色块。安静、考究,像高级文本编辑器 / Things。</div>
    <div class="swatches">
      <span class="sw" style="background:#FCFBF8" title="纸 #FCFBF8"></span>
      <span class="sw" style="background:#EFEAE0" title="边框 #EFEAE0"></span>
      <span class="sw" style="background:#B7792D" title="强调 琥珀 #B7792D"></span>
      <span class="sw" style="background:#5E7C3F" title="string 橄榄 #5E7C3F"></span>
      <span class="sw" style="background:#2D6A9F" title="key 石板蓝 #2D6A9F"></span>
      <span class="sw" style="background:#9A6B2D" title="number 赭石 #9A6B2D"></span>
    </div>
  </div>
  <div class="stage stage-b">
    <div class="win win-b">
      <div class="tabs">
        <button class="tab active">Format</button>
        <button class="tab">Minify</button>
        <button class="tab">Tree</button>
        <button class="tab">→Str</button>
        <button class="tab">→JSON</button>
        <span class="tab-spacer"></span>
        <button class="gear" aria-label="Settings">⚙</button>
      </div>
      <div class="body">
        <div class="pane">
          <div class="pane-label">Input</div>
<pre class="code"><span class="p">{</span><span class="k">"name"</span><span class="p">:</span><span class="s">"alice"</span><span class="p">,</span><span class="k">"age"</span><span class="p">:</span><span class="n">30</span><span class="p">,</span><span class="k">"items"</span><span class="p">:</span><span class="p">[</span><span class="s">"a"</span><span class="p">,</span><span class="s">"b"</span><span class="p">,</span><span class="s">"c"</span><span class="p">]</span><span class="p">}</span></pre>
        </div>
        <div class="pane">
          <div class="pane-label">Output · 2 spaces</div>
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

<!-- ============ C · Glass ============ -->
<section class="dir">
  <div class="dir-meta">
    <div class="dir-kicker">方向 C</div>
    <div class="dir-name">原生玻璃 · Vibrancy</div>
    <div class="dir-vibe">macOS 毛玻璃质感。半透磨砂窗体(backdrop blur)、系统蓝强调、大圆角、明亮高光描边、柔和大投影。最贴近"原生 macOS 高级感",浮窗叠在桌面上时尤其出彩。</div>
    <div class="swatches">
      <span class="sw" style="background:#1E2230" title="玻璃底 #1E2230"></span>
      <span class="sw" style="background:#3A3F4A" title="高光描边"></span>
      <span class="sw" style="background:#0A84FF" title="强调 系统蓝 #0A84FF"></span>
      <span class="sw" style="background:#84E08F" title="string #84E08F"></span>
      <span class="sw" style="background:#82C0FF" title="key #82C0FF"></span>
      <span class="sw" style="background:#FFB66B" title="number #FFB66B"></span>
    </div>
  </div>
  <div class="stage stage-c">
    <div class="win win-c">
      <div class="tabs">
        <button class="tab active">Format</button>
        <button class="tab">Minify</button>
        <button class="tab">Tree</button>
        <button class="tab">→Str</button>
        <button class="tab">→JSON</button>
        <span class="tab-spacer"></span>
        <button class="gear" aria-label="Settings">⚙</button>
      </div>
      <div class="body">
        <div class="pane">
          <div class="pane-label">Input</div>
<pre class="code"><span class="p">{</span><span class="k">"name"</span><span class="p">:</span><span class="s">"alice"</span><span class="p">,</span><span class="k">"age"</span><span class="p">:</span><span class="n">30</span><span class="p">,</span><span class="k">"items"</span><span class="p">:</span><span class="p">[</span><span class="s">"a"</span><span class="p">,</span><span class="s">"b"</span><span class="p">,</span><span class="s">"c"</span><span class="p">]</span><span class="p">}</span></pre>
        </div>
        <div class="pane">
          <div class="pane-label">Output · 2 spaces</div>
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
  三个方向用的都是同一份内容与骨架,只换视觉语言,方便你公平对比。选定后我会:① 把该方向的色板 / 圆角 / 阴影 / 字阶整理成 token;② 铺到 6 态主窗 + 设置 / 历史 / AI Fix / 空状态等其余屏;③ 出 light + dark 双版;④ 落进 src/styles/tokens.css 并修掉上一轮评审的硬编码问题。
</footer>
```
