# Jsonita · 原生玻璃 — 全屏 mockups

锁定的玻璃方向铺到全部屏,每屏 light + dark 双版(叠在桌面壁纸上看 vibrancy)。系统蓝为唯一交互强调色;valid 走绿。顺手修了上轮评审的两个问题:AI Fix 标签 = 琥珀强调(出错→修复的视觉警示)、History op-type chip = 蓝/青/绿/琥珀四色区分。

## 1 · 主浮窗 6 态

5 个基础 Tab + 设置齿轮;AI Fix 仅在 parse error 时出现(琥珀色)。下面每行 left = light,right = dark。

1.1 Format · valid(默认呼出 = hero)

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

1.2 Minify

Format Minify Tree →Str →JSON Settings

Input

```
{
  "name": "alice",
  "age": 30
}
```

Output · single line Copy

```
{"name":"alice","age":30}
```

Valid JSON ·1 line ·26 bytes ⌘Y History

Format Minify Tree →Str →JSON Settings

Input

```
{
  "name": "alice",
  "age": 30
}
```

Output · single line Copy

```
{"name":"alice","age":30}
```

Valid JSON ·1 line ·26 bytes ⌘Y History

1.3 Tree(含 hover 行尾复制)

Format Minify Tree →Str →JSON Settings

Input

```
{
  "user": {
    "name": "alice",
    "active": true
  }
}
```

Tree · hover 行尾复制

▾ root {1}

▾ user {2}

name: "alice" copy

active: true

Valid JSON ·4 nodes ⌘Y History

Format Minify Tree →Str →JSON Settings

Input

```
{
  "user": {
    "name": "alice",
    "active": true
  }
}
```

Tree · hover 行尾复制

▾ root {1}

▾ user {2}

name: "alice" copy

active: true

Valid JSON ·4 nodes ⌘Y History

1.4 →Str(JSON 转转义字符串)

Format Minify Tree →Str →JSON Settings

Input

```
{
  "name": "alice",
  "age": 30
}
```

Output · escaped string Copy

```
"{\"name\":\"alice\",\"age\":30}"
```

Valid JSON ·1 line ⌘Y History

Format Minify Tree →Str →JSON Settings

Input

```
{
  "name": "alice",
  "age": 30
}
```

Output · escaped string Copy

```
"{\"name\":\"alice\",\"age\":30}"
```

Valid JSON ·1 line ⌘Y History

1.5 Error + AI Fix(琥珀强调 = 出错→修复入口)

Format Minify Tree →Str →JSON AI Fix Settings

Input · 非法

```
{
  name: 'alice',
  age: 30,
}
```

Output · 错误

```
// 等待修复后输出
```

Line 2, Col 3: key must be a string ⌘Y History

Format Minify Tree →Str →JSON AI Fix Settings

Input · 非法

```
{
  name: 'alice',
  age: 30,
}
```

Output · 错误

```
// 等待修复后输出
```

Line 2, Col 3: key must be a string ⌘Y History

1.6 单窗模式(In-place · ⌘↵ 执行当前 Tab)

Format Minify Tree →Str →JSON Settings

In-place editor

```
{
  "name": "alice",
  "age": 30
}
```

⌘↵ Run Format

Valid JSON ·single-pane ⌘Y History

Format Minify Tree →Str →JSON Settings

In-place editor

```
{
  "name": "alice",
  "age": 30
}
```

⌘↵ Run Format

Valid JSON ·single-pane ⌘Y History

## 2 · 模态

AI Fix Diff / 设置 / 历史 / 权限引导。设置已去掉 reserved 行(上轮反馈);历史 op-chip 四色区分操作类型。

2.1 AI Fix · DiffView

AI Fix

- { name: 'alice',

+ { "name": "alice",

"age": 30,

- items: ["a",]

+ "items": ["a"]

Cancel ⌘↵ Accept

AI Fix

- { name: 'alice',

+ { "name": "alice",

"age": 30,

- items: ["a",]

+ "items": ["a"]

Cancel ⌘↵ Accept

2.2 SettingsView

Settings

General

Shortcuts

AI

History

JSON Transform

About

General

开机自启动

智能缩放

主题 System

Reset all Done

Settings

General

Shortcuts

AI

History

JSON Transform

About

General

开机自启动

智能缩放

主题 System

Reset all Done

2.3 历史 Modal(op-chip 四色区分)

History

Search… All Pin Star

AI-FIX Pinned · 2m

{"name":"alice","age":30}

FORMAT 12m

{"code":200,"data":{"name":"alice"}}

TREE 38m

[{"x":1,"y":2},{"x":3,"y":4}]

History

Search… All Pin Star

AI-FIX Pinned · 2m

{"name":"alice","age":30}

FORMAT 12m

{"code":200,"data":{"name":"alice"}}

TREE 38m

[{"x":1,"y":2},{"x":3,"y":4}]

2.4 macOS 权限引导

SHORTCUT PERMISSION

需要处理系统隐私权限

如果 ⌘⇧J 无法在其他 App 前台唤起 Jsonita，请在 macOS 隐私设置中允许 Jsonita。

稍后 打开系统设置

SHORTCUT PERMISSION

需要处理系统隐私权限

如果 ⌘⇧J 无法在其他 App 前台唤起 Jsonita，请在 macOS 隐私设置中允许 Jsonita。

稍后 打开系统设置

## 3 · 状态栏 · 菜单栏 · 空状态 · Toast

left = light,right = dark。Toast 为 reserved(当前实现未接入,仅留视觉)。

3.1 状态栏 4 态

Valid JSON ·5 lines ·76 bytes ⌘Y History

Valid JSON ·5 lines ·76 bytes ⌘Y History

Invalid JSON ·Line 3, Col 12 ⌘Y History

Invalid JSON ·Line 3, Col 12 ⌘Y History

— Paste JSON to start ⌘Y History

— Paste JSON to start ⌘Y History

Large file ·5.4 MB ⌘Y History

Large file ·5.4 MB ⌘Y History

3.2 菜单栏 tray 下拉

{ } Jsonita 10:42

Toggle Jsonita

Settings… ⌘,

Quit Jsonita ⌘Q

{ } Jsonita 10:42

Toggle Jsonita

Settings… ⌘,

Quit Jsonita ⌘Q

3.3 空状态(浮窗无内容)

Format Minify Tree →Str →JSON Settings

{ }

Paste JSON to start

⌘V

→ output

Format Minify Tree →Str →JSON Settings

{ }

Paste JSON to start

⌘V

→ output

3.4 Toast · 4 variant(reserved)

Restored from 3 min ago
Cmd+Z to revert

Copied: user.name
Path 已复制

Rate limited
请 42s 后重试

API key invalid
Open Settings

Restored from 3 min ago
Cmd+Z to revert

Copied: user.name
Path 已复制

Rate limited
请 42s 后重试

API key invalid
Open Settings

全部屏均用同一套玻璃 token(系统蓝强调 + 绿 valid + 四色 op-chip),light/dark 自洽。这一版同时修掉了上轮评审:① AI Fix 标签 / DiffView Accept 走琥珀+蓝强调,出错→修复路径有视觉重量;② History op-chip 蓝/青/绿/琥珀四色,扫一眼识别操作;③ 设置去掉 reserved 行;④ 图标全部 SVG 描边,无 emoji。

下一步若选「落 tokens」:我会把这套色板 / 圆角 / 阴影 / 字阶整理进 `src/styles/tokens.css` 的 `:root` + `[data-theme="dark"]`,统一 `assets/style.css`,并按 WORKFLOW.md 同步 design/01 mockups + CHANGELIST,再 commit(不 push)。

## Preserved prototype CSS

### CSS block 1

```css
:root{
    --ui:-apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang SC","Helvetica Neue",Arial,sans-serif;
    --mono:"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;
  }
  *{box-sizing:border-box;}
  body{margin:0;background:#0E0E10;color:#E7E8EA;font-family:var(--ui);padding:46px 24px 80px;-webkit-font-smoothing:antialiased;}
  .ico{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;display:block;}

  .head{max-width:1000px;margin:0 auto 18px;}
  .head h1{font-weight:600;font-size:22px;margin:0 0 9px;letter-spacing:.2px;}
  .head p{color:#9498A0;font-size:14px;line-height:1.65;margin:0;max-width:760px;}

  .sec{max-width:1000px;margin:38px auto 0;}
  .sec-h{font-size:15px;font-weight:600;margin:0 0 4px;}
  .sec-d{font-size:12.5px;color:#868B93;margin:0 0 16px;line-height:1.55;}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .col{display:flex;flex-direction:column;gap:16px;}
  .cap{font-size:10.5px;letter-spacing:1.3px;text-transform:uppercase;color:#6E727B;margin:0 0 9px;}

  .stage{display:flex;align-items:center;justify-content:center;padding:30px 26px;border-radius:14px;position:relative;overflow:hidden;}
  .stage-d{background:linear-gradient(135deg,#2A2A5E 0%,#1C4E66 48%,#5A2A55 100%);}
  .stage-d::before{content:"";position:absolute;width:300px;height:300px;left:-60px;top:-100px;background:radial-gradient(circle,rgba(120,180,255,.5),transparent 62%);filter:blur(40px);}
  .stage-d::after{content:"";position:absolute;width:280px;height:280px;right:-70px;bottom:-110px;background:radial-gradient(circle,rgba(255,120,200,.4),transparent 62%);filter:blur(46px);}
  .stage-l{background:linear-gradient(135deg,#D7E2F5 0%,#ECD9EC 50%,#F4E7D5 100%);}
  .stage-l::before{content:"";position:absolute;width:300px;height:300px;left:-60px;top:-100px;background:radial-gradient(circle,rgba(110,165,255,.42),transparent 62%);filter:blur(42px);}
  .stage-l::after{content:"";position:absolute;width:280px;height:280px;right:-70px;bottom:-110px;background:radial-gradient(circle,rgba(255,170,120,.38),transparent 62%);filter:blur(46px);}

  .win{position:relative;z-index:1;width:100%;border-radius:14px;overflow:hidden;}
  .tabs{display:flex;align-items:center;gap:4px;padding:9px 10px;}
  .tab{font:500 12px/1 var(--ui);border:1px solid transparent;background:transparent;padding:5px 9px;border-radius:7px;cursor:default;white-space:nowrap;}
  .tab-spacer{flex:1;}
  .gear{background:transparent;border:none;cursor:default;padding:4px;display:flex;border-radius:6px;}
  .body{display:grid;grid-template-columns:1fr 1fr;}
  .pane{padding:12px 14px 15px;min-height:140px;position:relative;}
  .pane-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;min-height:14px;}
  .pane-label{font:500 10px/1 var(--ui);letter-spacing:1px;text-transform:uppercase;margin:0;}
  .copy-btn{background:transparent;border:none;cursor:default;padding:0;display:flex;}
  .code{font:11.5px/1.7 var(--mono);margin:0;white-space:pre;overflow:hidden;}
  .status{display:flex;justify-content:space-between;align-items:center;padding:8px 13px;font:10.5px/1 var(--mono);font-variant-numeric:tabular-nums;gap:8px;}
  .dot{display:inline-block;width:6px;height:6px;border-radius:50%;vertical-align:middle;margin-right:7px;}
  .st-sep{opacity:.45;margin:0 5px;}
  .kbd{font:10px/1 var(--mono);padding:2px 5px;border-radius:4px;border:1px solid;margin-right:5px;}
  .run-hint{position:absolute;right:12px;bottom:14px;padding:5px 9px;border-radius:7px;font:10.5px/1 var(--ui);display:flex;align-items:center;}

  .mtitle{display:flex;align-items:center;padding:8px 12px;position:relative;}
  .traffic{display:flex;gap:6px;}
  .traffic span{width:11px;height:11px;border-radius:50%;display:block;}
  .tl-r{background:#FF5F57;}.tl-y{background:#FEBC2E;}.tl-g{background:#28C840;}
  .mtitle-name{position:absolute;left:0;right:0;text-align:center;font:500 12px/1 var(--ui);pointer-events:none;}

  .set-grid{display:grid;grid-template-columns:128px 1fr;}
  .set-nav{padding:10px 0;font-size:11.5px;}
  .set-nav-item{padding:6px 13px;cursor:default;}
  .set-panel{padding:13px 16px;font-size:12px;}
  .set-title{font-size:14px;font-weight:600;margin:0 0 10px;}
  .set-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;}
  .toggle{width:30px;height:17px;border-radius:9px;position:relative;flex:none;}
  .toggle i{position:absolute;top:2px;width:13px;height:13px;background:#fff;border-radius:50%;}
  .toggle.on i{right:2px;}.toggle.off i{left:2px;}
  .pill{padding:2px 9px;border-radius:5px;font-size:11px;display:inline-flex;align-items:center;gap:5px;}
  .set-foot{padding:8px 14px;text-align:right;display:flex;gap:6px;justify-content:flex-end;}
  .btn{padding:4px 12px;border-radius:6px;font:500 11.5px/1.4 var(--ui);cursor:default;border:1px solid;background:transparent;}
  .btn-primary{border:none;}

  .srch{flex:1;padding:5px 10px;border-radius:7px;font:11px/1.3 var(--mono);display:flex;align-items:center;gap:7px;}
  .fchip{padding:3px 9px;border-radius:11px;font:500 10px/1 var(--ui);}
  .hist-item{padding:9px 14px;}
  .op-chip{padding:2px 7px;border-radius:4px;font:500 9px/1 var(--ui);letter-spacing:.4px;}
  .hist-json{font:11px/1 var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .hist-meta{font-size:9.5px;display:flex;align-items:center;gap:5px;}

  .diff{padding:11px 14px;font:11.5px/1.85 var(--mono);}
  .drow{display:flex;gap:9px;padding:0 5px;border-radius:3px;}
  .dg{width:9px;text-align:center;flex:none;}

  .toast{padding:8px 11px;border-radius:9px;font:12px/1.4 var(--ui);display:flex;gap:9px;align-items:flex-start;}
  .toast .ti2{font-size:11px;opacity:.85;margin-top:1px;}

  .perm{padding:20px 22px;text-align:center;}
  .perm-k{font:10px/1 var(--mono);letter-spacing:1.4px;margin-bottom:9px;}
  .perm-t{font-size:14px;font-weight:600;margin-bottom:6px;}
  .perm-d{font-size:11.5px;line-height:1.55;margin-bottom:15px;}

  .tree{font:11.5px/1.95 var(--mono);padding:4px 2px;}
  .tnode{padding:0 6px;border-radius:4px;display:flex;align-items:center;}
  .tw{opacity:.5;margin-right:5px;}
  .tcopy{margin-left:auto;font:9.5px/1 var(--ui);padding:2px 6px;border-radius:5px;display:inline-flex;align-items:center;gap:4px;}

  .menu{padding:5px 0;}
  .menu-item{display:flex;justify-content:space-between;align-items:center;padding:6px 13px;font-size:12px;}
  .menu-sep{height:1px;margin:4px 0;}
  .empty{display:flex;align-items:center;justify-content:center;text-align:center;}
  .empty-g{font:300 24px/1 var(--mono);margin-bottom:7px;}
  .empty-t{font-size:11.5px;}

  /* ===== DARK GLASS ===== */
  .win-d{background:rgba(26,28,36,.52);-webkit-backdrop-filter:blur(42px) saturate(175%);backdrop-filter:blur(42px) saturate(175%);border:1px solid rgba(255,255,255,.16);box-shadow:0 26px 60px -20px rgba(0,0,0,.62),inset 0 1px 0 rgba(255,255,255,.22);color:#EEF0F4;}
  .win-d .tabs,.win-d .mtitle,.win-d .set-foot{border-bottom:1px solid rgba(255,255,255,.1);}
  .win-d .set-foot{border-bottom:none;border-top:1px solid rgba(255,255,255,.1);}
  .win-d .tab{color:rgba(255,255,255,.62);}
  .win-d .tab.active{background:rgba(255,255,255,.14);color:#7FB3FF;border-color:rgba(255,255,255,.2);}
  .win-d .tab.ai{background:rgba(255,182,107,.16);color:#FFC58A;border-color:rgba(255,182,107,.32);}
  .win-d .gear,.win-d .copy-btn{color:rgba(255,255,255,.5);}
  .win-d .pane+.pane{border-left:1px solid rgba(255,255,255,.1);}
  .win-d .pane-label{color:rgba(255,255,255,.5);}
  .win-d .code{color:#E7EAEF;}
  .win-d .k{color:#82C0FF;}.win-d .s{color:#84E08F;}.win-d .n{color:#FFB66B;}.win-d .b{color:#C9B0FF;}.win-d .nu{color:rgba(255,255,255,.4);}.win-d .p{color:rgba(255,255,255,.42);}
  .win-d .status{border-top:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.6);}
  .win-d .dot{background:#5BE3A0;box-shadow:0 0 7px rgba(91,227,160,.8);}
  .win-d .kbd{border-color:rgba(255,255,255,.2);color:#EEF0F4;background:rgba(255,255,255,.1);}
  .win-d .run-hint{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.8);}
  .win-d .mtitle-name{color:rgba(255,255,255,.7);}
  .win-d .set-grid{border-top:1px solid rgba(255,255,255,.07);}
  .win-d .set-nav{background:rgba(255,255,255,.04);border-right:1px solid rgba(255,255,255,.1);}
  .win-d .set-nav-item{color:rgba(255,255,255,.6);}
  .win-d .set-nav-item.active{background:rgba(10,132,255,.18);color:#7FB3FF;border-left:2px solid #0A84FF;font-weight:500;}
  .win-d .set-row{border-bottom:1px solid rgba(255,255,255,.08);}
  .win-d .toggle.on{background:#0A84FF;}.win-d .toggle.off{background:rgba(255,255,255,.18);}
  .win-d .pill{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);color:rgba(255,255,255,.85);}
  .win-d .btn{border-color:rgba(255,255,255,.2);color:#EEF0F4;}
  .win-d .btn-primary{background:#0A84FF;color:#fff;}
  .win-d .srch{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.5);}
  .win-d .fchip{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.6);}
  .win-d .fchip.active{background:rgba(10,132,255,.2);border-color:rgba(10,132,255,.4);color:#7FB3FF;}
  .win-d .hist-item{border-bottom:1px solid rgba(255,255,255,.08);}
  .win-d .hist-item.active{background:rgba(255,255,255,.06);border-left:2px solid #7FB3FF;}
  .win-d .hist-json{color:rgba(255,255,255,.85);}
  .win-d .hist-meta{color:rgba(255,255,255,.4);}
  .win-d .op-format,.win-d .op-minify{background:rgba(10,132,255,.2);color:#7FB3FF;}
  .win-d .op-tree{background:rgba(45,212,191,.2);color:#5FE3C8;}
  .win-d .op-str{background:rgba(91,227,160,.2);color:#5BE3A0;}
  .win-d .op-ai{background:rgba(255,182,107,.2);color:#FFC58A;}
  .win-d .ddel{background:rgba(242,122,122,.16);}.win-d .ddel .dg{color:#F2A0A0;}
  .win-d .dadd{background:rgba(91,227,160,.16);}.win-d .dadd .dg{color:#5BE3A0;}
  .win-d .dctx{color:rgba(255,255,255,.55);}
  .win-d .perm-k{color:rgba(255,255,255,.45);}.win-d .perm-d{color:rgba(255,255,255,.6);}
  .win-d .tnode.active{background:rgba(10,132,255,.16);}
  .win-d .tkey{color:#82C0FF;}.win-d .tstr{color:#84E08F;}.win-d .tnum{color:#FFB66B;}.win-d .tbool{color:#C9B0FF;}.win-d .ttype{color:rgba(255,255,255,.4);}.win-d .tidx{color:rgba(255,255,255,.55);}
  .win-d .tcopy{background:rgba(255,255,255,.12);color:rgba(255,255,255,.85);}
  .win-d .menu-item{color:rgba(255,255,255,.85);}
  .win-d .menu-sep{background:rgba(255,255,255,.1);}
  .win-d .empty{color:rgba(255,255,255,.4);}

  /* ===== LIGHT GLASS ===== */
  .win-l{background:rgba(255,255,255,.6);-webkit-backdrop-filter:blur(42px) saturate(180%);backdrop-filter:blur(42px) saturate(180%);border:1px solid rgba(0,0,0,.07);box-shadow:0 26px 60px -20px rgba(40,40,90,.28),inset 0 1px 0 rgba(255,255,255,.85);color:#1D1F26;}
  .win-l .tabs,.win-l .mtitle{border-bottom:1px solid rgba(0,0,0,.07);}
  .win-l .set-foot{border-top:1px solid rgba(0,0,0,.07);}
  .win-l .tab{color:rgba(20,22,30,.55);}
  .win-l .tab.active{background:rgba(10,122,255,.12);color:#0A6CE0;border-color:rgba(10,122,255,.22);}
  .win-l .tab.ai{background:rgba(181,101,29,.13);color:#A4621A;border-color:rgba(181,101,29,.28);}
  .win-l .gear,.win-l .copy-btn{color:rgba(20,22,30,.45);}
  .win-l .pane+.pane{border-left:1px solid rgba(0,0,0,.07);}
  .win-l .pane-label{color:rgba(20,22,30,.45);}
  .win-l .code{color:#23262E;}
  .win-l .k{color:#0B66C2;}.win-l .s{color:#2E7D4F;}.win-l .n{color:#B5651D;}.win-l .b{color:#7A4FC0;}.win-l .nu{color:rgba(20,22,30,.4);}.win-l .p{color:rgba(20,22,30,.4);}
  .win-l .status{border-top:1px solid rgba(0,0,0,.07);color:rgba(20,22,30,.55);}
  .win-l .dot{background:#1F9E5A;box-shadow:0 0 6px rgba(31,158,90,.45);}
  .win-l .kbd{border-color:rgba(0,0,0,.14);color:rgba(20,22,30,.6);background:rgba(0,0,0,.05);}
  .win-l .run-hint{background:rgba(255,255,255,.75);border:1px solid rgba(0,0,0,.1);color:rgba(20,22,30,.7);}
  .win-l .mtitle-name{color:rgba(20,22,30,.65);}
  .win-l .set-nav{background:rgba(255,255,255,.35);border-right:1px solid rgba(0,0,0,.07);}
  .win-l .set-nav-item{color:rgba(20,22,30,.6);}
  .win-l .set-nav-item.active{background:rgba(10,122,255,.12);color:#0A6CE0;border-left:2px solid #0A6CE0;font-weight:500;}
  .win-l .set-row{border-bottom:1px solid rgba(0,0,0,.07);}
  .win-l .toggle.on{background:#0A6CE0;}.win-l .toggle.off{background:rgba(0,0,0,.18);}
  .win-l .pill{background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.12);color:rgba(20,22,30,.7);}
  .win-l .btn{border-color:rgba(0,0,0,.16);color:rgba(20,22,30,.7);}
  .win-l .btn-primary{background:#0A6CE0;color:#fff;}
  .win-l .srch{background:rgba(0,0,0,.04);border:1px solid rgba(0,0,0,.1);color:rgba(20,22,30,.45);}
  .win-l .fchip{background:rgba(0,0,0,.04);border:1px solid rgba(0,0,0,.1);color:rgba(20,22,30,.55);}
  .win-l .fchip.active{background:rgba(10,122,255,.12);border-color:rgba(10,122,255,.3);color:#0A6CE0;}
  .win-l .hist-item{border-bottom:1px solid rgba(0,0,0,.07);}
  .win-l .hist-item.active{background:rgba(10,122,255,.06);border-left:2px solid #0A6CE0;}
  .win-l .hist-json{color:rgba(20,22,30,.85);}
  .win-l .hist-meta{color:rgba(20,22,30,.4);}
  .win-l .op-format,.win-l .op-minify{background:rgba(10,108,224,.12);color:#0A6CE0;}
  .win-l .op-tree{background:rgba(13,148,136,.12);color:#0D7E72;}
  .win-l .op-str{background:rgba(31,158,90,.12);color:#1F8A50;}
  .win-l .op-ai{background:rgba(181,101,29,.13);color:#A4621A;}
  .win-l .ddel{background:rgba(201,42,42,.09);}.win-l .ddel .dg{color:#C0392B;}
  .win-l .dadd{background:rgba(31,158,90,.1);}.win-l .dadd .dg{color:#1F8A50;}
  .win-l .dctx{color:rgba(20,22,30,.55);}
  .win-l .perm-k{color:rgba(20,22,30,.45);}.win-l .perm-d{color:rgba(20,22,30,.6);}
  .win-l .tnode.active{background:rgba(10,122,255,.1);}
  .win-l .tkey{color:#0B66C2;}.win-l .tstr{color:#2E7D4F;}.win-l .tnum{color:#B5651D;}.win-l .tbool{color:#7A4FC0;}.win-l .ttype{color:rgba(20,22,30,.4);}.win-l .tidx{color:rgba(20,22,30,.55);}
  .win-l .tcopy{background:rgba(0,0,0,.06);color:rgba(20,22,30,.75);}
  .win-l .menu-item{color:rgba(20,22,30,.85);}
  .win-l .menu-sep{background:rgba(0,0,0,.08);}
  .win-l .empty{color:rgba(20,22,30,.4);}

  footer{max-width:1000px;margin:42px auto 0;color:#7A7F88;font-size:12.5px;line-height:1.7;border-top:1px solid rgba(255,255,255,.08);padding-top:20px;}
  @media (max-width:760px){.grid2{grid-template-columns:1fr;}.body{grid-template-columns:1fr 1fr;}}
```

## Preserved prototype body source

```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-gear" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></symbol>
  <symbol id="i-copy" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></symbol>
  <symbol id="i-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></symbol>
  <symbol id="i-pin" viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z"/></symbol>
  <symbol id="i-star" viewBox="0 0 24 24"><polygon points="12 3 14.6 8.6 20.5 9.3 16 13.3 17.3 19.2 12 16.1 6.7 19.2 8 13.3 3.5 9.3 9.4 8.6"/></symbol>
</svg>

<header class="head">
  <h1>Jsonita · 原生玻璃 — 全屏 mockups</h1>
  <p>锁定的玻璃方向铺到全部屏,每屏 light + dark 双版(叠在桌面壁纸上看 vibrancy)。系统蓝为唯一交互强调色;valid 走绿。顺手修了上轮评审的两个问题:AI Fix 标签 = 琥珀强调(出错→修复的视觉警示)、History op-type chip = 蓝/青/绿/琥珀四色区分。</p>
</header>

<section class="sec">
  <h2 class="sec-h">1 · 主浮窗 6 态</h2>
  <p class="sec-d">5 个基础 Tab + 设置齿轮;AI Fix 仅在 parse error 时出现(琥珀色)。下面每行 left = light,right = dark。</p>

  <div class="col">

    <div>
      <p class="cap">1.1 Format · valid(默认呼出 = hero)</p>
      <div class="grid2">
        <div class="stage stage-l"><div class="win win-l">
          <div class="tabs"><button class="tab active">Format</button><button class="tab">Minify</button><button class="tab">Tree</button><button class="tab">→Str</button><button class="tab">→JSON</button><span class="tab-spacer"></span><button class="gear" aria-label="Settings"><svg class="ico" width="14" height="14"><use href="#i-gear"/></svg></button></div>
          <div class="body">
            <div class="pane"><div class="pane-head"><span class="pane-label">Input</span></div><pre class="code"><span class="p">{</span><span class="k">"name"</span><span class="p">:</span><span class="s">"alice"</span><span class="p">,</span><span class="k">"age"</span><span class="p">:</span><span class="n">30</span><span class="p">,</span><span class="k">"items"</span><span class="p">:</span><span class="p">[</span><span class="s">"a"</span><span class="p">,</span><span class="s">"b"</span><span class="p">,</span><span class="s">"c"</span><span class="p">]</span><span class="p">}</span></pre></div>
            <div class="pane"><div class="pane-head"><span class="pane-label">Output · 2 spaces</span><button class="copy-btn" aria-label="Copy"><svg class="ico" width="13" height="13"><use href="#i-copy"/></svg></button></div><pre class="code"><span class="p">{</span>
  <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span>
  <span class="k">"age"</span><span class="p">:</span> <span class="n">30</span><span class="p">,</span>
  <span class="k">"items"</span><span class="p">:</span> <span class="p">[</span><span class="s">"a"</span><span class="p">,</span> <span class="s">"b"</span><span class="p">,</span> <span class="s">"c"</span><span class="p">]</span>
<span class="p">}</span></pre></div>
          </div>
          <div class="status"><span><span class="dot"></span>Valid JSON<span class="st-sep">·</span>5 lines<span class="st-sep">·</span>76 bytes</span><span><span class="kbd">⌘Y</span>History</span></div>
        </div></div>
        <div class="stage stage-d"><div class="win win-d">
          <div class="tabs"><button class="tab active">Format</button><button class="tab">Minify</button><button class="tab">Tree</button><button class="tab">→Str</button><button class="tab">→JSON</button><span class="tab-spacer"></span><button class="gear" aria-label="Settings"><svg class="ico" width="14" height="14"><use href="#i-gear"/></svg></button></div>
          <div class="body">
            <div class="pane"><div class="pane-head"><span class="pane-label">Input</span></div><pre class="code"><span class="p">{</span><span class="k">"name"</span><span class="p">:</span><span class="s">"alice"</span><span class="p">,</span><span class="k">"age"</span><span class="p">:</span><span class="n">30</span><span class="p">,</span><span class="k">"items"</span><span class="p">:</span><span class="p">[</span><span class="s">"a"</span><span class="p">,</span><span class="s">"b"</span><span class="p">,</span><span class="s">"c"</span><span class="p">]</span><span class="p">}</span></pre></div>
            <div class="pane"><div class="pane-head"><span class="pane-label">Output · 2 spaces</span><button class="copy-btn" aria-label="Copy"><svg class="ico" width="13" height="13"><use href="#i-copy"/></svg></button></div><pre class="code"><span class="p">{</span>
  <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span>
  <span class="k">"age"</span><span class="p">:</span> <span class="n">30</span><span class="p">,</span>
  <span class="k">"items"</span><span class="p">:</span> <span class="p">[</span><span class="s">"a"</span><span class="p">,</span> <span class="s">"b"</span><span class="p">,</span> <span class="s">"c"</span><span class="p">]</span>
<span class="p">}</span></pre></div>
          </div>
          <div class="status"><span><span class="dot"></span>Valid JSON<span class="st-sep">·</span>5 lines<span class="st-sep">·</span>76 bytes</span><span><span class="kbd">⌘Y</span>History</span></div>
        </div></div>
      </div>
    </div>

  </div>
</section>

<div class="sec" style="margin-top:16px"><div class="col">

  <div>
    <p class="cap">1.2 Minify</p>
    <div class="grid2">
      <div class="stage stage-l"><div class="win win-l">
        <div class="tabs"><button class="tab">Format</button><button class="tab active">Minify</button><button class="tab">Tree</button><button class="tab">→Str</button><button class="tab">→JSON</button><span class="tab-spacer"></span><button class="gear" aria-label="Settings"><svg class="ico" width="14" height="14"><use href="#i-gear"/></svg></button></div>
        <div class="body">
          <div class="pane"><div class="pane-head"><span class="pane-label">Input</span></div><pre class="code"><span class="p">{</span>
  <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span>
  <span class="k">"age"</span><span class="p">:</span> <span class="n">30</span>
<span class="p">}</span></pre></div>
          <div class="pane"><div class="pane-head"><span class="pane-label">Output · single line</span><button class="copy-btn" aria-label="Copy"><svg class="ico" width="13" height="13"><use href="#i-copy"/></svg></button></div><pre class="code"><span class="p">{</span><span class="k">"name"</span><span class="p">:</span><span class="s">"alice"</span><span class="p">,</span><span class="k">"age"</span><span class="p">:</span><span class="n">30</span><span class="p">}</span></pre></div>
        </div>
        <div class="status"><span><span class="dot"></span>Valid JSON<span class="st-sep">·</span>1 line<span class="st-sep">·</span>26 bytes</span><span><span class="kbd">⌘Y</span>History</span></div>
      </div></div>
      <div class="stage stage-d"><div class="win win-d">
        <div class="tabs"><button class="tab">Format</button><button class="tab active">Minify</button><button class="tab">Tree</button><button class="tab">→Str</button><button class="tab">→JSON</button><span class="tab-spacer"></span><button class="gear" aria-label="Settings"><svg class="ico" width="14" height="14"><use href="#i-gear"/></svg></button></div>
        <div class="body">
          <div class="pane"><div class="pane-head"><span class="pane-label">Input</span></div><pre class="code"><span class="p">{</span>
  <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span>
  <span class="k">"age"</span><span class="p">:</span> <span class="n">30</span>
<span class="p">}</span></pre></div>
          <div class="pane"><div class="pane-head"><span class="pane-label">Output · single line</span><button class="copy-btn" aria-label="Copy"><svg class="ico" width="13" height="13"><use href="#i-copy"/></svg></button></div><pre class="code"><span class="p">{</span><span class="k">"name"</span><span class="p">:</span><span class="s">"alice"</span><span class="p">,</span><span class="k">"age"</span><span class="p">:</span><span class="n">30</span><span class="p">}</span></pre></div>
        </div>
        <div class="status"><span><span class="dot"></span>Valid JSON<span class="st-sep">·</span>1 line<span class="st-sep">·</span>26 bytes</span><span><span class="kbd">⌘Y</span>History</span></div>
      </div></div>
    </div>
  </div>

  <div>
    <p class="cap">1.3 Tree(含 hover 行尾复制)</p>
    <div class="grid2">
      <div class="stage stage-l"><div class="win win-l">
        <div class="tabs"><button class="tab">Format</button><button class="tab">Minify</button><button class="tab active">Tree</button><button class="tab">→Str</button><button class="tab">→JSON</button><span class="tab-spacer"></span><button class="gear" aria-label="Settings"><svg class="ico" width="14" height="14"><use href="#i-gear"/></svg></button></div>
        <div class="body">
          <div class="pane"><div class="pane-head"><span class="pane-label">Input</span></div><pre class="code"><span class="p">{</span>
  <span class="k">"user"</span><span class="p">:</span> <span class="p">{</span>
    <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span>
    <span class="k">"active"</span><span class="p">:</span> <span class="b">true</span>
  <span class="p">}</span>
<span class="p">}</span></pre></div>
          <div class="pane"><div class="pane-head"><span class="pane-label">Tree · hover 行尾复制</span></div>
            <div class="tree">
              <div class="tnode"><span class="tw">▾</span><span class="tkey">root</span><span class="ttype">&nbsp;{1}</span></div>
              <div style="padding-left:14px">
                <div class="tnode"><span class="tw">▾</span><span class="tkey">user</span><span class="ttype">&nbsp;{2}</span></div>
                <div style="padding-left:14px">
                  <div class="tnode active"><span class="tkey">name</span><span class="p">:&nbsp;</span><span class="tstr">"alice"</span><span class="tcopy"><svg class="ico" width="11" height="11"><use href="#i-copy"/></svg>copy</span></div>
                  <div class="tnode"><span class="tkey">active</span><span class="p">:&nbsp;</span><span class="tbool">true</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="status"><span><span class="dot"></span>Valid JSON<span class="st-sep">·</span>4 nodes</span><span><span class="kbd">⌘Y</span>History</span></div>
      </div></div>
      <div class="stage stage-d"><div class="win win-d">
        <div class="tabs"><button class="tab">Format</button><button class="tab">Minify</button><button class="tab active">Tree</button><button class="tab">→Str</button><button class="tab">→JSON</button><span class="tab-spacer"></span><button class="gear" aria-label="Settings"><svg class="ico" width="14" height="14"><use href="#i-gear"/></svg></button></div>
        <div class="body">
          <div class="pane"><div class="pane-head"><span class="pane-label">Input</span></div><pre class="code"><span class="p">{</span>
  <span class="k">"user"</span><span class="p">:</span> <span class="p">{</span>
    <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span>
    <span class="k">"active"</span><span class="p">:</span> <span class="b">true</span>
  <span class="p">}</span>
<span class="p">}</span></pre></div>
          <div class="pane"><div class="pane-head"><span class="pane-label">Tree · hover 行尾复制</span></div>
            <div class="tree">
              <div class="tnode"><span class="tw">▾</span><span class="tkey">root</span><span class="ttype">&nbsp;{1}</span></div>
              <div style="padding-left:14px">
                <div class="tnode"><span class="tw">▾</span><span class="tkey">user</span><span class="ttype">&nbsp;{2}</span></div>
                <div style="padding-left:14px">
                  <div class="tnode active"><span class="tkey">name</span><span class="p">:&nbsp;</span><span class="tstr">"alice"</span><span class="tcopy"><svg class="ico" width="11" height="11"><use href="#i-copy"/></svg>copy</span></div>
                  <div class="tnode"><span class="tkey">active</span><span class="p">:&nbsp;</span><span class="tbool">true</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="status"><span><span class="dot"></span>Valid JSON<span class="st-sep">·</span>4 nodes</span><span><span class="kbd">⌘Y</span>History</span></div>
      </div></div>
    </div>
  </div>

  <div>
    <p class="cap">1.4 →Str(JSON 转转义字符串)</p>
    <div class="grid2">
      <div class="stage stage-l"><div class="win win-l">
        <div class="tabs"><button class="tab">Format</button><button class="tab">Minify</button><button class="tab">Tree</button><button class="tab active">→Str</button><button class="tab">→JSON</button><span class="tab-spacer"></span><button class="gear" aria-label="Settings"><svg class="ico" width="14" height="14"><use href="#i-gear"/></svg></button></div>
        <div class="body">
          <div class="pane"><div class="pane-head"><span class="pane-label">Input</span></div><pre class="code"><span class="p">{</span>
  <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span>
  <span class="k">"age"</span><span class="p">:</span> <span class="n">30</span>
<span class="p">}</span></pre></div>
          <div class="pane"><div class="pane-head"><span class="pane-label">Output · escaped string</span><button class="copy-btn" aria-label="Copy"><svg class="ico" width="13" height="13"><use href="#i-copy"/></svg></button></div><pre class="code"><span class="s">"{\"name\":\"alice\",\"age\":30}"</span></pre></div>
        </div>
        <div class="status"><span><span class="dot"></span>Valid JSON<span class="st-sep">·</span>1 line</span><span><span class="kbd">⌘Y</span>History</span></div>
      </div></div>
      <div class="stage stage-d"><div class="win win-d">
        <div class="tabs"><button class="tab">Format</button><button class="tab">Minify</button><button class="tab">Tree</button><button class="tab active">→Str</button><button class="tab">→JSON</button><span class="tab-spacer"></span><button class="gear" aria-label="Settings"><svg class="ico" width="14" height="14"><use href="#i-gear"/></svg></button></div>
        <div class="body">
          <div class="pane"><div class="pane-head"><span class="pane-label">Input</span></div><pre class="code"><span class="p">{</span>
  <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span>
  <span class="k">"age"</span><span class="p">:</span> <span class="n">30</span>
<span class="p">}</span></pre></div>
          <div class="pane"><div class="pane-head"><span class="pane-label">Output · escaped string</span><button class="copy-btn" aria-label="Copy"><svg class="ico" width="13" height="13"><use href="#i-copy"/></svg></button></div><pre class="code"><span class="s">"{\"name\":\"alice\",\"age\":30}"</span></pre></div>
        </div>
        <div class="status"><span><span class="dot"></span>Valid JSON<span class="st-sep">·</span>1 line</span><span><span class="kbd">⌘Y</span>History</span></div>
      </div></div>
    </div>
  </div>

  <div>
    <p class="cap">1.5 Error + AI Fix(琥珀强调 = 出错→修复入口)</p>
    <div class="grid2">
      <div class="stage stage-l"><div class="win win-l">
        <div class="tabs"><button class="tab active">Format</button><button class="tab">Minify</button><button class="tab">Tree</button><button class="tab">→Str</button><button class="tab">→JSON</button><span class="tab-spacer"></span><button class="tab ai">AI Fix</button><button class="gear" aria-label="Settings"><svg class="ico" width="14" height="14"><use href="#i-gear"/></svg></button></div>
        <div class="body">
          <div class="pane"><div class="pane-head"><span class="pane-label">Input · 非法</span></div><pre class="code"><span class="p">{</span>
  name<span class="p">:</span> <span class="s">'alice'</span><span class="p">,</span>
  age<span class="p">:</span> <span class="n">30</span><span class="p">,</span>
<span class="p">}</span></pre></div>
          <div class="pane"><div class="pane-head"><span class="pane-label" style="color:#C0392B">Output · 错误</span></div><pre class="code" style="font-style:italic;color:rgba(20,22,30,.4)">// 等待修复后输出</pre></div>
        </div>
        <div class="status"><span style="color:#C0392B"><span class="dot" style="background:#C0392B;box-shadow:none"></span>Line 2, Col 3: key must be a string</span><span><span class="kbd">⌘Y</span>History</span></div>
      </div></div>
      <div class="stage stage-d"><div class="win win-d">
        <div class="tabs"><button class="tab active">Format</button><button class="tab">Minify</button><button class="tab">Tree</button><button class="tab">→Str</button><button class="tab">→JSON</button><span class="tab-spacer"></span><button class="tab ai">AI Fix</button><button class="gear" aria-label="Settings"><svg class="ico" width="14" height="14"><use href="#i-gear"/></svg></button></div>
        <div class="body">
          <div class="pane"><div class="pane-head"><span class="pane-label">Input · 非法</span></div><pre class="code"><span class="p">{</span>
  name<span class="p">:</span> <span class="s">'alice'</span><span class="p">,</span>
  age<span class="p">:</span> <span class="n">30</span><span class="p">,</span>
<span class="p">}</span></pre></div>
          <div class="pane"><div class="pane-head"><span class="pane-label" style="color:#F2A0A0">Output · 错误</span></div><pre class="code" style="font-style:italic;color:rgba(255,255,255,.4)">// 等待修复后输出</pre></div>
        </div>
        <div class="status"><span style="color:#F2A0A0"><span class="dot" style="background:#F2A0A0;box-shadow:none"></span>Line 2, Col 3: key must be a string</span><span><span class="kbd">⌘Y</span>History</span></div>
      </div></div>
    </div>
  </div>

  <div>
    <p class="cap">1.6 单窗模式(In-place · ⌘↵ 执行当前 Tab)</p>
    <div class="grid2">
      <div class="stage stage-l"><div class="win win-l">
        <div class="tabs"><button class="tab active">Format</button><button class="tab">Minify</button><button class="tab">Tree</button><button class="tab">→Str</button><button class="tab">→JSON</button><span class="tab-spacer"></span><button class="gear" aria-label="Settings"><svg class="ico" width="14" height="14"><use href="#i-gear"/></svg></button></div>
        <div class="body" style="grid-template-columns:1fr">
          <div class="pane"><div class="pane-head"><span class="pane-label">In-place editor</span></div><pre class="code"><span class="p">{</span>
  <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span>
  <span class="k">"age"</span><span class="p">:</span> <span class="n">30</span>
<span class="p">}</span></pre>
            <div class="run-hint"><span class="kbd" style="margin-right:6px">⌘↵</span>Run Format</div>
          </div>
        </div>
        <div class="status"><span><span class="dot"></span>Valid JSON<span class="st-sep">·</span>single-pane</span><span><span class="kbd">⌘Y</span>History</span></div>
      </div></div>
      <div class="stage stage-d"><div class="win win-d">
        <div class="tabs"><button class="tab active">Format</button><button class="tab">Minify</button><button class="tab">Tree</button><button class="tab">→Str</button><button class="tab">→JSON</button><span class="tab-spacer"></span><button class="gear" aria-label="Settings"><svg class="ico" width="14" height="14"><use href="#i-gear"/></svg></button></div>
        <div class="body" style="grid-template-columns:1fr">
          <div class="pane"><div class="pane-head"><span class="pane-label">In-place editor</span></div><pre class="code"><span class="p">{</span>
  <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span>
  <span class="k">"age"</span><span class="p">:</span> <span class="n">30</span>
<span class="p">}</span></pre>
            <div class="run-hint"><span class="kbd" style="margin-right:6px">⌘↵</span>Run Format</div>
          </div>
        </div>
        <div class="status"><span><span class="dot"></span>Valid JSON<span class="st-sep">·</span>single-pane</span><span><span class="kbd">⌘Y</span>History</span></div>
      </div></div>
    </div>
  </div>

</div></div>

<section class="sec">
  <h2 class="sec-h">2 · 模态</h2>
  <p class="sec-d">AI Fix Diff / 设置 / 历史 / 权限引导。设置已去掉 reserved 行(上轮反馈);历史 op-chip 四色区分操作类型。</p>
  <div class="col">

    <div>
      <p class="cap">2.1 AI Fix · DiffView</p>
      <div class="grid2">
        <div class="stage stage-l"><div class="win win-l">
          <div class="tabs"><span class="tab-spacer"></span><button class="tab ai">AI Fix</button></div>
          <div class="diff">
            <div class="drow ddel"><span class="dg">-</span><span><span class="p">{</span> name<span class="p">:</span> <span class="s">'alice'</span><span class="p">,</span></span></div>
            <div class="drow dadd"><span class="dg">+</span><span><span class="p">{</span> <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span></span></div>
            <div class="drow"><span class="dg"></span><span class="dctx">&nbsp;&nbsp;<span class="k">"age"</span><span class="p">:</span> <span class="n">30</span><span class="p">,</span></span></div>
            <div class="drow ddel"><span class="dg">-</span><span>&nbsp;&nbsp;items<span class="p">:</span> <span class="p">[</span><span class="s">"a"</span><span class="p">,</span><span class="p">]</span></span></div>
            <div class="drow dadd"><span class="dg">+</span><span>&nbsp;&nbsp;<span class="k">"items"</span><span class="p">:</span> <span class="p">[</span><span class="s">"a"</span><span class="p">]</span></span></div>
          </div>
          <div class="set-foot"><button class="btn">Cancel</button><button class="btn btn-primary"><span class="kbd" style="margin-right:6px;border-color:rgba(255,255,255,.45);color:#fff;background:transparent">⌘↵</span>Accept</button></div>
        </div></div>
        <div class="stage stage-d"><div class="win win-d">
          <div class="tabs"><span class="tab-spacer"></span><button class="tab ai">AI Fix</button></div>
          <div class="diff">
            <div class="drow ddel"><span class="dg">-</span><span><span class="p">{</span> name<span class="p">:</span> <span class="s">'alice'</span><span class="p">,</span></span></div>
            <div class="drow dadd"><span class="dg">+</span><span><span class="p">{</span> <span class="k">"name"</span><span class="p">:</span> <span class="s">"alice"</span><span class="p">,</span></span></div>
            <div class="drow"><span class="dg"></span><span class="dctx">&nbsp;&nbsp;<span class="k">"age"</span><span class="p">:</span> <span class="n">30</span><span class="p">,</span></span></div>
            <div class="drow ddel"><span class="dg">-</span><span>&nbsp;&nbsp;items<span class="p">:</span> <span class="p">[</span><span class="s">"a"</span><span class="p">,</span><span class="p">]</span></span></div>
            <div class="drow dadd"><span class="dg">+</span><span>&nbsp;&nbsp;<span class="k">"items"</span><span class="p">:</span> <span class="p">[</span><span class="s">"a"</span><span class="p">]</span></span></div>
          </div>
          <div class="set-foot"><button class="btn">Cancel</button><button class="btn btn-primary"><span class="kbd" style="margin-right:6px;border-color:rgba(255,255,255,.45);color:#fff;background:transparent">⌘↵</span>Accept</button></div>
        </div></div>
      </div>
    </div>

    <div>
      <p class="cap">2.2 SettingsView</p>
      <div class="grid2">
        <div class="stage stage-l"><div class="win win-l">
          <div class="mtitle"><div class="traffic"><span class="tl-r"></span><span class="tl-y"></span><span class="tl-g"></span></div><div class="mtitle-name">Settings</div></div>
          <div class="set-grid">
            <nav class="set-nav"><div class="set-nav-item active">General</div><div class="set-nav-item">Shortcuts</div><div class="set-nav-item">AI</div><div class="set-nav-item">History</div><div class="set-nav-item">JSON Transform</div><div class="set-nav-item">About</div></nav>
            <div class="set-panel"><p class="set-title">General</p>
              <div class="set-row"><span>开机自启动</span><span class="toggle on"><i></i></span></div>
              <div class="set-row"><span>智能缩放</span><span class="toggle on"><i></i></span></div>
              <div class="set-row" style="border-bottom:none"><span>主题</span><span class="pill">System <svg class="ico" width="11" height="11"><use href="#i-chevron"/></svg></span></div>
            </div>
          </div>
          <div class="set-foot"><button class="btn">Reset all</button><button class="btn btn-primary">Done</button></div>
        </div></div>
        <div class="stage stage-d"><div class="win win-d">
          <div class="mtitle"><div class="traffic"><span class="tl-r"></span><span class="tl-y"></span><span class="tl-g"></span></div><div class="mtitle-name">Settings</div></div>
          <div class="set-grid">
            <nav class="set-nav"><div class="set-nav-item active">General</div><div class="set-nav-item">Shortcuts</div><div class="set-nav-item">AI</div><div class="set-nav-item">History</div><div class="set-nav-item">JSON Transform</div><div class="set-nav-item">About</div></nav>
            <div class="set-panel"><p class="set-title">General</p>
              <div class="set-row"><span>开机自启动</span><span class="toggle on"><i></i></span></div>
              <div class="set-row"><span>智能缩放</span><span class="toggle on"><i></i></span></div>
              <div class="set-row" style="border-bottom:none"><span>主题</span><span class="pill">System <svg class="ico" width="11" height="11"><use href="#i-chevron"/></svg></span></div>
            </div>
          </div>
          <div class="set-foot"><button class="btn">Reset all</button><button class="btn btn-primary">Done</button></div>
        </div></div>
      </div>
    </div>

    <div>
      <p class="cap">2.3 历史 Modal(op-chip 四色区分)</p>
      <div class="grid2">
        <div class="stage stage-l"><div class="win win-l">
          <div class="mtitle"><div class="traffic"><span class="tl-r"></span><span class="tl-y"></span><span class="tl-g"></span></div><div class="mtitle-name">History</div></div>
          <div style="padding:10px 13px;display:flex;gap:8px;align-items:center"><span class="srch"><svg class="ico" width="12" height="12"><use href="#i-search"/></svg>Search…</span><span class="fchip active">All</span><span class="fchip">Pin</span><span class="fchip">Star</span></div>
          <div>
            <div class="hist-item active"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span class="op-chip op-ai">AI-FIX</span><span class="hist-meta"><svg class="ico" width="10" height="10"><use href="#i-pin"/></svg>Pinned · 2m</span></div><div class="hist-json">{"name":"alice","age":30}</div></div>
            <div class="hist-item"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span class="op-chip op-format">FORMAT</span><span class="hist-meta"><svg class="ico" width="10" height="10"><use href="#i-star"/></svg>12m</span></div><div class="hist-json">{"code":200,"data":{"name":"alice"}}</div></div>
            <div class="hist-item" style="border-bottom:none"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span class="op-chip op-tree">TREE</span><span class="hist-meta">38m</span></div><div class="hist-json">[{"x":1,"y":2},{"x":3,"y":4}]</div></div>
          </div>
        </div></div>
        <div class="stage stage-d"><div class="win win-d">
          <div class="mtitle"><div class="traffic"><span class="tl-r"></span><span class="tl-y"></span><span class="tl-g"></span></div><div class="mtitle-name">History</div></div>
          <div style="padding:10px 13px;display:flex;gap:8px;align-items:center"><span class="srch"><svg class="ico" width="12" height="12"><use href="#i-search"/></svg>Search…</span><span class="fchip active">All</span><span class="fchip">Pin</span><span class="fchip">Star</span></div>
          <div>
            <div class="hist-item active"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span class="op-chip op-ai">AI-FIX</span><span class="hist-meta"><svg class="ico" width="10" height="10"><use href="#i-pin"/></svg>Pinned · 2m</span></div><div class="hist-json">{"name":"alice","age":30}</div></div>
            <div class="hist-item"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span class="op-chip op-format">FORMAT</span><span class="hist-meta"><svg class="ico" width="10" height="10"><use href="#i-star"/></svg>12m</span></div><div class="hist-json">{"code":200,"data":{"name":"alice"}}</div></div>
            <div class="hist-item" style="border-bottom:none"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span class="op-chip op-tree">TREE</span><span class="hist-meta">38m</span></div><div class="hist-json">[{"x":1,"y":2},{"x":3,"y":4}]</div></div>
          </div>
        </div></div>
      </div>
    </div>

    <div>
      <p class="cap">2.4 macOS 权限引导</p>
      <div class="grid2">
        <div class="stage stage-l"><div class="win win-l" style="max-width:320px">
          <div class="perm"><div class="perm-k">SHORTCUT PERMISSION</div><div class="perm-t">需要处理系统隐私权限</div><div class="perm-d">如果 <span class="kbd">⌘⇧J</span> 无法在其他 App 前台唤起 Jsonita，请在 macOS 隐私设置中允许 Jsonita。</div><div style="display:flex;gap:6px;justify-content:center"><button class="btn">稍后</button><button class="btn btn-primary">打开系统设置</button></div></div>
        </div></div>
        <div class="stage stage-d"><div class="win win-d" style="max-width:320px">
          <div class="perm"><div class="perm-k">SHORTCUT PERMISSION</div><div class="perm-t">需要处理系统隐私权限</div><div class="perm-d">如果 <span class="kbd">⌘⇧J</span> 无法在其他 App 前台唤起 Jsonita，请在 macOS 隐私设置中允许 Jsonita。</div><div style="display:flex;gap:6px;justify-content:center"><button class="btn">稍后</button><button class="btn btn-primary">打开系统设置</button></div></div>
        </div></div>
      </div>
    </div>

  </div>
</section>

<section class="sec">
  <h2 class="sec-h">3 · 状态栏 · 菜单栏 · 空状态 · Toast</h2>
  <p class="sec-d">left = light,right = dark。Toast 为 reserved(当前实现未接入,仅留视觉)。</p>
  <div class="col">

    <div>
      <p class="cap">3.1 状态栏 4 态</p>
      <div class="grid2">
        <div class="stage stage-l"><div class="win win-l"><div class="status" style="border-top:none"><span><span class="dot"></span>Valid JSON<span class="st-sep">·</span>5 lines<span class="st-sep">·</span>76 bytes</span><span><span class="kbd">⌘Y</span>History</span></div></div></div>
        <div class="stage stage-d"><div class="win win-d"><div class="status" style="border-top:none"><span><span class="dot"></span>Valid JSON<span class="st-sep">·</span>5 lines<span class="st-sep">·</span>76 bytes</span><span><span class="kbd">⌘Y</span>History</span></div></div></div>
        <div class="stage stage-l"><div class="win win-l"><div class="status" style="border-top:none;color:#C0392B"><span><span class="dot" style="background:#C0392B;box-shadow:none"></span>Invalid JSON<span class="st-sep">·</span>Line 3, Col 12</span><span style="opacity:.6"><span class="kbd">⌘Y</span>History</span></div></div></div>
        <div class="stage stage-d"><div class="win win-d"><div class="status" style="border-top:none;color:#F2A0A0"><span><span class="dot" style="background:#F2A0A0;box-shadow:none"></span>Invalid JSON<span class="st-sep">·</span>Line 3, Col 12</span><span style="opacity:.6"><span class="kbd">⌘Y</span>History</span></div></div></div>
        <div class="stage stage-l"><div class="win win-l"><div class="status" style="border-top:none;opacity:.65"><span>— Paste JSON to start</span><span><span class="kbd">⌘Y</span>History</span></div></div></div>
        <div class="stage stage-d"><div class="win win-d"><div class="status" style="border-top:none;opacity:.6"><span>— Paste JSON to start</span><span><span class="kbd">⌘Y</span>History</span></div></div></div>
        <div class="stage stage-l"><div class="win win-l"><div class="status" style="border-top:none;color:#A4621A"><span><span class="dot" style="background:#A4621A;box-shadow:none"></span>Large file<span class="st-sep">·</span>5.4 MB</span><span style="opacity:.6"><span class="kbd">⌘Y</span>History</span></div></div></div>
        <div class="stage stage-d"><div class="win win-d"><div class="status" style="border-top:none;color:#FFB66B"><span><span class="dot" style="background:#FFB66B;box-shadow:none"></span>Large file<span class="st-sep">·</span>5.4 MB</span><span style="opacity:.6"><span class="kbd">⌘Y</span>History</span></div></div></div>
      </div>
    </div>

    <div>
      <p class="cap">3.2 菜单栏 tray 下拉</p>
      <div class="grid2">
        <div class="stage stage-l"><div class="win win-l" style="max-width:280px">
          <div class="mtitle"><span style="font:600 11px/1 var(--mono);padding:2px 5px;border-radius:5px;background:rgba(10,108,224,.12);color:#0A6CE0">{ }</span><span style="font:500 12px/1 var(--ui);margin-left:7px">Jsonita</span><span style="flex:1"></span><span style="font:10.5px/1 var(--mono);opacity:.5">10:42</span></div>
          <div class="menu"><div class="menu-item">Toggle Jsonita</div><div class="menu-item">Settings…<span class="kbd">⌘,</span></div><div class="menu-sep"></div><div class="menu-item" style="opacity:.7">Quit Jsonita<span class="kbd">⌘Q</span></div></div>
        </div></div>
        <div class="stage stage-d"><div class="win win-d" style="max-width:280px">
          <div class="mtitle"><span style="font:600 11px/1 var(--mono);padding:2px 5px;border-radius:5px;background:rgba(10,132,255,.2);color:#7FB3FF">{ }</span><span style="font:500 12px/1 var(--ui);margin-left:7px">Jsonita</span><span style="flex:1"></span><span style="font:10.5px/1 var(--mono);opacity:.5">10:42</span></div>
          <div class="menu"><div class="menu-item">Toggle Jsonita</div><div class="menu-item">Settings…<span class="kbd">⌘,</span></div><div class="menu-sep"></div><div class="menu-item" style="opacity:.7">Quit Jsonita<span class="kbd">⌘Q</span></div></div>
        </div></div>
      </div>
    </div>

    <div>
      <p class="cap">3.3 空状态(浮窗无内容)</p>
      <div class="grid2">
        <div class="stage stage-l"><div class="win win-l">
          <div class="tabs"><button class="tab active">Format</button><button class="tab">Minify</button><button class="tab">Tree</button><button class="tab">→Str</button><button class="tab">→JSON</button><span class="tab-spacer"></span><button class="gear" aria-label="Settings"><svg class="ico" width="14" height="14"><use href="#i-gear"/></svg></button></div>
          <div class="body" style="min-height:118px">
            <div class="pane empty" style="flex-direction:column"><div class="empty-g">{ }</div><div class="empty-t">Paste JSON to start</div><div style="margin-top:6px"><span class="kbd">⌘V</span></div></div>
            <div class="pane empty"><span class="empty-t">→ output</span></div>
          </div>
        </div></div>
        <div class="stage stage-d"><div class="win win-d">
          <div class="tabs"><button class="tab active">Format</button><button class="tab">Minify</button><button class="tab">Tree</button><button class="tab">→Str</button><button class="tab">→JSON</button><span class="tab-spacer"></span><button class="gear" aria-label="Settings"><svg class="ico" width="14" height="14"><use href="#i-gear"/></svg></button></div>
          <div class="body" style="min-height:118px">
            <div class="pane empty" style="flex-direction:column"><div class="empty-g">{ }</div><div class="empty-t">Paste JSON to start</div><div style="margin-top:6px"><span class="kbd">⌘V</span></div></div>
            <div class="pane empty"><span class="empty-t">→ output</span></div>
          </div>
        </div></div>
      </div>
    </div>

    <div>
      <p class="cap">3.4 Toast · 4 variant(reserved)</p>
      <div class="grid2">
        <div class="stage stage-l"><div style="display:flex;flex-direction:column;gap:8px;width:100%">
          <div class="toast" style="background:rgba(10,108,224,.1);border:1px solid rgba(10,108,224,.25);color:#0A6CE0"><svg class="ico" width="14" height="14" style="margin-top:1px"><use href="#i-search"/></svg><span><b style="font-weight:500">Restored from 3 min ago</b><br><span class="ti2">Cmd+Z to revert</span></span></div>
          <div class="toast" style="background:rgba(31,158,90,.1);border:1px solid rgba(31,158,90,.28);color:#1F8A50"><svg class="ico" width="14" height="14" style="margin-top:1px"><use href="#i-copy"/></svg><span><b style="font-weight:500">Copied: user.name</b><br><span class="ti2">Path 已复制</span></span></div>
          <div class="toast" style="background:rgba(181,101,29,.1);border:1px solid rgba(181,101,29,.28);color:#A4621A"><span><b style="font-weight:500">Rate limited</b><br><span class="ti2">请 42s 后重试</span></span></div>
          <div class="toast" style="background:rgba(201,42,42,.09);border:1px solid rgba(201,42,42,.28);color:#C0392B"><span><b style="font-weight:500">API key invalid</b><br><span class="ti2">Open Settings</span></span></div>
        </div></div>
        <div class="stage stage-d"><div style="display:flex;flex-direction:column;gap:8px;width:100%">
          <div class="toast" style="background:rgba(10,132,255,.16);border:1px solid rgba(10,132,255,.3);color:#7FB3FF"><svg class="ico" width="14" height="14" style="margin-top:1px"><use href="#i-search"/></svg><span><b style="font-weight:500">Restored from 3 min ago</b><br><span class="ti2">Cmd+Z to revert</span></span></div>
          <div class="toast" style="background:rgba(91,227,160,.16);border:1px solid rgba(91,227,160,.32);color:#5BE3A0"><svg class="ico" width="14" height="14" style="margin-top:1px"><use href="#i-copy"/></svg><span><b style="font-weight:500">Copied: user.name</b><br><span class="ti2">Path 已复制</span></span></div>
          <div class="toast" style="background:rgba(255,182,107,.16);border:1px solid rgba(255,182,107,.32);color:#FFB66B"><span><b style="font-weight:500">Rate limited</b><br><span class="ti2">请 42s 后重试</span></span></div>
          <div class="toast" style="background:rgba(242,122,122,.16);border:1px solid rgba(242,122,122,.32);color:#F2A0A0"><span><b style="font-weight:500">API key invalid</b><br><span class="ti2">Open Settings</span></span></div>
        </div></div>
      </div>
    </div>

  </div>
</section>

<footer>
  全部屏均用同一套玻璃 token(系统蓝强调 + 绿 valid + 四色 op-chip),light/dark 自洽。这一版同时修掉了上轮评审:① AI Fix 标签 / DiffView Accept 走琥珀+蓝强调,出错→修复路径有视觉重量;② History op-chip 蓝/青/绿/琥珀四色,扫一眼识别操作;③ 设置去掉 reserved 行;④ 图标全部 SVG 描边,无 emoji。<br><br>
  下一步若选「落 tokens」:我会把这套色板 / 圆角 / 阴影 / 字阶整理进 <code>src/styles/tokens.css</code> 的 <code>:root</code> + <code>[data-theme="dark"]</code>,统一 <code>assets/style.css</code>,并按 WORKFLOW.md 同步 design/01 mockups + CHANGELIST,再 commit(不 push)。
</footer>
```
