# Jsonita · 设置详版

6 个分组按真实字段铺全(取自 `src/store/settings.ts` + `SettingsView.tsx` + zh-CN 文案)。Settings 是主 Jsonita 卡片内的整页状态,不是遮罩上的浮层 modal。右侧是从 General 到 About 的连续滚动配置页,左侧 nav 保留为目录索引;点击目录滚动到对应 section,滚动时 active 高亮跟随。控件按真实实现:开关用 方形勾选框、语言/主题/历史上限用下拉、Unwrap 超时是数字输入、API Key 带 测试/保存/移除。`aiModelId` 是内部默认值,不单独暴露编辑控件。

Light · 左侧目录滚动定位

设置

通用 快捷键 AI 历史 JSON 变换 关于

语言 简体中文

主题 System

开机自启动

失焦自动隐藏

智能扩宽

单窗模式

自动粘贴剪贴板

可自定义

呼出浮窗 ⌘⇧J

恢复上次会话 ⌘⇧L

内置快捷键

切换功能 Tab Tab ⇧Tab

退出编辑态 Esc

隐藏浮窗 Esc Esc

执行当前 / 接受 AI Fix ⌘↵

取消 AI Fix Esc

打开 / 关闭历史 ⌘Y

打开设置 ⌘,

清空输入 ⌘K

调整字体大小 ⌘+ ⌘- ⌘0

点「可自定义」快捷键后按目标组合键。系统保留组合(⌘Q / ⌘W / ⌘⇥ 等)默认阻塞;如需强制绑定走 Override。

启用 AI Fix

DeepSeek API Key

••••••••（已保存，可输入新 key 覆盖）

测试 保存 移除 已保存

历史上限 100

可选 10 / 50 / 100 / 200;超出按 pinned → starred → 时间排序淘汰。

自动解嵌套

Unwrap 超时 (ms) 200

编辑器软换行

Jsonita

Tiny menu-bar JSON toolkit

GitHub

Version

1.0.0-beta.1

License

MIT

Author

Jin Huang

Data & logs

~/Library/Application Support/Jsonita/

~/Library/Logs/Jsonita/

全部重置 完成

Dark · 左侧目录滚动定位

设置

通用 快捷键 AI 历史 JSON 变换 关于

语言 简体中文

主题 System

开机自启动

失焦自动隐藏

智能扩宽

单窗模式

自动粘贴剪贴板

可自定义

呼出浮窗 ⌘⇧J

恢复上次会话 ⌘⇧L

内置快捷键

切换功能 Tab Tab ⇧Tab

退出编辑态 Esc

隐藏浮窗 Esc Esc

执行当前 / 接受 AI Fix ⌘↵

取消 AI Fix Esc

打开 / 关闭历史 ⌘Y

打开设置 ⌘,

清空输入 ⌘K

调整字体大小 ⌘+ ⌘- ⌘0

点「可自定义」快捷键后按目标组合键。系统保留组合(⌘Q / ⌘W / ⌘⇥ 等)默认阻塞;如需强制绑定走 Override。

启用 AI Fix

DeepSeek API Key

••••••••（已保存，可输入新 key 覆盖）

测试 保存 移除 已保存

历史上限 100

可选 10 / 50 / 100 / 200;超出按 pinned → starred → 时间排序淘汰。

自动解嵌套

Unwrap 超时 (ms) 200

编辑器软换行

Jsonita

Tiny menu-bar JSON toolkit

GitHub

Version

1.0.0-beta.1

License

MIT

Author

Jin Huang

Data & logs

~/Library/Application Support/Jsonita/

~/Library/Logs/Jsonita/

全部重置 完成

字段全部来自真实实现,未加未实现项:通用 7 项(语言/主题 + 5 个勾选)、快捷键 2 可自定义 + 9 内置、AI(开关 + DeepSeek key + 测试/保存/移除;模型为内部默认值不单独暴露)、历史上限、JSON 变换 3 项、关于(版本 1.0.0-beta.1 / MIT / 作者 + 数据与日志路径)。强调色仍是系统蓝,勾选框选中 = 蓝填充白勾,与全局玻璃方向一致。

## Preserved prototype CSS

### CSS block 1

```css
:root{--ui:-apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang SC","Helvetica Neue",Arial,sans-serif;--mono:"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;}
  *{box-sizing:border-box;}
  body{margin:0;background:#0E0E10;color:#E7E8EA;font-family:var(--ui);padding:46px 24px 70px;-webkit-font-smoothing:antialiased;}
  .ico{fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;display:block;}
  .head{max-width:1160px;margin:0 auto 26px;}
  .head h1{font-weight:600;font-size:22px;margin:0 0 9px;letter-spacing:.2px;}
  .head p{color:#9498A0;font-size:14px;line-height:1.65;margin:0;max-width:780px;}
  .grid2{max-width:1160px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:18px;}
  .cap{font-size:10.5px;letter-spacing:1.3px;text-transform:uppercase;color:#6E727B;margin:0 0 10px;}

  .stage{display:flex;align-items:flex-start;justify-content:center;padding:34px 26px;border-radius:14px;position:relative;overflow:hidden;}
  .stage-d{background:linear-gradient(135deg,#2A2A5E 0%,#1C4E66 48%,#5A2A55 100%);}
  .stage-d::before{content:"";position:absolute;width:320px;height:320px;left:-60px;top:-110px;background:radial-gradient(circle,rgba(120,180,255,.5),transparent 62%);filter:blur(42px);}
  .stage-d::after{content:"";position:absolute;width:300px;height:300px;right:-80px;bottom:-120px;background:radial-gradient(circle,rgba(255,120,200,.4),transparent 62%);filter:blur(48px);}
  .stage-l{background:linear-gradient(135deg,#D7E2F5 0%,#ECD9EC 50%,#F4E7D5 100%);}
  .stage-l::before{content:"";position:absolute;width:320px;height:320px;left:-60px;top:-110px;background:radial-gradient(circle,rgba(110,165,255,.42),transparent 62%);filter:blur(44px);}
  .stage-l::after{content:"";position:absolute;width:300px;height:300px;right:-80px;bottom:-120px;background:radial-gradient(circle,rgba(255,170,120,.38),transparent 62%);filter:blur(48px);}

  .win{position:relative;z-index:1;width:100%;max-width:540px;border-radius:14px;overflow:hidden;}
  .mbar{padding:11px 15px;font-weight:600;font-size:13px;}
  .sgrid{display:grid;grid-template-columns:132px 1fr;height:264px;min-height:264px;}
  .snav{display:block;width:100%;text-align:left;padding:6px 13px;font:400 11.5px/1.5 var(--ui);border:none;border-left:2px solid transparent;background:transparent;cursor:pointer;}
  .spanel{padding:13px 16px;font-size:12px;overflow:auto;scroll-behavior:smooth;}
  .panel{padding:0 0 18px;scroll-margin-top:8px;}
  .panel::before{content:attr(data-title);display:block;margin:0 0 7px;color:inherit;font:600 12.5px/1.25 var(--ui);}
  .srow{display:flex;justify-content:space-between;align-items:center;padding:7px 0;gap:14px;}
  .seclabel{font:500 10.5px/1 var(--ui);letter-spacing:.4px;margin:2px 0 2px;}
  .sel,.num{padding:3px 8px;border-radius:6px;font:11.5px/1 var(--ui);display:inline-flex;align-items:center;gap:6px;border:1px solid;white-space:nowrap;}
  .num{font-family:var(--mono);min-width:58px;justify-content:flex-end;}
  .cbx{width:16px;height:16px;border-radius:5px;border:1px solid;display:inline-flex;align-items:center;justify-content:center;flex:none;}
  .cbx svg{width:11px;height:11px;stroke-width:2;}
  .kchip{padding:3px 9px;border-radius:6px;font:11px/1 var(--mono);border:1px solid;}
  .kc{display:inline-flex;gap:4px;align-items:center;flex-wrap:wrap;justify-content:flex-end;}
  .kbd{font:10px/1.3 var(--mono);padding:2px 6px;border-radius:4px;border:1px solid;}
  .krow{display:flex;justify-content:space-between;align-items:center;gap:14px;min-height:27px;}
  .kdiv{height:1px;margin:7px 0;}
  .hint{font:10.5px/1.55 var(--ui);margin-top:11px;}
  .inp{display:block;padding:6px 10px;border-radius:7px;border:1px solid;font:11px/1.3 var(--mono);margin-bottom:8px;}
  .aibtns{display:flex;gap:6px;align-items:center;}
  .okpill{padding:2px 8px;border-radius:5px;font:500 10px/1.6 var(--ui);}
  .muted-line{font-size:10.5px;margin-top:9px;}
  .btn{padding:4px 11px;border-radius:6px;font:500 11.5px/1.4 var(--ui);cursor:pointer;border:1px solid;background:transparent;}
  .btn-primary{border:none;}
  .sfoot{padding:8px 14px;display:flex;justify-content:flex-end;gap:6px;}
  .ab-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding-bottom:12px;}
  .ab-title{font-size:15px;font-weight:600;line-height:1.15;}
  .ab-sub{margin-top:4px;font-size:11.5px;}
  .ab-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:13px;}
  .ab-l{font-size:10px;}.ab-v{font-weight:500;font-size:12px;margin-top:3px;}
  .ab-gh{font-family:var(--mono);font-size:10.5px;padding:3px 9px;}
  .ab-paths{margin-top:14px;display:flex;flex-direction:column;gap:5px;}
  .ab-path{padding:5px 8px;border-radius:5px;font:10.5px/1.3 var(--mono);}

  /* ===== DARK GLASS ===== */
  .win-d{background:rgba(26,28,36,.55);-webkit-backdrop-filter:blur(42px) saturate(175%);backdrop-filter:blur(42px) saturate(175%);border:1px solid rgba(255,255,255,.16);box-shadow:0 26px 60px -20px rgba(0,0,0,.62),inset 0 1px 0 rgba(255,255,255,.22);color:#EEF0F4;}
  .win-d .mbar{border-bottom:1px solid rgba(255,255,255,.1);}
  .win-d .snav{color:rgba(255,255,255,.6);}
  .win-d .snav.active{background:rgba(10,132,255,.18);color:#7FB3FF;border-left-color:#0A84FF;font-weight:500;}
  .win-d .sgrid{border:0;}
  .win-d .set-nav-wrap,.win-d nav.snav-wrap{}
  .win-d .snav-wrap{background:rgba(255,255,255,.04);border-right:1px solid rgba(255,255,255,.1);padding:9px 0;}
  .win-d .srow{border-bottom:1px solid rgba(255,255,255,.08);}
  .win-d .srow.last{border-bottom:none;}
  .win-d .seclabel{color:rgba(255,255,255,.5);}
  .win-d .sel,.win-d .num{border-color:rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#EEF0F4;}
  .win-d .cbx.off{border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.05);}
  .win-d .cbx.on{background:#0A84FF;border-color:#0A84FF;color:#fff;}
  .win-d .kchip{background:rgba(10,132,255,.16);border-color:rgba(10,132,255,.32);color:#7FB3FF;}
  .win-d .kbd{border-color:rgba(255,255,255,.2);background:rgba(255,255,255,.1);color:#EEF0F4;}
  .win-d .kdiv{background:rgba(255,255,255,.1);}
  .win-d .hint,.win-d .muted-line,.win-d .ab-sub,.win-d .ab-l{color:rgba(255,255,255,.5);}
  .win-d .inp{border-color:rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:rgba(255,255,255,.55);}
  .win-d .okpill{background:rgba(91,227,160,.18);color:#5BE3A0;}
  .win-d .btn{border-color:rgba(255,255,255,.2);color:#EEF0F4;}
  .win-d .btn-primary{background:#0A84FF;color:#fff;}
  .win-d .sfoot{border-top:1px solid rgba(255,255,255,.1);}
  .win-d .ab-head{border-bottom:1px solid rgba(255,255,255,.1);}
  .win-d .ab-gh{border-color:rgba(255,255,255,.2);color:#EEF0F4;}
  .win-d .ab-path{background:rgba(255,255,255,.05);color:rgba(255,255,255,.55);}

  /* ===== LIGHT GLASS ===== */
  .win-l{background:rgba(255,255,255,.62);-webkit-backdrop-filter:blur(42px) saturate(180%);backdrop-filter:blur(42px) saturate(180%);border:1px solid rgba(0,0,0,.07);box-shadow:0 26px 60px -20px rgba(40,40,90,.28),inset 0 1px 0 rgba(255,255,255,.85);color:#1D1F26;}
  .win-l .mbar{border-bottom:1px solid rgba(0,0,0,.07);}
  .win-l .snav{color:rgba(20,22,30,.6);}
  .win-l .snav.active{background:rgba(10,122,255,.12);color:#0A6CE0;border-left-color:#0A6CE0;font-weight:500;}
  .win-l .snav-wrap{background:rgba(255,255,255,.4);border-right:1px solid rgba(0,0,0,.07);padding:9px 0;}
  .win-l .srow{border-bottom:1px solid rgba(0,0,0,.07);}
  .win-l .srow.last{border-bottom:none;}
  .win-l .seclabel{color:rgba(20,22,30,.45);}
  .win-l .sel,.win-l .num{border-color:rgba(0,0,0,.16);background:rgba(255,255,255,.6);color:#1D1F26;}
  .win-l .cbx.off{border-color:rgba(0,0,0,.28);background:rgba(0,0,0,.02);}
  .win-l .cbx.on{background:#0A6CE0;border-color:#0A6CE0;color:#fff;}
  .win-l .kchip{background:rgba(10,108,224,.1);border-color:rgba(10,108,224,.3);color:#0A6CE0;}
  .win-l .kbd{border-color:rgba(0,0,0,.14);background:rgba(0,0,0,.05);color:rgba(20,22,30,.6);}
  .win-l .kdiv{background:rgba(0,0,0,.08);}
  .win-l .hint,.win-l .muted-line,.win-l .ab-sub,.win-l .ab-l{color:rgba(20,22,30,.5);}
  .win-l .inp{border-color:rgba(0,0,0,.1);background:rgba(0,0,0,.03);color:rgba(20,22,30,.5);}
  .win-l .okpill{background:rgba(31,158,90,.12);color:#1F8A50;}
  .win-l .btn{border-color:rgba(0,0,0,.16);color:rgba(20,22,30,.7);}
  .win-l .btn-primary{background:#0A6CE0;color:#fff;}
  .win-l .sfoot{border-top:1px solid rgba(0,0,0,.07);}
  .win-l .ab-head{border-bottom:1px solid rgba(0,0,0,.07);}
  .win-l .ab-gh{border-color:rgba(0,0,0,.16);color:rgba(20,22,30,.7);}
  .win-l .ab-path{background:rgba(0,0,0,.03);color:rgba(20,22,30,.55);}

  footer{max-width:1160px;margin:40px auto 0;color:#7A7F88;font-size:12.5px;line-height:1.7;border-top:1px solid rgba(255,255,255,.08);padding-top:20px;}
  @media (max-width:820px){.grid2{grid-template-columns:1fr;}}
```

## Preserved prototype body source

```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-check" viewBox="0 0 12 12"><path d="M3 6.1 5.1 8.2 9 3.8"/></symbol>
  <symbol id="i-chev" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></symbol>
</svg>

<header class="head">
  <h1>Jsonita · 设置详版</h1>
  <p>6 个分组按真实字段铺全(取自 <code>src/store/settings.ts</code> + <code>SettingsView.tsx</code> + zh-CN 文案)。Settings 是主 Jsonita 卡片内的整页状态,不是遮罩上的浮层 modal。右侧是从 General 到 About 的连续滚动配置页,左侧 nav 保留为目录索引;点击目录滚动到对应 section,滚动时 active 高亮跟随。控件按真实实现:开关用<b>方形勾选框</b>、语言/主题/历史上限用下拉、Unwrap 超时是数字输入、API Key 带 测试/保存/移除。<code>aiModelId</code> 是内部默认值,不单独暴露编辑控件。</p>
</header>

<div class="grid2">
  <div>
    <p class="cap">Light · 左侧目录滚动定位</p>
    <div class="stage stage-l"><div class="win win-l settings">
      <div class="mbar">设置</div>
      <div class="sgrid">
        <nav class="snav-wrap">
          <button class="snav active" data-g="general">通用</button>
          <button class="snav" data-g="shortcuts">快捷键</button>
          <button class="snav" data-g="ai">AI</button>
          <button class="snav" data-g="history">历史</button>
          <button class="snav" data-g="jsonTransform">JSON 变换</button>
          <button class="snav" data-g="about">关于</button>
        </nav>
        <div class="spanel">
          <div class="panel" data-g="general" data-title="通用">
            <div class="srow"><span>语言</span><span class="sel">简体中文 <svg class="ico" width="10" height="10"><use href="#i-chev"/></svg></span></div>
            <div class="srow"><span>主题</span><span class="sel">System <svg class="ico" width="10" height="10"><use href="#i-chev"/></svg></span></div>
            <div class="srow"><span>开机自启动</span><span class="cbx on"><svg class="ico"><use href="#i-check"/></svg></span></div>
            <div class="srow"><span>失焦自动隐藏</span><span class="cbx on"><svg class="ico"><use href="#i-check"/></svg></span></div>
            <div class="srow"><span>智能扩宽</span><span class="cbx on"><svg class="ico"><use href="#i-check"/></svg></span></div>
            <div class="srow"><span>单窗模式</span><span class="cbx off"></span></div>
            <div class="srow last"><span>自动粘贴剪贴板</span><span class="cbx on"><svg class="ico"><use href="#i-check"/></svg></span></div>
          </div>
          <div class="panel" data-g="shortcuts" data-title="快捷键">
            <div class="seclabel">可自定义</div>
            <div class="krow"><span>呼出浮窗</span><span class="kchip">⌘⇧J</span></div>
            <div class="krow"><span>恢复上次会话</span><span class="kchip">⌘⇧L</span></div>
            <div class="kdiv"></div>
            <div class="seclabel">内置快捷键</div>
            <div class="krow"><span>切换功能 Tab</span><span class="kc"><span class="kbd">Tab</span><span class="kbd">⇧Tab</span></span></div>
            <div class="krow"><span>退出编辑态</span><span class="kc"><span class="kbd">Esc</span></span></div>
            <div class="krow"><span>隐藏浮窗</span><span class="kc"><span class="kbd">Esc</span><span class="kbd">Esc</span></span></div>
            <div class="krow"><span>执行当前 / 接受 AI Fix</span><span class="kc"><span class="kbd">⌘↵</span></span></div>
            <div class="krow"><span>取消 AI Fix</span><span class="kc"><span class="kbd">Esc</span></span></div>
            <div class="krow"><span>打开 / 关闭历史</span><span class="kc"><span class="kbd">⌘Y</span></span></div>
            <div class="krow"><span>打开设置</span><span class="kc"><span class="kbd">⌘,</span></span></div>
            <div class="krow"><span>清空输入</span><span class="kc"><span class="kbd">⌘K</span></span></div>
            <div class="krow"><span>调整字体大小</span><span class="kc"><span class="kbd">⌘+</span><span class="kbd">⌘-</span><span class="kbd">⌘0</span></span></div>
            <div class="hint">点「可自定义」快捷键后按目标组合键。系统保留组合(⌘Q / ⌘W / ⌘⇥ 等)默认阻塞;如需强制绑定走 Override。</div>
          </div>
          <div class="panel" data-g="ai" data-title="AI">
            <div class="srow last"><span>启用 AI Fix</span><span class="cbx off"></span></div>
            <div style="margin-top:10px"><div class="seclabel" style="margin-bottom:6px">DeepSeek API Key</div>
              <span class="inp">••••••••（已保存，可输入新 key 覆盖）</span>
              <div class="aibtns"><button class="btn">测试</button><button class="btn">保存</button><button class="btn">移除</button><span class="okpill">已保存</span></div>
            </div>
          </div>
          <div class="panel" data-g="history" data-title="历史">
            <div class="srow last"><span>历史上限</span><span class="sel">100 <svg class="ico" width="10" height="10"><use href="#i-chev"/></svg></span></div>
            <div class="muted-line">可选 10 / 50 / 100 / 200;超出按 pinned → starred → 时间排序淘汰。</div>
          </div>
          <div class="panel" data-g="jsonTransform" data-title="JSON 变换">
            <div class="srow"><span>自动解嵌套</span><span class="cbx on"><svg class="ico"><use href="#i-check"/></svg></span></div>
            <div class="srow"><span>Unwrap 超时 (ms)</span><span class="num">200</span></div>
            <div class="srow last"><span>编辑器软换行</span><span class="cbx on"><svg class="ico"><use href="#i-check"/></svg></span></div>
          </div>
          <div class="panel" data-g="about" data-title="关于">
            <div class="ab-head"><div><div class="ab-title">Jsonita</div><div class="ab-sub">Tiny menu-bar JSON toolkit</div></div><button class="btn ab-gh">GitHub</button></div>
            <div class="ab-meta"><div><div class="ab-l">Version</div><div class="ab-v">1.0.0-beta.1</div></div><div><div class="ab-l">License</div><div class="ab-v">MIT</div></div><div><div class="ab-l">Author</div><div class="ab-v">Jin Huang</div></div></div>
            <div class="ab-paths"><div class="seclabel">Data &amp; logs</div><div class="ab-path">~/Library/Application Support/Jsonita/</div><div class="ab-path">~/Library/Logs/Jsonita/</div></div>
          </div>
        </div>
      </div>
      <div class="sfoot"><button class="btn">全部重置</button><button class="btn btn-primary">完成</button></div>
    </div></div>
  </div>

  <div>
    <p class="cap">Dark · 左侧目录滚动定位</p>
    <div class="stage stage-d"><div class="win win-d settings">
      <div class="mbar">设置</div>
      <div class="sgrid">
        <nav class="snav-wrap">
          <button class="snav" data-g="general">通用</button>
          <button class="snav active" data-g="shortcuts">快捷键</button>
          <button class="snav" data-g="ai">AI</button>
          <button class="snav" data-g="history">历史</button>
          <button class="snav" data-g="jsonTransform">JSON 变换</button>
          <button class="snav" data-g="about">关于</button>
        </nav>
        <div class="spanel">
          <div class="panel" data-g="general" data-title="通用">
            <div class="srow"><span>语言</span><span class="sel">简体中文 <svg class="ico" width="10" height="10"><use href="#i-chev"/></svg></span></div>
            <div class="srow"><span>主题</span><span class="sel">System <svg class="ico" width="10" height="10"><use href="#i-chev"/></svg></span></div>
            <div class="srow"><span>开机自启动</span><span class="cbx on"><svg class="ico"><use href="#i-check"/></svg></span></div>
            <div class="srow"><span>失焦自动隐藏</span><span class="cbx on"><svg class="ico"><use href="#i-check"/></svg></span></div>
            <div class="srow"><span>智能扩宽</span><span class="cbx on"><svg class="ico"><use href="#i-check"/></svg></span></div>
            <div class="srow"><span>单窗模式</span><span class="cbx off"></span></div>
            <div class="srow last"><span>自动粘贴剪贴板</span><span class="cbx on"><svg class="ico"><use href="#i-check"/></svg></span></div>
          </div>
          <div class="panel" data-g="shortcuts" data-title="快捷键">
            <div class="seclabel">可自定义</div>
            <div class="krow"><span>呼出浮窗</span><span class="kchip">⌘⇧J</span></div>
            <div class="krow"><span>恢复上次会话</span><span class="kchip">⌘⇧L</span></div>
            <div class="kdiv"></div>
            <div class="seclabel">内置快捷键</div>
            <div class="krow"><span>切换功能 Tab</span><span class="kc"><span class="kbd">Tab</span><span class="kbd">⇧Tab</span></span></div>
            <div class="krow"><span>退出编辑态</span><span class="kc"><span class="kbd">Esc</span></span></div>
            <div class="krow"><span>隐藏浮窗</span><span class="kc"><span class="kbd">Esc</span><span class="kbd">Esc</span></span></div>
            <div class="krow"><span>执行当前 / 接受 AI Fix</span><span class="kc"><span class="kbd">⌘↵</span></span></div>
            <div class="krow"><span>取消 AI Fix</span><span class="kc"><span class="kbd">Esc</span></span></div>
            <div class="krow"><span>打开 / 关闭历史</span><span class="kc"><span class="kbd">⌘Y</span></span></div>
            <div class="krow"><span>打开设置</span><span class="kc"><span class="kbd">⌘,</span></span></div>
            <div class="krow"><span>清空输入</span><span class="kc"><span class="kbd">⌘K</span></span></div>
            <div class="krow"><span>调整字体大小</span><span class="kc"><span class="kbd">⌘+</span><span class="kbd">⌘-</span><span class="kbd">⌘0</span></span></div>
            <div class="hint">点「可自定义」快捷键后按目标组合键。系统保留组合(⌘Q / ⌘W / ⌘⇥ 等)默认阻塞;如需强制绑定走 Override。</div>
          </div>
          <div class="panel" data-g="ai" data-title="AI">
            <div class="srow last"><span>启用 AI Fix</span><span class="cbx off"></span></div>
            <div style="margin-top:10px"><div class="seclabel" style="margin-bottom:6px">DeepSeek API Key</div>
              <span class="inp">••••••••（已保存，可输入新 key 覆盖）</span>
              <div class="aibtns"><button class="btn">测试</button><button class="btn">保存</button><button class="btn">移除</button><span class="okpill">已保存</span></div>
            </div>
          </div>
          <div class="panel" data-g="history" data-title="历史">
            <div class="srow last"><span>历史上限</span><span class="sel">100 <svg class="ico" width="10" height="10"><use href="#i-chev"/></svg></span></div>
            <div class="muted-line">可选 10 / 50 / 100 / 200;超出按 pinned → starred → 时间排序淘汰。</div>
          </div>
          <div class="panel" data-g="jsonTransform" data-title="JSON 变换">
            <div class="srow"><span>自动解嵌套</span><span class="cbx on"><svg class="ico"><use href="#i-check"/></svg></span></div>
            <div class="srow"><span>Unwrap 超时 (ms)</span><span class="num">200</span></div>
            <div class="srow last"><span>编辑器软换行</span><span class="cbx on"><svg class="ico"><use href="#i-check"/></svg></span></div>
          </div>
          <div class="panel" data-g="about" data-title="关于">
            <div class="ab-head"><div><div class="ab-title">Jsonita</div><div class="ab-sub">Tiny menu-bar JSON toolkit</div></div><button class="btn ab-gh">GitHub</button></div>
            <div class="ab-meta"><div><div class="ab-l">Version</div><div class="ab-v">1.0.0-beta.1</div></div><div><div class="ab-l">License</div><div class="ab-v">MIT</div></div><div><div class="ab-l">Author</div><div class="ab-v">Jin Huang</div></div></div>
            <div class="ab-paths"><div class="seclabel">Data &amp; logs</div><div class="ab-path">~/Library/Application Support/Jsonita/</div><div class="ab-path">~/Library/Logs/Jsonita/</div></div>
          </div>
        </div>
      </div>
      <div class="sfoot"><button class="btn">全部重置</button><button class="btn btn-primary">完成</button></div>
    </div></div>
  </div>
</div>

<footer>
  字段全部来自真实实现,未加未实现项:通用 7 项(语言/主题 + 5 个勾选)、快捷键 2 可自定义 + 9 内置、AI(开关 + DeepSeek key + 测试/保存/移除;模型为内部默认值不单独暴露)、历史上限、JSON 变换 3 项、关于(版本 1.0.0-beta.1 / MIT / 作者 + 数据与日志路径)。强调色仍是系统蓝,勾选框选中 = 蓝填充白勾,与全局玻璃方向一致。
</footer>

<script>
  document.querySelectorAll('.settings').forEach(function(m){
    var navs=m.querySelectorAll('.snav'), panels=m.querySelectorAll('.panel'), scroller=m.querySelector('.spanel');
    function setActive(g){ navs.forEach(function(n){ n.classList.toggle('active', n.dataset.g===g); }); }
    navs.forEach(function(b){ b.addEventListener('click',function(){
      var panel=m.querySelector('.panel[data-g="'+b.dataset.g+'"]');
      if(panel){ scroller.scrollTo({top:panel.offsetTop-8,behavior:'smooth'}); setActive(b.dataset.g); }
    });});
    scroller.addEventListener('scroll',function(){
      var next=panels[0].dataset.g;
      if(scroller.scrollTop+scroller.clientHeight>=scroller.scrollHeight-8){ next=panels[panels.length-1].dataset.g; }
      else{ panels.forEach(function(p){ if(p.offsetTop<=scroller.scrollTop+22){ next=p.dataset.g; } }); }
      setActive(next);
    },{passive:true});
  });
</script>
```
