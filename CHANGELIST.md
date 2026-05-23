# Changelog

本项目的所有重要变更记录于此文件。

格式参照 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) ，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/spec/v2.0.0.html) 。

## [Unreleased]

### fix · Keychain 切换的多处遗漏 + Single-pane mode 真接 + About 占位 + Test mock + spec/plan 大扫

用户连发 4 张截图反馈：

1. **ApiKeyInput placeholder 还说"已存 Keychain"** ── 后端切了 UI 没跟着改，撒谎。改：placeholder "已存 Keychain，可输入新 key 覆盖" → "已保存，可输入新 key 覆盖"；2 条 toast "Saved to Keychain" / "Removed from Keychain" 去掉后缀；JSDoc + commands.ts 注释也清
2. **Settings → AI Test 按钮还在 mock**（"OK · (M2-N2 mock — M2-N3 starts real HTTP)"）── M2-N3 漏改。改 `cmds/ai.rs ai_test_connection`：实打 `POST chat/completions` max_tokens=1，返 ok + 真实 latency + 服务端 echo model 名；err 走 err_chain 展开 source
3. **About 面板只显示"M3-N6"占位** ── 我自己留的字符串泄漏 UI。改：版本 + License + 数据/日志路径 + 作者
4. **Single-pane mode 永远没接** ── settings 字段是死字段。`FloatingWindow.tsx` grid 改 `singlePaneMode ? '1fr' : '1fr 1fr'`，true 时只渲染左 input editor（右栏隐藏）
5. **spec/ + plan/ 散落旧 Keychain 描述** ── 用户怒命令"每次改动必须再重新审查一遍 spec+plan，写进 CLAUDE.md"。完成扫描：
   - `plan/03_tech_stack.html` § 2.4 密钥存储行 + § 2.5 整段（重写为"为什么 secrets.json 而不是 Keychain"）+ Crate 列表删 `keyring`
   - `plan/04_nfr.html` 隐私段 3 处 + 卸载脚本描述
   - `spec/00_architecture.html` 8 处描述 + mermaid 节点 `KC[Keychain]` → `KC[secrets.json]` / `E4[Keychain]` → `E4[secrets.json]` + 各 system 层 label
   - `spec/02_ipc.html` 唯一通道描述 + ai 分组表 + sequence 图 + 错误矩阵
   - `spec/04_components.html` ApiKeyInputProps 注释
   - `spec/10_storage.html` § 6 整段重写 "Keychain 封装" → "secrets store"，含设计要点 / Account 清单 / 接口签名 / 性能数字
   - `spec/11_ai_client.html` 5 处文字 + 代码示例
   - `spec/13_schemas.html` § 6 整段 "Keychain entry" → "secrets.json schema"（含 JSON 示例）+ JsonitaError 表 + Rust enum + TS 镜像
   - `spec/15_logging.html` ERROR 示例 + `keychain.denied` event → `secrets.io_error`
   - `JsonitaError::Keychain` 变体名<b>不动</b>（不破坏 M2-N2 commit），所有引用处加注释"命名遗留 = secrets 存取错"
6. **CLAUDE.md 加 § 5.4** "源码/UI 改了某个概念后必扫 spec/ + plan/" ── 永远防再犯

涉及 18 个文件 / ~250 行净改动。

### refactor · Keychain → 本地 secrets.json（用户反馈"太麻烦"）

每次 dev rebuild macOS 都把 binary 当新身份，弹"jsonita wants to use confidential information in com.jsonita.app keychain"密码框。生产环境签了名也会首次弹一次。用户反馈"太麻烦，删了改本地保存"。换法：

- 新建 `src-tauri/src/store/secrets.rs` ── file-backed { account → value }，路径 `~/Library/Application Support/Jsonita/secrets.json`，进程内 `OnceLock<Mutex<HashMap>>` 缓存，写文件 chmod 600
- 删 `src-tauri/src/store/keychain.rs`
- `store/mod.rs` `pub mod keychain` → `pub mod secrets`
- `cmds/ai.rs` + `ai/deepseek.rs` ── 5 处 `keychain::` 调用 → `secrets::`，API 完全等价
- `Cargo.toml` ── 删 `security-framework = "3"` 依赖
- `README.md` 卸载 ── 删 `security delete-generic-password` 行（前面 `rm -rf ~/Library/Application Support/Jsonita` 已经把 secrets.json 一起带走）
- 错误 variant `JsonitaError::Keychain` 名字保留不动（少改动；意义上是"secrets 存取出错"）

安全权衡：相比 Keychain 失去 OS 加密；换来**无弹窗、无 codesign 依赖、dev rebuild 不丢 key**。对个人本地工具足够（数据目录已 per-user 隔离 0700）。

7 文件 / +75 / -65 行。

### fix · AI Fix 按钮永远 disabled + Settings 各种用户反馈

用户多轮反馈：

1. **Model ID 输入框不需要** ── DeepSeek 现在主推 v4 系列，UI 让用户填 model 名字反而误导。删 Settings → AI 的 Model ID 文本输入；字段仍在 Settings struct 里（ApiKeyInput 拿它做 keychain account name），只是 UI 不展示
2. **`× Io` 是啥意思** ── AI 关时点 AI Fix，UI 只显示 enum 变体名 `Io`（因为 `setError(e.kind)` 把 data 吃掉了）。
   - Rust: 加 `JsonitaError::AiDisabled` 专用 variant；`deepseek.rs` 用它替换之前误用的 `Io("ai disabled")`
   - UI: AiFixPane 给 `AiDisabled` 友好文案"AI Fix is disabled. Enable it in Settings → AI."；`Io` / `Sqlite` fallback 也至少显示 `kind: data` 不再裸 enum 名
3. **AI 没开启右上 AI Fix 按钮应该 disabled + hover tooltip** ── 之前按钮永远可点，点了才报错。改：`TabBar.tsx` 读 `settings.aiEnabled`，false 时 `opacity: 0.45 + cursor: not-allowed + title` tooltip + onClick no-op + `aria-disabled`；i18n key `tab.aiFixDisabledTooltip`
4. **看来是用错 url 了 / API docs 看一下** ── DeepSeek 官方 doc (api-docs.deepseek.com) 现在权威是 `https://api.deepseek.com/chat/completions`（无 `/v1`）。改 `ENDPOINT`。两个路径其实都 401，但用 canonical 的稳
5. **reqwest 真错被 `e.to_string()` 吞了** ── `error sending request for url (...)` 看不到根因（实际是 `HTTP_PROXY=127.0.0.1:59527` 不监听但 reqwest 走了它）。加 `err_chain()` 顺着 `e.source()` 拼全链给 UI
6. **"我已经开启 AI Fix 为什么还 disabled"** ── 真 bug。Settings store 只在 Modal 打开时拉 `settings_get_all`，启动期不拉。所以 app 重启后 store 回到 `DEFAULT_SETTINGS`（`aiEnabled: false`），TabBar 一直读默认值。修：`App.tsx` mount 时立刻 `settingsApi.getAll().then(setSettings)`，让 store 跟磁盘同步

11 文件 / +47 / -20 行。

### chore · 删 agent 控制面文件（experiment 不付费）

`1d24bae` 那次"agent control plane refactor"加了一套 SOP + 任务卡 + machine-readable manifest，想把 agent 实施流程做成数据驱动。实际跑 M0-M3 时这套<b>几乎没被引用</b>── 节奏靠 CLAUDE.md + `progress/0N_*.html` + TaskCreate 推就够了，反而维护成本（每完成一个节点要同步 manifest.json 的 status / 写 task 卡）变成负担。删。

- `AGENT_RUNBOOK.md` (180 行) ── coding agent SOP
- `AGENTS.md` (205 行) ── Codex-style agent rules（与 CLAUDE.md 大段重复）
- `progress/manifest.json` (699 行) ── 33 节点 machine-readable 总表
- `progress/tasks/M0-N1..N7_*.md` (7 文件 ~550 行) ── M0 任务卡（M1+ 本就没补，证明这套没生效）
- `docs/traceability.md` (81 行) ── Feature ↔ Spec ↔ Progress ↔ Task ↔ Test ↔ Acceptance 矩阵
- 同步：`README.md` 删 AGENT_RUNBOOK 一行 + manifest.json cat 命令；5 篇 `progress/0N_*.html` Verification Log intro 删 `AGENT_RUNBOOK § 7` 链接

总：-9 文件 / -1700+ 行（含 manifest.json）。`progress/` 只剩 5 篇 phase html，回到 CLAUDE.md § 3.1 描述的状态。

### chore · 删 index.html 整个 README/TODO/CHANGELIST 标签页区块

用户反馈"那你保留这个干嘛"── 上一轮删了 fetch 失败时的 CORS fallback 后，整个 md-tabs 也不必再保留。首页只留 Plan/Spec/Progress 三栏 + footer，README/TODO/CHANGELIST 直接看 .md 原文。

- `index.html` ── 删 `.md-tabs` + `.md-panes` + fetch 脚本 + `<script src="marked.min.js">` 引入；从 69 → 84 行删到 33 → 已写完整页
- `assets/style.css` ── 删 `.md-tabs` / `.md-tab` / `.md-pane` 全套样式（~135 行）
- `assets/style.css` ── 之前先删的 `.md-fallback`（21 行）合并到这一节描述
- `CLAUDE.md` § 1.3 / § 5.3 同步：删"README/TODO/CHANGELIST 由 index.html 运行时 fetch 加载"的描述

### fix · tray Settings 灰色 + Edit-race 漏写补齐（用户反馈"settings 打不开"）

用户截图反馈 tray 菜单"Settings…" 项灰色不可点。根因：M0-N2 占位写了 `enabled=false` + 空 handler，M2-N1 写 Settings Modal 时只接了 StatusBar ⚙ 按钮入口，没回头改 tray 项。顺手补齐 M3-N2 漏挂的 `useLocaleSync()`（导致 Settings 切语言不生效）。

- `src-tauri/src/menubar/mod.rs` ── Settings 项 `enabled=true`；handler 接 `crate::window::toggle_show_only(app)` + `emit("tray:open-settings", ())`
- `src-tauri/src/window/mod.rs` ── 新增 `toggle_show_only(app)`：仅显示不切换（窗口已显示时点 Settings 不应反而 hide）
- `src/App.tsx` ── `import { useLocaleSync }` + 顶层调用；新增 `listen('tray:open-settings')` → `setSettingsModalOpen(true)`

### fix · SettingsModal i18n 硬编码 → 全 t() (M3-N2 漏)

用户截图反馈：Locale=English 时 General 字段 label 仍是中文（开机自启动 / 失焦自动隐藏 / 智能扩宽 / 单窗模式 / 自动粘贴剪贴板）。根因：M2-N1 写 SettingsModal 时只把标题 + nav 走 i18n，字段 label 直接写中文常量；M3-N2 加 locale 时没回头查这里。同时 `Settings` struct 在 Rust + TS 两端都缺 `locale` 字段（M3-N2 仅加了 useLocaleSync.ts 没加 store）。

- `src/locales/{en-US,zh-CN}/settings.json` ── 补全 5 组字段 i18n key：`general.*` / `ai.*` / `history.*` / `jsonTransform.*` / `shortcuts.*` / `footer.*`
- `src/settings/SettingsModal.tsx` ── 5 个 Group 子组件全部 `useTranslation('settings')` + `t()` 替换；footer Reset all / Done 也走 i18n
- `src/settings/ShortcutInput.tsx` ── `Bound: X` / `Press keys…` / `(none)` / `冲突...` / `Override` / `confirm` 文案全 t() + 参数化 (`{{accelerator}}` / `{{app}}` / `{{reason}}`)
- `src-tauri/src/types.rs` ── 加 `pub enum Locale { EnUs, ZhCn }`（`#[serde(rename = "en-US" / "zh-CN")]`）+ `Settings.locale: Locale` + default `Locale::EnUs`
- `src/store/settings.ts` ── Settings interface 加 `locale: 'en-US' | 'zh-CN'` + DEFAULT_SETTINGS

教训：commit 前必跑 `git diff --stat` 看 file list 与预期一致，再写 commit message。Edit 工具 stale state 失败时一定要 verify file 后再继续。

### Docs UI · docmost / lark 冷淡风格统一

- `assets/style.css` ── 全局文档站 palette 改为灰白底 + 低饱和蓝焦点：背景 `#F7F8FA` / 文本 `#1F2329` / 主色 `#245BDB`；新增 `--bg-subtle` / `--radius-*`；正文、侧栏、topbar、表格、callout、pagination、index、mockup、mermaid 统一为细边框、轻阴影、8px 内圆角
- `assets/nav.js` Mermaid themeVariables 同步新 palette（primary / line / note / actor / label），避免渲染图仍保留旧高饱和蓝橙
- `plan/01_features.html`、`plan/02_interaction.html`、`spec/00/01/02/03/05/06/08/14/15` ── 机械迁移 HTML 内 Mermaid classDef / swatch / mockup inline 旧色值；`AI Fix` 去掉 sparkle emoji，历史搜索 / pin / toast / 权限提示等 mockup 改成更克制的文字与冷色焦点态
- 关键决策：本轮不新增/删除章节，因此不改 `index.html` 章节列与 `assets/nav.js` 章节定义；`src/index.html` 是 Tauri 透明根节点，不承载可见文档 UI，保持不动
- diff 范围：14 个文档/样式文件，`454 insertions / 443 deletions`

### M3 实施期 · 1.0.0 路线起手

#### M3-N6 · README 重写（done · agent-side；screenshot/GIF + release 留用户）

- `README.md` 全文重写：1 段 tagline + 9 行功能表 + 系统需求 + 安装（brew/dmg/源码 3 渠道） + 基本使用 7 步 + 文档链接表 + 当前进度表（5 Phase × 节点） + 卸载脚本（4 行清 app + 数据 + 日志 + Keychain） + MIT License
- `progress/manifest.json` M3-N3 + M3-N6 status: completed
- `progress/04_m3_polish_cross.html` M3-N6 status: done · agent-side

留用户：录 3 段演示 GIF（kap / licecap，每段 ≤ 5s ≤ 500KB）+ 截图 light/dark 各 1 张 + 跑 M0/M1/M2/M3 全验收 → `git tag 1.0.0` → `gh release create v1.0.0`。

#### fix(spec/00) · § 2.1 mermaid stateDiagram syntax

label 内裸用 `:` `/` `()` 导致 mermaid 11.4 解析失败（用户截图 "Syntax error in text"）。按 `mermaid-safe-syntax` memory：

- `app:will_quit` → `app·will_quit`
- `⌘⇧J / tray click` → `⌘⇧J · tray click`（5 处 / 替换）
- `window.show()` → `window.show` / `window.hide()` → `window.hide`

### Style 修复 · section-divider 提升为大段标题（用户反馈"divider 令人疑惑"）

- `assets/style.css` `.section-divider` ── 删 `border-top` 灰线 + `::before` 蓝色短线装饰；padding 14px 18px → 0；margin 56/8 → 64/24（上下空白拉开）；letter-spacing 0.18 → 0.16em
- `assets/style.css` `.section-divider b` ── 字号 16px → <b>26px</b>；letter-spacing 0.08 → 0.04em（大字不需要那么宽字距）
- 新阶梯：H1 doc-title 34px > <b>divider 26px banner</b> > H2 21px 小节 > H3 17px 子节
- 修复用户反馈：之前 divider b 16px <b>小于</b> H2 21px ── "一级分组比二级小节字号还小"，加上灰线 + 短蓝线装饰让用户读成"装饰横条"而非"分组标题"；本次去装饰 + 提字号让分组语义自显（CSS 顶部注释写下视觉规则避免下次再退回小字号）

提交：`7cb9022 style(css): section-divider 提升为 26px 净文字大标题（去装饰线）`

待用户验证：浏览器开任一 spec 章（如 00 系统架构 / 02 IPC），看"一 · 设计" / "二 · 机制" / "三 · 契约" / "四 · 数字" 四段 banner 视觉是否清晰、与 H2 阶梯顺。

### M3 实施期 · 1.0.0 路线起手

#### M3-N1 · 主题切换 + Empty State（done · minimal · pending-user-verification）

- `src/theme/useEffectiveTheme.ts` ── 3 数据源 hook（spec/03 § 11）：settings.theme + matchMedia('(prefers-color-scheme: dark)') (system 时) + localStorage cache；apply 时 `document.documentElement.dataset.theme = eff` + localStorage 写入；matchMedia change 订阅 → settings 切换时自动 unsubscribe
- `src/index.html` ── 7 行 inline FOUC 防止脚本（先于 React bundle 读 localStorage 设 data-theme）
- `src/components/EmptyState.tsx` ── 复用组件（icon + title + hint）；M3 后续可挂入 HistoryModal / Settings 等
- `src/shell/FloatingWindow.tsx` ── 接 useEffectiveTheme + 两个 Editor 传 theme={effective}（M3-N1 前硬编码 light）
- `src/settings/SettingsModal.tsx` ── General 分组顶部加 Theme select（System / Light / Dark）

`prefers-reduced-motion` 已在 M1-N3 tokens.css 写好（animation-duration:1ms!important）；spec/03 § 9.1 自动满足。

Empty State 6 处 spec/01 § 9：组件就位；M3 polish 时挂入 HistoryModal 空列表 / 无 API key 等场景（当前 PanelShell 空 / AI loading 已有内联 placeholder）。

### UI infra · 文档导航重构（done · pending-user-verification）

#### nav 重构：顶部章节 strip + 左侧文档 TOC（H2/H3）+ scrollspy

- `assets/nav.js` `renderTopbar` ── topbar 内拆<b>两行</b>：第 1 行 breadcrumb + "↩ 文档首页"按钮（原样）；第 2 行 <code>.chapter-strip</code> 横向列当前 section 全部章节（plan 5 / spec 16 / progress 5）；当前 .active 蓝软背景；初渲染后 <code>scrollIntoView({inline:'center'})</code> 把当前项滚到 strip 中央
- `assets/nav.js` `renderSidebar` ── 原章节列表改为<b>当前文档 H2/H3 目录</b>；header subtitle 从 section.label 改为<b>当前章节标题</b>（如 "05 · v1.1+ Distribution"）；底部"导航"段（文档首页 / README / TODO / CHANGELIST）保留
- 新 helper `ensureHeadingIds()` ── 给 <code>.doc-article h2/h3</code> 注入 id：已有保留（progress 文件 <code>entry-criteria</code> / <code>milestones</code> / <code>d-n1-brew</code> 等）；按 h2-num/h3-num 生成 <code>h2-1</code> / <code>h3-3-1</code>；fallback slugify（中文 unicode 范围保留）
- 新 helper `buildDocTOC()` ── 扫所有带 id 的 H2/H3 输出 <code>ul.toc.toc-doc</code>；H3 加 .toc-h3 类做 38px 缩进 + 字号小 + 字色淡
- 新 helper `setupScrollspy()` ── window scroll + rAF 节流；阈值 130px；找<b>最后一个 top ≤ 130 的 H2/H3</b>作 active；TOC 当前项 <code>.active</code> + 偏离 sidebar 可视范围时 <code>scrollIntoView({block:'nearest'})</code>
- `renderPagination()` 不动 ── 底部"上一节 / 下一节"按章节顺序保留，与顶部 strip "任意跳"两种体验并存

CSS（已随 m2-n4 commit a5f2615 顺带进 HEAD，本 entry 仅记录效果）：
- `.topbar` height 52→104px 拆两行；新 `.topbar-row.row-strip` + 右侧渐变 mask
- 新 `.chapter-strip`（横向 flex / overflow-x:auto / hover/active 蓝色软背景）
- 新 `.toc-doc` 变体（H2/H3 两级缩进 + scrollspy 高亮）
- `main.doc-main` padding-top 52→104；新 `scroll-padding-top: 120px` + `scroll-margin-top: 120px` 让锚点跳转不被 topbar 遮挡

关键决策：
- <b>0 个 HTML 文件改动</b> ── nav 由 nav.js 运行时注入；body 内容不动；用户已为 progress/01-05 加的 H2/H3 <code>id</code> 由 ensureHeadingIds 自动检测保留
- scrollspy 用 scroll + rAF 而非 IntersectionObserver ── 边界处理更稳（滚到底也保留 active）；性能 OK（典型 5-30 个 heading）
- 顶部单层 strip + 三 section 切换走 breadcrumb（用户 AskUserQuestion Q1 Recommended）；左侧 H2+H3+scrollspy（Q2 Recommended）；spec 16 章节横向溢出走滚动条 + 渐变 mask（Q3 Recommended）

待用户验证：浏览器开任一 plan/spec/progress 页面 → 看顶部章节 strip 渲染 + 当前项高亮 + 左侧切到 doc TOC + 滚动时 H2/H3 跟随高亮 + 锚点跳转不被 topbar 遮挡。

### M2 实施期 · 0.5.0-m2 路线起手

#### M2-N5 · 自定义快捷键 + 冲突检测（done · pending-user-verification）

- `src-tauri/src/shortcuts/mod.rs` ── parse_accelerator("CmdOrCtrl+Shift+J" 类) + 8 reserved 列表 (⌘Q/⌘W/⌘Tab/⌘Space/⌘H/F11/F12/Escape) + register_all/register_one 双键模式 + `shortcut_register` IPC（验证 → patch SettingsStore → register_all → 失败回滚）
- `src-tauri/src/main.rs` ── 注册 shortcut_register 命令
- `src/settings/ShortcutInput.tsx` ── 录入：focus → keydown 捕获组合 → 格式化 "Cmd+Shift+K" → ipc.shortcuts.register；4 resp 分支 (ok/conflict/reserved/invalid-accelerator)；Reserved 配 [Override] 按钮走 window.confirm 二次确认（spec/07 § 2.3 简化版）
- `src/settings/SettingsModal.tsx` ── GroupShortcuts 接入 2 个 ShortcutInput（toggle / restore-last）+ 说明文案
- `src/ipc/commands.ts` ── shortcuts namespace（register/status/retry/openAccessibilitySettings）+ ShortcutAction + ShortcutRegisterResp 类型

#### M2-N4 wiring fix（之前 commit a5f2615 漏 wiring）

- `src/ipc/commands.ts` ── 补 ai.fix + AiFixReq/Resp + history.add wrappers（M2-N4 创建文件时 Edit 因 stale state 丢失）
- `src/shell/FloatingWindow.tsx` ── 补 activePane==='ai-fix' → AiFixPane 路由

#### M2-N4 · AI Fix DiffView UI（done · pending-user-verification）

- `package.json` ── `diff 7.0` + `@types/diff 7.0`
- `src/store/ai.ts` ── 4 态 zustand：idle / requesting / awaiting-decision / error；before/after/error 字段 + startFix/setSuccess/setError/reset
- `src/panes/diff.ts` ── computeDiff 走 `diffLines` 行级（spec/11 § 8.2）；输出 `{type: 'eq'|'add'|'del', text}[]`
- `src/panes/DiffView.tsx` ── unified diff 渲染：add 绿底 `+` / del 红底 `-` / eq 透明（spec/01 § 8 视觉）
- `src/panes/AiFixPane.tsx` ── orchestrator：mount 时 status===idle → 调 ai.fix（crypto.randomUUID + editor.error 注入）→ setSuccess / setError；DiffView + Accept (替换 editor + history.add op_type='ai-fix' + 切回 format tab) / Reject (reset + 切回)；错误分支文案分类（RateLimit / Http / Keychain / AiInvalidJson）
- `src/shell/FloatingWindow.tsx` ── 右侧条件：activePane==='ai-fix' 渲染 AiFixPane（之前是 Editor / Tree 路由）
- `src/ipc/commands.ts` ── `ai.fix(req)` + `history.add(content, opType)` 两个 IPC wrapper；AiFixReq + AiFixResp TS 类型
- `src-tauri/src/cmds/history.rs` ── `history_add` IPC 命令（State&lt;Db&gt; + State&lt;SettingsStore&gt; → spawn_blocking + h::add）；spec/02 § 6.1.2 扩展（spec 待追认）
- `src-tauri/src/main.rs` ── 注册 history_add 命令

关键决策：
- **AiFixPane mount 自动触发 fix**：用户切到 AI Fix tab 即开始；无显式"Fix" 按钮（spec/01 § 8 mockup 直接展示 DiffView）
- **crypto.randomUUID() 前端生成 requestId**：spec/11 § 5.2 幂等
- **错误文案前端 fallback 映射 4 类**：RateLimit/Http/Keychain/AiInvalidJson；其他 kind 透传
- **Accept 写 history(op_type='ai-fix')**：UPSERT 走 content_hash UNIQUE 自动去重；Reject 不写
- **行级 diff 而非字符级**：spec/11 § 8.2 v1 简化；M3-N1 polish 不引 Monaco-diff

待用户验证：粘非法 JSON → AI Fix tab → 点击 → loading → DeepSeek HTTP → DiffView → Accept 应用 + 历史多一条。

#### M2-N3 · DeepSeek client + extract_json（done · minimal · pending-user-verification）

- `src-tauri/Cargo.toml` ── reqwest 0.12 [json + rustls-tls, default-features=false] + uuid 1 [v4] + tokio 1 [time, macros]
- `src-tauri/src/ai/prompt.rs` ── system_prompt 5 条规则 (spec/11 § 4.2) + user_prompt 含 hint 注入；3 inline test
- `src-tauri/src/ai/validate.rs` ── extract_json 3-case fallback (pure JSON / markdown fenced / 文本夹缝)；5 inline test
- `src-tauri/src/ai/deepseek.rs` ── fix() 主流程：检查 ai_enabled → Keychain.get → reqwest POST 60s timeout → 状态码 429/5xx/200 分支 → choices[0].content → extract → serde from_str 二次验证 → AiFixResp。temperature=0 + response_format=json_object 双保险；max_tokens=clamp(input/3×2, 512, 8192)
- `src-tauri/src/cmds/ai.rs` ── ai_fix 命令真实化（接 SettingsStore State）
- `src-tauri/src/main.rs` ── mod ai + 注册 ai_fix 命令

关键决策：
- **rustls-tls 替代 native-tls**：spec/11 § 5 + spec/12 风险 5 避开 macOS 系统证书差异
- **M2-N3 minimal scope**：心跳 ai:progress event / 流式输出 / 重试 / DiffView UI 留 M2-N4 polish；当前主流程完整可用

待用户验证：粘真实 sk- key + ai_enabled=true + DevTools 调 ai_fix → 应回修复 JSON。

#### M2-N2 · API key Keychain（done · pending-user-verification）

- `src-tauri/Cargo.toml` ── macOS target 加 `security-framework = "3"`
- `src-tauri/src/store/keychain.rs` ── set / get(NoEntry → None) / delete(幂等) 3 方法；service=`com.jsonita.app`；macOS 走 security_framework::passwords，其他平台 stub
- `src-tauri/src/cmds/ai.rs` ── 4 命令：ai_set_api_key (Keychain) / ai_delete_api_key (幂等) / ai_test_connection (M2-N2 mock 验 sk- 前缀；M2-N3 起接 reqwest GET /v1/models) / ai_has_api_key (前端初始化查询)
- `src-tauri/src/cmds/mod.rs` ── re-export ai 模块
- `src-tauri/src/main.rs` ── 注册 4 个 ai 命令
- `src/settings/ApiKeyInput.tsx` ── input 不显示 raw key（type="password"）+ Test/Save/Remove 按钮 + ok/err msg；key 直接传 test 不先存 Keychain（避免污染）
- `src/settings/SettingsModal.tsx` ── AI 分组接 ApiKeyInput（modelId 由 SettingsModal 传入）
- `src/ipc/commands.ts` ── ai namespace 4 命令封装

关键决策：
- **不存 settings.json**：spec/10 § 6 I-4 凭证隔离；key 仅在 Keychain
- **test 用 input 现值而非 Keychain 已存值**：spec/11 § 9，避免"测试失败时已存 key 被覆盖"
- **service id `com.jsonita.app` 锁定**：与 tauri.conf identifier 一致；卸载时 `security delete-generic-password -s com.jsonita.app -a deepseek_api_key` 一行清

#### M2-N1 · 设置面板（done · minimal · pending-user-verification）

- `src-tauri/src/store/settings.rs` ── load(settings.json) → default 兜底；patch(shallow merge) → serde_json::Value 中转合并 → from_value 重构 Settings → 立即落盘；reset() 恢复 default + 落盘
- `src-tauri/src/cmds/settings.rs` ── 3 命令 settings_get_all (sync from State) / settings_set (patch + emit settings:changed) / settings_reset (default + emit)；spec/02 § 6.1.4
- `src-tauri/src/main.rs` ── invoke_handler 加 3 命令；setup 改 SettingsStore::load() 替代 ::new()
- `src/store/settings.ts` ── zustand slice + DEFAULT_SETTINGS（mirror Rust default）
- `src/settings/SettingsModal.tsx` ── 6 group nav + 4 group active：General (launchAtLogin/hideOnBlur/smartWidth/singlePaneMode/autoPasteClipboard 5 toggle) / AI (aiEnabled toggle + modelId input；M2-N2 加 API key) / History (historyLimit select) / JSON Transform (autoUnwrap + unwrapTimeoutMs + editorSoftWrap)；Shortcuts 留 M2-N5 占位；About 留 M3-N6 占位；Done/Reset 按钮；onChange 即时 settings_set
- `src/ipc/commands.ts` ── settings namespace (getAll / set / reset)
- `src/App.tsx` ── 接 SettingsModal

关键决策：
- **即时生效（onChange 立即 set）**：spec/04 § 4.6 "Done 仅关闭，每个变化 settings_set"；省 Apply 按钮
- **Settings 整体 emit settings:changed 而非 diff**：前端 zustand store 直接整体覆盖；保持简单
- **6 group 中 4 group 实施**：spec/04 全 6 group 设计；M2-N5（Shortcuts）+ M3-N6（About）各自补完
- **patch 走 serde_json::Value 中转**：shallow merge for扁平 settings 结构（spec/10 § 7.2）；M3 若加嵌套对象再升级 deep merge

---

### M1 实施期 · 0.4.0-m1 路线起手

#### M1 Phase 收口（agent-side 全完成 9/9 节点）

commit 列表（顺序）：

1. `feat(m1-n1): state management + ipc skeleton (21 stubs + typed wrappers)` 0b6b26b
2. `feat(m1-n2): json engine core (format/minify/unwrap/stringify) + 18 unit tests` 79f51a3
3. `feat(m1-n3): codemirror 6 integration (12 extensions + json highlight + design tokens)` e5a7da3
4. `feat(m1-n4): tab bar + status bar + dual-pane layout + debounced ipc` a2bfa09
5. `feat(m1-n5): tree view with react-json-view-lite + path utils` e6db660
6. `feat(m1-n6): sqlite store with history fts5 + r2d2 pool + migrations` f78ff53
7. `feat(m1-n7): session persistence + global hotkeys (⌘K / ⌘⇧L / Esc)` e5e8a74
8. `feat(m1-n8): integrate engine::unwrap into json_format via settings.auto_unwrap` 39b4b39
9. `feat(m1-n9): smart width 4-layer logic + window.json persistence + resized handler` b5c1fb2

待用户本机跑：pnpm install + cargo check + cargo test + pnpm tsc + pnpm tauri dev + M1-A1..A22 验收 + git tag 0.4.0-m1。

agent 已预切 active_phase=M2（manifest）不阻塞后续 M2 实施。

#### M1-N9 · 智能宽度 + soft-wrap（done · pending-user-verification）

- `src-tauri/src/store/window.rs` ── WindowStore + AtomicBool self_resizing + load/save window.json
- `src-tauri/src/cmds/window.rs` ── resize_for_content 4 层逻辑 (spec/06 § 7.1) + reset_size
- `src-tauri/src/window/mod.rs` ── Resized handler 加 mark_user_dragged（非 self_resizing 时）
- `src-tauri/src/main.rs` ── 注入 WindowStore::load()
- `src/hooks/useSmartWidth.ts` ── content 变 300ms debounce 算 ContentMetrics → win.resizeForContent
- `src/shell/FloatingWindow.tsx` ── useSmartWidth() 接入

ideal_w = clamp(chars×8+64, 720, min(1400, primary_screen×0.7))；4 层：userDragged 锁定 / softWrap 跳过 / settings.smartWidth false 跳过 / maxLineChars > 80 才扩。

#### M1-N8 · 嵌套 unwrap 集成（done · pending-user-verification）

- `src-tauri/src/types.rs` ── Settings struct + Default impl（17 字段 spec/13 § 3.3 全对齐）
- `src-tauri/src/store/settings.rs` ── SettingsStore Arc&lt;RwLock&lt;Settings&gt;&gt; + get / auto_unwrap / unwrap_timeout_ms 便捷访问；M2-N1 加 load/patch/persist
- `src-tauri/src/cmds/json.rs` ── json_format 接 State&lt;SettingsStore&gt;：先 unwrap (timeout=settings.unwrap_timeout_ms) 再 format；spec/09 § 8 组合
- `src-tauri/src/main.rs` ── setup 注入 SettingsStore::new()

#### M1-N7 · 会话保留 + ⌘⇧L + ⌘K（done · minimal · pending-user-verification）

- `src-tauri/src/cmds/session.rs` ── save/load/clear 3 命令真实化
- `src/hooks/useGlobalHotkeys.ts` ── ⌘K 清 + clearLast / ⌘⇧L loadLast / Esc + ⌘W win.hide()
- `src/hooks/useDebouncedTransform.ts` ── success 时 session.saveLast 持久化
- `src/App.tsx` ── useGlobalHotkeys()
- `package.json` ── react-hotkeys-hook 4.6

minimal 范围：完整 RestoreTimer 5min 窗口期 + window:shown 主动 restore 留 M2-N1。

#### M1-N6 · SQLite + 历史记录（done · pending-user-verification）

- `src-tauri/migrations/0001_init.sql` ── 5 表 schema：schema_version / app_meta / history（含 content_hash UNIQUE + idx_pinned_created / idx_starred）/ history_fts (FTS5 external content + unicode61 tokenizer + 3 trigger insert/delete/update) / last_session (CHECK id=1)
- `src-tauri/src/store/db.rs` ── r2d2 pool max_size=4 + WAL/synchronous=NORMAL/foreign_keys/busy_timeout PRAGMA；migrate() 读 schema_version → 顺序 apply 缺失 SQL；default_db_path() 走 dirs::data_dir() + Jsonita/history.db；From&lt;rusqlite::Error&gt; / r2d2::Error → JsonitaError::Sqlite
- `src-tauri/src/store/history.rs` ── add()（UPSERT 走 content_hash UNIQUE 去重 + 自动 trim 至 limit 条非 pinned/starred）；list()（onlyPinned/Starred 互斥 + 默认 pinned DESC, created_at DESC）；search()（FTS5 MATCH 包裹引号）；set_pinned / set_starred / clear（保留 pinned + starred）
- `src-tauri/src/store/session.rs` ── save (id=1 UPSERT) / load (QueryReturnedNoRows → None) / clear；M1-N7 起接入 RestoreTimer
- `src-tauri/src/cmds/history.rs` ── 5 命令替换 stub：从 State&lt;Db&gt; 拿 Db.clone() 进 spawn_blocking；加内部 helper `record(app, content, op)` 供 cmds/json.rs 写完操作后调（M1-N7 集成）
- `src-tauri/src/main.rs` ── setup 期间 store::Db::open(default_db_path()) → app.manage(db)；失败 log error 不阻塞启动
- `Cargo.toml` ── rusqlite 0.32 bundled (FTS5 自动) + r2d2 0.8 + r2d2_sqlite 0.25 + sha2 0.10 + hex 0.4

关键决策：
- **bundled 而非 system sqlite**：编译期嵌入 SQLite source，无 macOS 系统 sqlite 版本依赖；包尺寸 +1MB 可接受
- **UPSERT 去重而非"先 SELECT 再 INSERT"**：单 SQL 原子，避免竞态；spec/10 § 3 I-1 不变量
- **history.add() 不在 IPC handler 暴露**：只通过 `cmds::history::record(app, ...)` 内部调；前端 ops 写入历史的逻辑在 M1-N7 通过 hook 触发（避免每个 op 都加一个 IPC 命令）
- **M1-N6 暂不挂 record() 到 json 操作**：M1-N7 起在 useDebouncedTransform success 分支调；保 M1-N6 commit 范围聚焦

进度状态：M1-N6 `status: completed`；progress html 同步。

#### M1-N5 · TreeView + Path 复制（done · pending-user-verification）

- `src/tree/jsonpath.ts` ── `pathToString(path[])` 转 `$.user.items[0].name` 友好格式；`nodeCopyText(value)` 按类型计算剪贴板内容（spec/01 § 12 复制内容规则）；纯函数可单测
- `src/tree/TreeView.tsx` ── 包装 react-json-view-lite `<JsonView>` + `shouldExpandNode` 初始展开 2 层；样式经 CSS var 桥接（M3-N1 polish 时拆 jsonita-tree-* class）；click handler 占位（M3-N1 时挂 path 复制 + hover icon）
- `src/shell/FloatingWindow.tsx` ── `activePane === 'tree' && status === 'valid'` 时 `JSON.parse(outputText)` 喂 TreeView；其他 tab 仍走右侧 Editor
- `package.json` ── `react-json-view-lite 2.4`（轻量树视图 lib，spec/08 § 4.1 选型）

关键决策：
- **JSON.parse 在前端做而非新 IPC 命令**：outputText 已 valid（state == 'valid'），parse 失败可能性极低；新 IPC 增 invoke 往返成本
- **path 复制 + hover icon 延后 M3-N1**：M1-N5 先把树视图本身跑通；M3-N1 polish 时挂 click/hover handlers + Toast 反馈

进度状态：M1-N5 `status: completed`；progress html 同步。

#### M1-N4 · 布局 / Tab / StatusBar（done · pending-user-verification）

新增 / 修改文件：

- `src/store/ui.ts` ── UI zustand slice：activePane 6 值 + showAiFix bool + historyModalOpen + settingsModalOpen + 4 setters
- `src/hooks/useDebouncedTransform.ts` ── core data flow：editor content 变化 → setTimeout 300 ms → 调 json.format/minify/stringify/parse 按 activePane 路由 → 成功写 setOutput+setStatus('valid')+setShowAiFix(false)；Parse 错 → setStatus('error')+setError(line/col/msg)+setShowAiFix(true)；空 → setStatus('empty')；&gt; 5MB → setStatus('large') 不调 engine（spec/08 § 3.1）
- `src/shell/TabBar.tsx` ── 5 tab (format/minify/tree/jsonToStr/strToJson) + AI Fix 条件渲染（橙色 accent 色调，showAiFix=true 时出现）；active 用 primary-soft 背景；走 t() i18n（panes.tab.*）
- `src/shell/StatusBar.tsx` ── 4 态文案左侧（valid 绿圆点+lines+bytes / error 红色 Line X, Col Y / large 橙色 / empty 灰）+ 右侧 History / ⚙ 按钮（onClick 触发 setHistoryModalOpen / setSettingsModalOpen）
- `src/shell/FloatingWindow.tsx` ── TabBar + 双栏 CSS Grid (1fr 1fr) + StatusBar；左 Editor 接 content/setContent；右 Editor readOnly=true 显示 outputText；自动调 useDebouncedTransform()
- `src/App.tsx` ── 替换 PanelShell import 为 FloatingWindow
- 移除 `src/components/PanelShell.tsx` ── M0-N3 placeholder 完成使命，FloatingWindow 接管

关键决策：

- **双栏 CSS Grid `1fr 1fr`** 替代 SplitPane lib：M1-N4 静态 50/50，省 react-resizable-panels 依赖；M1-N9 智能宽度时若用户拖宽再加 ResizableHandle
- **debounce 在 hook 内而非 store**：editor onChange 直接调 setContent；hook 监听 content 变 + 自动 schedule 300ms timer + 调 IPC；store 保持纯净不持 timer state
- **2 个 Editor 实例**：左 input 可编辑 + 右 output readOnly；spec/00 § 2 内存预算 80 MB 紧但可接受；M3-N1 polish 时若超预算可改右侧为 `<pre>` 静态
- **AI Fix tab 视觉**：showAiFix=true 时出现在 tab 条最右（spacer 推过去）；颜色用 accent (橙)；active 时填充 accent + 白字
- **删除 PanelShell**：作为 M0-N3 placeholder 使命已完；FloatingWindow 是正式实现；diff 体现 M0→M1 演化
- **str-to-json tab 调 json.parse**：M1-N2 新增的命令（spec/02 § 6.1 待追认）派上用场

待用户本机验证：

- `pnpm tauri dev` 看：
  - 顶部 TabBar 5 个 tab（format 默认 active）
  - 中间双栏 input | output
  - 底部 StatusBar 显 "— Paste JSON to start"
  - 左栏粘 `{"a":1,"b":[1,2]}` → 300 ms 后右栏出现格式化输出 + StatusBar 切 "● Valid JSON · 5 lines · ..."
  - 切 Minify tab → 右栏变 single-line 压缩输出
  - 粘 `{a:1}` (非法) → StatusBar 红 + AI Fix tab 出现在右上
  - 点 History / ⚙ → 控制台看不到 Modal（M2-N1 才有 Modal 实现）

进度状态：

- `progress/manifest.json` M1-N4 `status: completed`
- `progress/02_m1_core_json.html#m1-n4-layout` status: `done · pending-user-verification`

#### M1-N3 · CodeMirror 6 集成（done · pending-user-verification）

新增 / 修改文件：

- `src/styles/tokens.css` ── spec/03 完整设计令牌 light + dark：4 组颜色（品牌 / 中性 / 状态 / JSON+editor）+ 字体栈（mono 含 PingFang SC / Microsoft YaHei UI 末尾防 CJK 方框）+ 字号 6 档 + 间距 8 档 + 圆角 + 阴影 + 动效 + Z-index；含 `[data-theme="dark"]` 覆盖（M3-N1 加切换机制）+ `@media (prefers-reduced-motion: reduce)` 动画归零（a11y）
- `src/styles/global.css` ── html/body 透明（NSPanel 兼容）+ 字体 / 颜色继承 tokens + `<kbd>` 通用样式
- `src/editor/highlight.ts` ── `HighlightStyle.define` 6 类 tag（propertyName/string/number/bool/null/punc）→ CSS variables 让 data-theme 切换自动应用
- `src/editor/theme.ts` ── `EditorView.theme(sharedSpec, { dark: ... })`：全走 CSS vars；&amp;/cm-content/cursor/selection/gutters/activeLine/foldPlaceholder/matchingBracket/searchMatch/lintRange-error/tooltip-lint 全覆盖；输出 jsonitaLightTheme + jsonitaDarkTheme 双 instance
- `src/editor/extensions.ts` ── `makeExtensions(cfg)` 装 12 项标配（lineNumbers / highlightActiveLine+Gutter / foldGutter+codeFolding / bracketMatching / closeBrackets / history / drawSelection / highlightSelectionMatches / indentationMarkers / allowMultipleSelections / lineWrapping / json+jsonParseLinter+lintGutter / syntaxHighlighting+jsonitaJsonHighlight / theme / placeholder / keymap）；可选 cfg: theme / readOnly / softWrap / placeholderText
- `src/editor/Editor.tsx` ── React 包装：useRef + EditorView 单次 init（strict mode 友好）；theme/config 变化时重建 instance；外部 setValue 走 dispatch(changes) 保留 undo 历史
- `src/editor/lint.ts` ── 外部 linter 入口：`externalErrorAsDiagnostic(doc, err)` 把 Rust 端返回的 line/col/msg 转 CM Diagnostic（spec/08 § 2.2 合并策略；M1-N4 store/editor.error 字段挂上）
- `src/components/PanelShell.tsx` ── 替换 placeholder text 为内嵌 Editor 实例 + useEditorStore binding（content + setContent）+ `placeholderText={t('empty.title')}`（i18n）
- `src/main.tsx` ── import './styles/tokens.css' + './styles/global.css'（顺序：tokens 先于 global 让 var() 可解析）
- `package.json` ── 10 个 CodeMirror v6 包 + `@lezer/highlight 1.2` + `@uiw/codemirror-extensions-indentation-markers 4.23`

关键决策：

- **设计令牌一次性铺全**（不只放 M1-N3 用的）：tokens.css 覆盖 spec/03 全部域；M3-N1 起加切换机制（matchMedia / settings.theme 三数据源）；当前 light 默认，dark 通过手动 `<html data-theme="dark">` 可即时预览
- **theme 用 CSS variables 而非 hex hardcode**：未来主题切换零代码改动；React 部分只需 set `document.documentElement.dataset.theme = 'dark'`
- **shared spec + dark: true/false flag 双 instance**：CM6 内部 highlightStyle 需要知道 dark/light（影响默认 fallback 颜色）；我们的 highlight 走 CSS vars 不依赖 dark flag，但仍保留两 instance 让 CM 内部对齐
- **placeholder 走 i18n**：通过 `placeholderText` prop 传入；CodeMirror placeholder extension 接受字符串，不直接支持响应式 ── 当前 mount 时一次性传，M3-N1 i18n 切语言时重建 instance 即可（已锁 theme 变 reload）
- **lint.ts 暴露 `externalLinter(getError)` 工厂**：M1-N4 store/editor 加 error 字段后挂上；当前不在 extensions 里加，避免空 getter 调用噪音

待用户本机验证：

- `pnpm install`（10 个 CM 包 + lezer + uiw ≈ 4 MB 安装）
- `pnpm tsc --noEmit` 0 错
- `pnpm tauri dev` 启动 → 浮窗内 Editor 可输入；输入 `{"a":1,"b":[1,2]}` 看 JSON 高亮按 spec/03 § 4.4 token 颜色（key 蓝 / string 绿 / number 深蓝 / bool 紫 / null 灰 / punc 中性）
- 测 12 项扩展：行号 left gutter 显示 / 输入 `{` 自动补 `}` / `⌘F` 弹搜索 / `⌘Z` 撤销 / 输入非法 JSON 看红波浪 + lint tooltip
- DevTools 改 `document.documentElement.dataset.theme = 'dark'` → CSS 变量切换 dark 配色立即生效（编辑器内部需要重建 instance，M3-N1 加 Compartment 后热切）

进度状态：

- `progress/manifest.json` M1-N3 `status: completed`
- `progress/02_m1_core_json.html#m1-n3-codemirror` status: `done · pending-user-verification`

#### M1-N2 · JSON 引擎核心（done · pending-user-verification）

新增 / 修改文件：

- `src-tauri/src/engine/mod.rs` ── re-exports 4 子模块
- `src-tauri/src/engine/error_loc.rs` ── `serde_json::Error → JsonitaError::Parse`（line/col 1-indexed，spec/09 § 5.2）+ `polish()` 5 类错误文案润色（key must be string / trailing comma / unterminated string / 等）
- `src-tauri/src/engine/json.rs` ── `format(text, opts)` 走 Value 中转 + PrettyFormatter::with_indent + sort_keys_recursive 递归 IndexMap 重建（preserve_order 必开）；`minify(text)` 走 to_string；8 单测覆盖 basic / preserve order / sort / nested sort / trailing newline / minify / parse error line+col
- `src-tauri/src/engine/unwrap.rs` ── `unwrap(text, opts)` walk Value 树（spec/09 § 6.3 ~20 行核心）：遇 String + parse 成 object/array 即解开；纯数字 / bool / null 字符串保留；Instant deadline 每层入口检查；6 单测覆盖 single / double nested / array / non-json string / numeric string / max_depth=1
- `src-tauri/src/engine/stringify.rs` ── `json_to_string(text, opts)` 包裹 quote + 转义（含可选 unicode escape \\uXXXX UTF-16 surrogate pair）；`string_to_json(text)` 容忍有无 outer quotes + unescape ~15 行（含 \\u4-hex）；4 单测含 plan/01 F3.2 "4 层嵌套转义往返一致" fixture
- `src-tauri/src/cmds/json.rs` ── 4 命令替换 stub 为 `spawn_blocking(move || engine::*::...)`（不阻塞 main 进程，spec/00 § 3 不变量 I-4）；新增 `json_parse` 命令（string → JSON 反向）
- `src-tauri/src/main.rs` ── `mod engine;` + invoke_handler 加 json_parse
- `src-tauri/Cargo.toml` ── `serde_json = { version = "1", features = ["preserve_order"] }`（关键！默认 BTreeMap 会丢用户输入 key 顺序）
- `src/ipc/commands.ts` ── `json.parse(text)` 暴露给前端

关键决策：

- **preserve_order feature 开启**：spec/09 § 2 锁定 ── 用户输入 key 顺序保留是"所见即所得"工具的基本契约
- **sort_keys 手写递归而非 BTreeMap**：preserve_order 用 IndexMap 替代 BTreeMap，得手写排序；spec/09 § 4.2 ~12 行核心
- **`spawn_blocking` 用于所有 4 个命令**：format / minify / unwrap / stringify 都是 CPU 密集；100KB 输入可能 ~50ms 阻塞 ── 必须放 blocking pool（spec/09 § 8）
- **`json_parse` 新增命令**：spec/02 § 6.1 列了 json_stringify（JSON → String）但未列反向；M1-N2 加 json_parse 让 →JSON tab 可用，留 spec 后续追认（spec/02 § 6.1.1 IPC 表）
- **18 个 inline unit test**：分布 8 (json) + 6 (unwrap) + 4 (stringify)；走 `cargo test --manifest-path src-tauri/Cargo.toml` 可独立跑（无 Tauri runtime 需要），CLAUDE.md § 7.1 核心边界覆盖率达标
- **错误文案 polish() 仅 5 类已知 case**：其余 raw 透传；M3-N3 polish 时若发现更多 case 再加（保 KISS）

待用户本机验证：

- `cargo test --manifest-path src-tauri/Cargo.toml` ── 18 测试全 pass
- 启动后 DevTools `invoke('json_format', { text: '{"z":1,"a":2}', opts: {indent: 'spaces2', sortKeys: true } })` 应回包含 `"a": 2` 在 `"z": 1` 之前的字符串
- 输入非法 JSON 应回 `{kind: 'Parse', data: { line: N, col: N, msg: '...' }}`

进度状态：

- `progress/manifest.json` M1-N2 `status: completed`
- `progress/02_m1_core_json.html#m1-n2-engine` status: `done · pending-user-verification`

#### M1-N1 · 状态管理 + IPC 骨架（done · pending-user-verification）

Rust 端（8 个新文件）：

- `src-tauri/src/error.rs` ── `JsonitaError` 8 变体（Parse / UnwrapTimeout / Sqlite / Keychain / Http / AiInvalidJson / RateLimit / Io），`#[serde(tag="kind", content="data")]` 跨 IPC 序列化；From&lt;std::io::Error&gt; + From&lt;tauri::Error&gt;（其他 crate-specific From 在引入时加）；spec/13 § 1.1 对齐
- `src-tauri/src/types.rs` ── 8 enum（IndentMode / QuoteStyle / OpType / ThemeMode / RestoreWindow / ShortcutAction / InitialWidth / ShowSource，全 `rename_all="kebab-case"`）+ 11 个 IPC payload struct（FormatOpts / UnwrapOpts / StringifyOpts / HistoryRow / ListOpts / LastSession / WindowShown / ClipboardSniff / ContentMetrics / WindowResizedPayload + 各 default helper），全 `rename_all="camelCase"`；spec/13 § 2-3 对齐
- `src-tauri/src/cmds/mod.rs` ── re-exports
- `src-tauri/src/cmds/json.rs` ── 4 stubs（json_format / json_minify / json_unwrap_stringified / json_stringify）返回 input unchanged 作 mock；M1-N2 起接 engine::*
- `src-tauri/src/cmds/history.rs` ── 5 stubs（list/search/pin/star/clear）返回 Vec::new()/Ok(())；M1-N6 起接 rusqlite
- `src-tauri/src/cmds/session.rs` ── 3 stubs（save_last/load_last/clear_last）返回 None/Ok(())；M1-N7 起接 SQLite + RestoreTimer
- `src-tauri/src/cmds/window.rs` ── 5 命令（show/hide/toggle 接 M0-N3 既有 window 模块；resize_for_content 返 mock (860,560)；reset_size Ok(())）；M1-N9 起替换智能宽度真实算法
- `src-tauri/src/cmds/system.rs` ── 4 命令（clipboard_read 返空 sniff；open_log_dir + open_db_path 调 `open` 命令打开 Finder；quit_app 调 app.exit(0)）

Rust 入口：

- `src-tauri/src/main.rs` ── invoke_handler 注册 21 个 stubs + 3 个 M0-N4 既有命令；setup hook 等保持不变
- `src-tauri/Cargo.toml` ── 加 `thiserror = "1"`（JsonitaError 实现）

TS 端（8 个新文件）：

- `src/types/error.ts` ── `JsonitaError` discriminated union + `isJsonitaError` type guard
- `src/types/enums.ts` ── 8 enum 字面量类型镜像
- `src/types/commands.ts` ── 11 个 interface 镜像（含 default `?` 字段对应 Rust `#[serde(default)]`）
- `src/types/events.ts` ── EventMap 类型表（含 M0-N2 既有 `tray:toggle` + M0-N4 `permission:accessibility_missing`）
- `src/ipc/error.ts` ── re-export type guard
- `src/ipc/commands.ts` ── 5 个 namespace 对象（json/history/session/win/system）封装 typed invoke
- `src/ipc/events.ts` ── 泛型 `on<K>(name, handler)` typed listen 封装（spec/02 § 7.1）
- `src/store/editor.ts` ── zustand slice 起步：content/outputText/status/error/bytes/lines + 5 actions；ui/history/session slice 留 M1-N4+ 加

依赖：

- `package.json` ── 加 `zustand = "^5.0.1"`

关键决策：

- **stubs 全 mock 返回**（input unchanged / empty vec / None）：让 M1-N3 起前端 UI 能独立开发；M1-N2..N9 增量替换真实实现
- **window stubs 接入 M0-N3 既有 window 模块**：避免重复实现 show/hide/toggle
- **`#[serde(rename_all = "camelCase")]` 在 struct 级**：Rust snake_case ↔ TS camelCase 自动转换（spec/13 § 7）
- **`#[serde(default)]` 大量使用**：让前端可省略可选字段（如 sortKeys/trailingNewline/onlyPinned）
- **JsonitaError 的 RateLimit 单 variant 加 `#[serde(rename_all = "camelCase")]`**：retry_after_sec → retryAfterSec 同步 TS 类型
- **store 仅 editor slice 先做**：M1-N4 布局起手时再加 ui slice；M1-N6 起 history slice；M1-N7 起 session slice ── 减少 M1-N1 文件吞吐

待用户本机验证：

- `pnpm install`（首次会同时装 zustand）
- `cargo check --manifest-path src-tauri/Cargo.toml` 0 错
- `pnpm tsc --noEmit` 0 错（含跨进程类型 mirror）
- DevTools console 调任意 stub：<code>invoke('json_format', { text: '{}', opts: { indent: 'spaces2' } })</code> 应回 <code>'{}'</code>

进度状态：

- `progress/manifest.json` M1-N1 `status: completed`
- `progress/02_m1_core_json.html#m1-n1-store-ipc` status: `done · pending-user-verification`

---

### M0 实施期 · 0.3.0-m0 路线开工

#### M0 Phase 收口（agent-side 全完成）

7 节点 commit 列表（顺序串）：

1. `feat(m0-n1): bootstrap tauri 2.x scaffold (react+ts+vite)` ── Tauri 2 + React 18 + TS 5 + Vite 5 工程
2. `feat(m0-n2): menubar tray + template icons + accessory dock policy` ── 22pt@2x template + Accessory dock
3. `feat(m0-n3): nspanel-like floating window (cocoa unsafe)` ── NSPanel promote + 多屏定位 + close/blur 路由
4. `feat(m0-n4): global shortcut + accessibility guide modal` ── ⌘⇧J + 权限引导 + 2s 轮询 retry
5. `feat(m0-n5): tracing + daily rolling + redact layer` ── ~/Library/Logs/Jsonita/jsonita.*.log + 0600 + 7d purge
6. `feat(m0-n6): react-i18next + 7 namespaces (en-US only)` ── 7 namespace + locale 检测 + lang attr 同步
7. `chore(m0-n7): local dmg build + ci skeleton` ── bundle 完整 + entitlements + GitHub Actions yml

**M0 收口决策（agent vs user）**：

- agent 已做：所有代码 + 配置 + 进度同步 + commit。
- 用户待跑（CLAUDE.md § 2.3 禁 agent 替跑 install / build）：
  1. `rustup target add x86_64-apple-darwin aarch64-apple-darwin`
  2. `pnpm install` → 生成 `pnpm-lock.yaml`（需提交）
  3. `cargo check --manifest-path src-tauri/Cargo.toml` → 生成 `src-tauri/Cargo.lock`（需提交，.gitignore 已加 `!src-tauri/Cargo.lock` 例外）
  4. `pnpm tauri dev` → 单点验 M0-A4/A6/A7/A8/A9/A10/A11/A12/A13
  5. `pnpm tauri build --target universal-apple-darwin` → dmg 出炉
  6. `du -h ...dmg` → 验 &lt; 15 MB（NFR § 6）
  7. 双击 dmg + 拖到 Applications + 右键打开过 Gatekeeper → 跑全 M0-A1..A13
  8. 全过 → `git tag 0.3.0-m0`（agent 不主动 tag）
  9. `git push` + `git push --tags`（agent 不主动 push）

**为不阻塞 M1 实施 → agent 预切 active_phase=M1**（progress/manifest.json）。用户跑完 M0 验收前可<b>随时</b>回 M0 节点修 bug；M1 工作期间发现 M0 问题须 § 6.4 双向同步回 M0。

---

#### M0-N7 · dmg 本地构建 + CI 雏形（done · pending-user-verification）

新增 / 修改文件：

- `src-tauri/tauri.conf.json` ── 完整 bundle 段：icon 7 档（icns + ico + 5 PNG）/ resources `../assets/icons/menubar/**` / macOS{minimumSystemVersion=11.0 / frameworks=[] / exceptionDomain=api.deepseek.com / signingIdentity=null（M2-N6 装）/ entitlements=entitlements.plist / dmg windowSize + appPosition + applicationFolderPosition}
- `src-tauri/entitlements.plist` ── 4 个关键 key：`network.client=true`（DeepSeek M2 起需要）/ `automation.apple-events=false` / `cs.allow-jit=false` / `cs.allow-unsigned-executable-memory=false` / `cs.disable-library-validation=false`（Hardened Runtime 准备，M2-N6 公证要求）
- `.github/workflows/ci.yml` ── 3 step on macos-14：pnpm tsc --noEmit + cargo test + cargo build --release；含 Rust cache + pnpm cache + universal target preinstall；timeout 30 min；签名 secrets 留 M2-N6 release workflow

关键决策：

- **不加 ESLint / pnpm lint step**：lint 配置 + 规则磨合留 M1-N1；CI 雏形先三项绿
- **dmg 命名走 Tauri 默认 `Jsonita_<version>_universal.dmg`**：不改默认（影响后续 D-N1 brew formula + D-N3 updater latest.json 都依赖此命名）
- **`signingIdentity: null`**：M0 不签名（M2-N6 改 env `TAURI_SIGNING_IDENTITY`）；首次启动会触发 Gatekeeper（用户右键打开放行）
- **`exceptionDomain: api.deepseek.com`**：App Transport Security 例外，M2-N3 起 HTTP 请求 DeepSeek 需要；M0 阶段无害
- **CI 用 `--frozen-lockfile`**：要求用户先本机 `pnpm install` 生成 lockfile 并 commit；不允许 CI 自由解析依赖

待用户本机验证（M0 完整退出条件）：

- 见上方 M0 Phase 收口 § "用户待跑" 1-9 步

进度状态：

- `progress/manifest.json` M0-N7 `status: completed` · M0 phase `status: completed` · active_phase=`M1` · M1 phase `status: active`
- `progress/01_m0_skeleton.html#m0-n7-dmg` status: `done · pending-user-verification`；顶部 callout 切 `completed · pending-user-verification`
- `progress/02_m1_core_json.html` 顶部 callout 切 `active`

#### M0-N6 · i18n 框架（react-i18next）（done · pending-user-verification）

新增 / 修改文件：

- `package.json` ── 加 `i18next 23.16` / `react-i18next 15.1` / `i18next-browser-languagedetector 8.0`
- `src/i18n/index.ts` ── `initI18n()` async：装 LanguageDetector + initReactI18next + 7 namespace 静态 import；resources = en-US 全套；fallbackLng=en-US；supportedLngs=['en-US']（v1 仅；M3-N2 加 zh-CN）；detection 走 localStorage(`jsonita.locale`) → navigator → en-US；监听 `languageChanged` event 同步 `document.documentElement.lang`
- `src/i18n/types.ts` ── `declare module 'react-i18next'` 类型增强：基于 en-US 资源推 `CustomTypeOptions.resources`；让 `t('errors.parse.title')` 有 IDE 补全 + 编译期 key 校验
- `src/locales/en-US/shell.json` ── tray menu labels + statusBar valid/empty
- `src/locales/en-US/panes.json` ── empty.title + 6 个 tab labels（Format/Minify/Tree/→Str/→JSON/AI Fix）
- `src/locales/en-US/settings.json` ── M0 仅 title + 6 group 名（M2-N1 补全）
- `src/locales/en-US/history.json` ── title + search placeholder + 3 filter chips + empty
- `src/locales/en-US/errors.json` ── 4 个 kind 起点（accessibilityRequired / parse / rateLimit / aiInvalidJson；插值 {{key}}/{{line}}/{{col}}/{{sec}}）
- `src/locales/en-US/about.json` ── M0 占位（version 插值 + openLogDir 按钮）
- `src/locales/en-US/common.json` ── 7 个通用按钮（ok/cancel/save/done/later/retry/openSystemSettings）
- `src/main.tsx` ── `await initI18n()` before `createRoot(...).render()`，避免首屏 raw key 闪
- `src/components/PanelShell.tsx` ── 改 `useTranslation('panes')`，hardcode "Paste JSON to start" → `t('empty.title')`
- `src/permissions/AccessibilityModal.tsx` ── 改 `useTranslation('errors')` + `'common'`，所有 hardcode 英文 → `t()`；`{{key}}` 插值传 `⌘⇧J`

关键决策：

- **静态 import 而非 lazy import**：M0 单 locale + 7 文件 &lt; 5 KB，lazy 收益不抵复杂度；M3-N2 zh-CN 双语后再 lazy
- **`document.documentElement.lang` 同步**：spec/14 § 9 a11y "语言声明" 必需，screen reader 读对语言
- **`supportedLngs: ['en-US']` 锁死 v1**：navigator zh-CN 仍 fallback en-US，避免不完整翻译
- **`escapeValue: false`**：React 自动 escape，i18next 别再 escape 一次
- **tray menu 仍 Rust 端硬编码英文**：M0-N6 只 cover React-side（spec/14 § 2 边界）；tray menu localize 留 M3-N2 时设计跨进程 locale 传递
- **resources 类型增强基于 en-US 推**：所有翻译文件结构必须严格对齐 en-US（M3-N2 zh-CN 复制后改值即可，路径 / key 不变）

待用户本机验证：

- M0-A13 ── `grep -rE '"[A-Z][a-z]+ [A-Z][a-z]+"' src/ --include="*.tsx" --include="*.ts" | grep -v src/locales | grep -v src/i18n` → 0 命中
- `pnpm tsc --noEmit` → 0 错（含 `t('key')` 自动补全 + 编译期 key 校验）
- `pnpm tauri dev` → DevTools console: `i18next.languages === ['en-US']` + `document.documentElement.lang === 'en-US'`
- Modal 文案与 PanelShell empty state 全部从 JSON 来

进度状态：

- `progress/manifest.json` M0-N6 `status: completed`
- `progress/01_m0_skeleton.html#m0-n6-i18n` status: `done · pending-user-verification`

#### M0-N5 · 日志框架（tracing）（done · pending-user-verification）

新增 / 修改文件：

- `src-tauri/src/logging/mod.rs` ── `init()` 函数串：(1) `unsafe libc::umask(0o077)` 强制新文件 0600（spec/15 § 6 权限要求）→ (2) 解析 log_dir（macOS `~/Library/Logs/Jsonita/`；其他 `~/.local/share/Jsonita/logs/`）→ (3) `create_dir_all` → (4) 7 日 purge（启动时清 mtime &lt; 7d 的旧文件）→ (5) `set_permissions(0o600)` chmod 已存在文件（umask 不影响）→ (6) `RollingFileAppender::builder()` daily rotation + prefix=jsonita + suffix=log → (7) `tracing_subscriber::registry().with(env_filter).with(RedactLayer).with(fmt_layer.json())` 装链 → (8) return `WorkerGuard` 让 main bind 防 drop
- `src-tauri/src/logging/redact.rs` ── `RedactLayer` 实现 `Layer<S>` trait；M0 placeholder 不做变换；M2-N3 接 API key 时填 DENY / HASH 列表（spec/15 § 7.3 RedactLayer 核心 ~20 行）
- `src-tauri/src/main.rs` ── `let _log_guard = logging::init();` 头一行；`tracing::info!(version, os, arch, "app.start")` 第一条事件；shortcuts 注册成功 / 失败也都走 tracing
- `src-tauri/Cargo.toml` ── 加 tracing 0.1 / tracing-subscriber 0.3 [env-filter+json] / tracing-appender 0.2 / dirs 5；新 `[target.'cfg(unix)']` 段加 libc 0.2
- `src/services/logger.ts` ── 前端日志薄封装：4 级（error/warn/info/debug）+ target + event + fields；M0 仅 `console.*`；M1 起加 `invoke('log_write', ...)` 转发到 Rust 合流

关键决策：

- **umask 0077 而非 OpenOptions::mode**：tracing-appender 内部 file open 不暴露 mode；改在进程级 umask 全局生效（影响所有后续 file 创建，包括 rotate 新文件）
- **JSON Lines 字段轻微偏离 spec/15 § 5.1**：tracing-subscriber 默认字段 `timestamp/level/target/message` 而非 spec 期望的 `ts/level/target/event`；功能等价，可读性可接受；M2 起若需严格对齐再换自定义 formatter
- **`jsonita.YYYY-MM-DD.log` 而非 `jsonita-YYYY-MM-DD.log`**：tracing-appender 0.2 Builder 用 `.` 作 prefix/suffix 分隔符；微调名称与 spec/15 § 6 略差异 ── 无功能影响
- **5 MB 单文件分片留 M1**：tracing-appender 0.2 不内置 size-based rotation；M0 暂仅 daily（spec/15 § 6 提了 5MB 上限 → 极端场景 ── M1 加自定义 wrap）
- **RedactLayer M0 空规则**：占位安装在 subscriber chain；M2-N3 引入 API key 时填 DENY/HASH 名单（spec/15 § 7.3 核心 ~20 行）

待用户本机验证：

- M0-A11 ── `ls -l ~/Library/Logs/Jsonita/` 应见 `jsonita.YYYY-MM-DD.log` + 权限 `-rw-------` (0600)
- M0-A12 ── `tail -n 1 ~/Library/Logs/Jsonita/jsonita.*.log` 应见 JSON Lines 含 `"level":"INFO"` + `"message":"app.start"` + `"version":"0.3.0-m0"`
- 临时开 DEBUG：`RUST_LOG=jsonita=debug pnpm tauri dev` 然后 grep `"level":"DEBUG"` 应有命中

进度状态：

- `progress/manifest.json` M0-N5 `status: completed`
- `progress/01_m0_skeleton.html#m0-n5-logging` status: `done · pending-user-verification`

#### M0-N4 · 全局快捷键 + 权限引导（done · pending-user-verification）

新增 / 修改文件：

- `src-tauri/src/shortcuts/mod.rs` ── 全局快捷键：硬编码 ⌘⇧J（macOS）/ Ctrl⇧J（其他）→ `window::toggle`；权限缺失走 emit `permission:accessibility_missing` event；3 个 IPC 命令暴露给前端：`shortcut_status`（查注册状态）/ `shortcut_retry`（重试，用户授权后调）/ `open_accessibility_settings`（macOS 跳系统设置 → 隐私 → 辅助功能）
- `src-tauri/src/main.rs` ── 注册 plugin + invoke_handler 3 命令；setup hook 调 `shortcuts::register_defaults` ── 失败不阻塞启动（事件 + 前端 Modal 兜底）
- `src-tauri/Cargo.toml` ── 加 `tauri-plugin-global-shortcut = "2"`
- `src-tauri/capabilities/default.json` ── 加 `global-shortcut:default` 权限
- `src/permissions/AccessibilityModal.tsx` ── macOS 权限引导 Modal：视觉对齐 spec/01 § 9（⌨️ icon + title + 文案 + Later/Open System Settings 二按钮）；文案<b>暂硬编码英文</b>，M0-N6 i18n 接入后改 `t()`
- `src/App.tsx` ── 三层防护：(a) mount 调 `shortcut_status` 决定要不要弹 Modal；(b) listen `permission:accessibility_missing` event 应对 Rust 启动期的 emit；(c) Modal 打开期间每 2 s 调 `shortcut_retry` 自动检测用户是否已授权 → 成功后自动 close（满足 M0-A10 "授权后无需重启"）

关键决策：

- **3 IPC 命令命名**：`shortcut_status` / `shortcut_retry` / `open_accessibility_settings`（spec/02 § 4 snake_case 规范）
- **失败不阻塞启动**：macOS 首次启动 Accessibility 必缺；用 `eprintln!` 记日志 + emit event + 不 panic
- **2 s 周期轮询而非用户点 Retry**：UX 更自然（用户从设置回来 Modal 自动消失）；2s 间隔对 CPU/资源压力小
- **Modal 文案先英文**：M0-N6 i18n 框架装好后才上 `useTranslation`；本节避免循环依赖（N4 不能 import N6）

待用户本机验证：

- M0-A9 ── 系统设置 → 隐私与安全 → 辅助功能 → 移除 Jsonita（如有），启动 Jsonita 看 Modal 自动弹
- M0-A10 ── 点 "Open System Settings" 跳到正确页 → 添加 Jsonita 授权 → 回 Jsonita，<b>不重启</b>，2s 内 Modal 自动关 + ⌘⇧J 可呼出
- 测多个前台 App（Safari / 终端 / Finder）下 ⌘⇧J 都能呼出

进度状态：

- `progress/manifest.json` M0-N4 `status: completed`
- `progress/01_m0_skeleton.html#m0-n4-shortcut` status: `done · pending-user-verification`

#### M0-N3 · 浮窗 POC（NSPanel-like 行为）（done · pending-user-verification）

新增 / 修改文件：

- `src-tauri/src/window/mod.rs` ── window runtime 入口：`setup()`（启动调一次，promote + 装事件钩子）/ `toggle()`（由 tray:toggle 与 M0-N4 全局快捷键调）；合并 `CloseRequested` + `Focused(false)` 进单 callback（spec/06 § 4-5 状态机）
- `src-tauri/src/window/nspanel.rs` ── cocoa `unsafe` 升级 NSWindow → NSPanel：styleMask（titled + fullSizeContentView + <b>nonactivatingPanel</b>）/ collectionBehavior（canJoinAllSpaces + stationary + <b>fullScreenAuxiliary</b>）/ level=3（floating）；全 `#[cfg(target_os = "macos")]` 包（spec/06 § 3.1 标志位表对齐）
- `src-tauri/src/window/locate.rs` ── 多屏定位：`cursor_position` → 找鼠标所在 monitor → 水平居中 + 垂直上 1/3；fallback primary monitor；统一用 `PhysicalPosition` 避免 scale_factor 错位（spec/06 § 4 算法）
- `src-tauri/src/main.rs` ── setup hook 串：activation policy → menubar::build → window::setup → `app.listen("tray:toggle", ...)`；M0-N2 emit 的事件这里 close loop
- `src-tauri/Cargo.toml` ── 加 `[target.'cfg(target_os = "macos")'.dependencies]`：`cocoa = "0.26"` + `objc = "0.2"`（仅 macOS）
- `src-tauri/tauri.conf.json` ── window 字段更新：`visible: false`（预建隐藏）/ `focus: false`（不抢焦点）/ `decorations: false` / `transparent: true` / `alwaysOnTop: true` / `titleBarStyle: "Overlay"` / `hiddenTitle: true` / `acceptFirstMouse: true` / `app.macOSPrivateApi: true`（spec/06 § 9 tauri.conf 关键字段表）
- `src/components/PanelShell.tsx` ── 浮窗 placeholder：`rgba(255,255,255,0.96)` 半透明 + `backdrop-filter: blur(20px)` + 圆角 10 + `box-shadow` 大阴影；显示 `{ }` + "Paste JSON to start"（spec/01 § 10.1 Empty State 视觉锚）
- `src/App.tsx` ── 替换 M0-N1 占位为 `<PanelShell />`
- `src/index.html` ── `<style>` 加 `html, body { background: transparent; }` 让 NSPanel 真透明（M0-N1 文件向 M0-N3 扩展，必要基础设施）

关键决策：

- **cocoa 直接调而非 plugin**：NSPanel 非 Tauri 默认行为，必须 unsafe cocoa 调用；spec/06 § 3.2 决策已锁
- **合并 close + blur 钩子单 callback**：`on_window_event` 只接收最后一次注册的 callback，必须合并（Tauri 2.x API 行为）
- **PhysicalPosition 统一**：cursor_position + monitor.position 都是 physical，避开 scale_factor 转换错位
- **expect 而非 Result<Error>**：tauri::Error enum 变体不稳定，主窗口缺失是 setup bug 不是 runtime → panic 即可
- **`backdrop-filter: blur(20px)`**：macOS Vibrancy 风格的快速实现（M3-N1 主题打磨时换正式 token）

待用户本机验证（M0-A4/A6/A7/A8 4 个用例）：

- M0-A4 ── Safari 前台时按 ⌘⇧J（M0-N4 装好后），浮窗弹出 Safari 仍前台
- M0-A6 ── 点 Safari 任意位置，浮窗自动消失
- M0-A7 ── Safari 全屏下按 ⌘⇧J，浮窗仍可见在 fullscreen 之上
- M0-A8 ── 鼠标在外接屏按 ⌘⇧J，浮窗出现在外接屏

进度状态：

- `progress/manifest.json` M0-N3 `status: completed`
- `progress/01_m0_skeleton.html#m0-n3-nspanel` status: `done · pending-user-verification`

#### M0-N2 · 菜单栏 tray + 图标（done · pending-user-verification）

新增 / 修改文件：

- `src-tauri/src/menubar/mod.rs` ── tray 模块：`TrayIconBuilder` + 原生 NSMenu（3 项：Toggle / Settings disabled / Quit ⌘Q）+ 左键事件 emit `tray:toggle`（M0-N3 起监听）；icon 用 `include_bytes!` 嵌入 `jsonita-menubar-template-22@2x.png` 避开 resource 解析复杂度（spec/05 § 4.2 Option A：22pt@2x 单档兜底）
- `src-tauri/src/main.rs` ── 接入 setup hook：调 `menubar::build(app.handle())`；macOS 设 `ActivationPolicy::Accessory` 隐藏 Dock 图标（spec/07 § 1.4 等效 LSUIElement）
- `src-tauri/Cargo.toml` ── tauri features 增 `tray-icon`

关键决策：

- **icon 走 include_bytes! 而非 resource**：避免 M0-N7 dmg bundle 时再调试 resource 路径；编译期嵌入，dev + prod 一致；spec/05 § 4.2 Option A 的简化版
- **`ActivationPolicy::Accessory` 替代 Info.plist LSUIElement**：Rust 端动态调用，无需 Info.plist patch；spec/07 § 1.4 行为等效
- **Settings 菜单项 disabled**：M2-N1 启用；M0 阶段留位避免菜单结构后续大改（spec/07 § 1.1 menu 序锁定）
- **左键 emit `tray:toggle` event，不直接调 window**：M0-N3 起接窗口；事件名按 spec/02 § 4 namespace:name 规范

待用户本机验证：

- `pnpm tauri dev` ── 看菜单栏右上出现 template icon · light/dark 模式下自动反色 · Dock 无图标 · 左键触发 `tray:toggle` event（DevTools console 可监听）· 右键弹 3 项菜单 · 点 Quit 退出

进度状态：

- `progress/manifest.json` M0-N2 `status: completed`
- `progress/01_m0_skeleton.html#m0-n2-tray` status: `done · pending-user-verification`

#### M0-N1 · 工程脚手架（done · pending-user-verification）

新增文件：

- `src-tauri/Cargo.toml` ── Tauri 2.x · `tauri` / `tauri-build` v2 · `serde` / `serde_json` v1（scaffold 默认依赖，<b>未引</b> M1+ 业务依赖如 rusqlite / reqwest / security-framework / CodeMirror）；`profile.release` 锁定 `lto=true` + `codegen-units=1` + `opt-level="s"` + `strip=true`（对齐 plan/04 NFR § 6 dmg &lt; 15 MB 红线）
- `src-tauri/build.rs` ── 调 `tauri_build::build()`，Tauri 2.x 必需
- `src-tauri/src/main.rs` ── 最小 builder：`tauri::Builder::default().run(generate_context!())`；不含菜单栏 / 窗口 / 快捷键 / 日志等（属 M0-N2…N5）
- `src-tauri/tauri.conf.json` ── 关键字段锁死：`identifier=com.jsonita.app`（<b>发版后不可改</b>，影响 Keychain service id）/ `productName=Jsonita` / `version=0.3.0-m0` / `bundle.targets=["dmg","app"]` / `minimumSystemVersion=11.0`；`bundle.icon=[]`（M0-N7 填）
- `src-tauri/capabilities/default.json` ── Tauri 2.x 必需的最小 capability：仅 `core:default`（M2-N5+ 扩展 shortcut / clipboard 等，spec/12 § 2 完整版）
- `package.json` ── React 18 + TypeScript 5 + Vite 5 + `@tauri-apps/api` / `@tauri-apps/cli` v2；`engines: node ≥ 20 / pnpm ≥ 9`；`packageManager: pnpm@9.12.0`
- `tsconfig.json` ── strict + `noUnusedLocals` + `noUnusedParameters` + path alias `@/*` → `./src/*` + `types: ['vite/client']`
- `vite.config.ts` ── `root: 'src'` + `build.outDir: '../dist'`（关键决策：让 React app 的 `index.html` 放进 `src/`，避免与项目根的 docs `index.html` 冲突）；strict port 5173；忽略 `**/src-tauri/**` watch
- `src/index.html` ── Vite 入口（mount `<div id="root">`）
- `src/main.tsx` ── React 18 `createRoot` + StrictMode
- `src/App.tsx` ── 占位组件（"Jsonita · M0-N1 scaffold" 一行字），M0-N2 起替换

修改文件：

- `.gitignore` ── 追加 `!src-tauri/Cargo.lock` 例外（Rust app 惯例：可执行项目要 commit lockfile，保证 M0-N7 dmg / M2-N6 sign+notarize / D-N1 brew tap 的 reproducible build）

关键决策记录：

- **Vite root = `src/`** 而非项目根：项目根 `index.html` 是文档导航入口（plan / spec / progress），不能被 Tauri React 覆盖；Vite 支持 `root` 配置，clean 共存
- **identifier `com.jsonita.app` 一次锁死**：发版后不可改（Keychain service id / macOS bundle id 长期合约）
- **未 commit Cargo.lock 例外加在 `.gitignore`**：偏离原始 .gitignore"忽略全部 Cargo.lock"的策略，符合 Rust 应用层 best practice

待用户本机验证（agent 不替跑 install / build · CLAUDE.md § 2.3）：

- `pnpm install` ── 装 React / Vite / Tauri CLI
- `pnpm tsc --noEmit` ── 类型检查 0 错
- `cargo check --manifest-path src-tauri/Cargo.toml` ── Rust 编译过
- `pnpm tauri dev` ── 起 ~5 min 后看空白窗口"Jsonita · M0-N1 scaffold"

进度状态：

- `progress/manifest.json` M0-N1 `status: completed`
- `progress/01_m0_skeleton.html#m0-n1-scaffold` status: `done · pending-user-verification`

### Agent 控制面改造（实施期 SOP）

> **未 commit** ── 本段工作尚未由用户 review；prompt 明示"不要提交 git commit 除非用户明确要求"。

#### 新增文件
- `AGENT_RUNBOOK.md` ── 后续 coding agent 实施期 SOP（12 段）：开工前 6 动作 / active phase 判定 / task card 选取 / Do Not Touch 红线 / spec ↔ progress 双向同步 / 完成节点 5 步同步 / Verification Log 规则 / 链接校验 / secrets 红线 / 不实现 future phase / 常见错误
- `progress/manifest.json` ── 33 节点机器可读总表（5 phases + 全字段：status / progress_file / task_file / spec_refs / write_scope / test_commands / manual_checks / non_goals / blocked_by / tag_on_complete / secrets_required）；21 KB
- `progress/tasks/M0-N1_scaffold.md` 至 `M0-N7_dmg_build.md` ── 7 张 M0 任务卡（统一 9 段：Goal / Context / Write Scope / Do Not Touch / Deliverables / Verification / Acceptance Mapping / Stop And Ask / Notes）
- `docs/traceability.md` ── Feature ↔ Spec ↔ Progress ↔ Task ↔ Test ↔ Acceptance 端到端矩阵（5 Phase × ~30 features）
- `scripts/verify_doc_links.mjs` ── Node.js 原生 fs + regex 链接校验脚本；扫 html + md；输出失效列表 + summary；外部 URL 跳过；script/style 块排除（防 inline JS 误判）

#### progress/ 5 篇文档改造
- **稳定 id**：5 篇共加 ~69 个稳定 h2/h3 id（entry-criteria / exit-criteria / milestones / acceptance / testing / risks / spec-map / verification-log + 33 节点 id 如 `m0-n1-scaffold` / `d-n3-updater`）
- **节点状态字段**：33 节点统一加 5 字段（status / write scope / verification / commit / tag / blocked_by）；M0 实质内容，M1/M2/M3/D 占位"(实施时填)"
- **Verification Log 模板**：5 篇末尾加 § 五·实施记录 + 9 列空表（date / node / commit / OS / commands / passed / failed / logs / notes）
- **4 处 `#h-2` 失效锚点** → `#exit-criteria` 稳定 id

#### § 八 不一致修正
- **README.md** 当前进度反映 plan ✓ / spec ✓ / progress ✓ / M0 active；加 agent / 协作者引导段
- **M2 快捷键策略**（03_m2_ai_settings.html）：冲突自相矛盾 → 锁定"默认阻塞 patch 提交 + override 走二次确认 Modal"；M2-A17 验收补 A17b 测 override 路径
- **M3 Windows**（04_m3_polish_cross.html）：E11 从"可选退出条件"改成"非阻塞 · 跳过不阻塞 v1.0"；加 callout-warn 强调跳过决策记入 Verification Log
- **v1.1+ updater/brew 策略**（05_v11_distribution.html）：N3 vs N1 冲突 → 锁"DMG 用户走 in-app updater；brew 用户检测后跳过，最多 Toast 'brew upgrade jsonita'"
- **v11-N* → D-N*** 命名（避免读成 v11）：05 章节 10+ 处 + M3 E11 cross-link + index/nav 同步

#### 顺带修复
- `spec/01_mockups.html` h2 加 7 个数字 id（`id="2"..."10"`）── 修 spec/04 + spec/07 中 10 处 `01_mockups.html#N` pre-existing 死链
- progress 末尾 section-divider 编号从误跳的"六"改成"五"
- 链接校验脚本误识别 `<script>` 块内 inline JS 字符串 → 加 script/style 块预剔除

#### 验证
- `node scripts/verify_doc_links.mjs` ── **455 local links checked, 0 broken**
- `git diff --check` ── 无 whitespace 警告

### Style 修复

#### H2 / section-divider 字号平衡（用户反馈"H1 H2 大小明显失衡"）
- `assets/style.css` H2：24px → 21px；删 `linear-gradient` 背景 + `border-left` + `border-radius` + 横向 padding；改加 `border-bottom: 1px solid var(--border)` ── H2 从"重背景卡片"变"净文字 + 底部细线"，与 H3 17px / section-divider banner 18px 形成顺畅阶梯
- `h2 .h2-num` 字号 16px → 14px / `min-width` 28px → 22px（编号跟随 H2 缩小）
- `.section-divider` 整段 11px → 13px；`.section-divider b` 加 `font-size: 16px` + `letter-spacing` 0.12 → 0.08em（大段"一·设计 / 二·机制"banner 不再"看着像 tag"）
- 改动仅在 `assets/style.css` 内，HTML / nav.js 不变；全 spec / plan / progress / index 页面共享样式自动跟进

### Progress Phase · 0.6.x 起步

#### progress/ 5 篇规划文档（统一结构：前置 / 退出 / 节点 / 验收 / 测试 / 风险 / 跨章速查）
- 新增 `progress/01_m0_skeleton.html` (**active**) M0 Skeleton ── 7 节点 + 7 退出条件 + 13 验收用例（A1-A13）；从 `pnpm create tauri-app` 到本地 dmg 跑通；含日志框架 / i18n 框架的早期接入
- 新增 `progress/02_m1_core_json.html` (planned) M1 Core JSON ── 9 节点 + 12 退出条件 + 22 验收用例；核心价值落地（Formatter / Tree / String 互转 / 历史 / 会话 / 嵌套 unwrap / 智能宽度 / 单窗）
- 新增 `progress/03_m2_ai_settings.html` (planned) M2 AI Fix + Settings ── 6 节点 + 12 退出条件 + 21 验收用例；DeepSeek + Keychain + 设置面板 + 自定义快捷键 + macOS code signing & notarization
- 新增 `progress/04_m3_polish_cross.html` (planned) M3 Polish + Cross ── 6 节点 + 13 退出条件 + 20 验收用例；主题 / 中文 UI 解锁 / a11y 完整验收 / macOS 多版本回归 / Windows 实验构建 / v1.0 GitHub Releases 发布
- 新增 `progress/05_v11_distribution.html` (planned) v1.1+ Distribution ── 5 独立节点（brew tap / npm 启动器 / 自动更新 / Windows EV 签名 + winget / 日志导出 zip）；推荐 v1.1 / v1.2 / v1.3 滚动发布节奏；首个"非串行" Phase

#### spec 清理（用户反馈"checklist 都删掉"）
- 删除 8 章末尾"测试 checklist"段：`spec/06 § 11` · `07 § 6` · `08 § 8` · `09 § 11` · `10 § 11` · `11 § 12` · `14 § 9` · `15 § 11`（共 ~80 个 li 验收项）
- 删除 `spec/12 § 9 验收标准（对齐 plan NFR）` 整段（含 9.1 性能 / 9.2 隐私 / 9.3 可用性 / 9.4 兼容性 / 9.5 可靠性 5 张 A-PERF / A-PRIV / A-UX / A-COMPAT / A-REL 用例表）
- 14 / 15 / 12 后续节自动重编号（§ 10→9 / § 12→11 / § 10→9）
- 删除后 spec 各章末尾改由 progress 验收用例承接；spec 回归"技术设计"边界，progress 承接"实施期对照"

#### 项目面板同步（CLAUDE.md § 1.3 / § 5.3 强制 5 步）
- `index.html` Progress 列从"待 Spec 完成后生成" 改为 5 个章节链接
- `assets/nav.js` `progress.chapters` 从空数组填入 5 章节定义（M0 / M1 / M2 / M3 / v1.1+）
- 大清理 `TODO.md`：删 Phase 1-5 全段（30 项 [ ] 任务全转入 progress）；只留"未分到 Phase 的疑似工作" 2 条；恢复 TODO 单一职责"列未完成"

### Planning Phase
- 项目立项、命名 `Jsonita`（西语小化后缀 -ita，"小巧的 JSON 工具"）
- 完成查重：GitHub / npm / crates.io / PyPI 均无重名
- 锁定技术栈：Tauri 2.x + React 18 + TypeScript + CodeMirror 6 + SQLite

### Spec Phase · 0.6 重构 & 增补
- spec 章节重排序：`mockups` 从 12 → **01**（提前为 visual source of truth）；其他章节 +1
- 新增 `spec/13_schemas.html` 数据模型参考 ── 集中所有 Rust struct / enum / SQL DDL / TS interface / config schema，其他章节不再散落
- plan：F2 加 Tree hover 复制规则 / F7.1 加 3 设置项 / **新增 F10 浮窗智能宽度（4 层独立逻辑）** / 02 § 1 尺寸更新
- spec：02 IPC 加 `window_resize_for_content` + `window:resized` event；06 § 9 智能宽度完整算法；08 § 4.5 Tree hover 复制实现
- spec/01_mockups 大重写：每个 mock 左右 light/dark **双版** + § 11 智能宽度示例 + § 12 Hover 复制示例
- spec/04 图标章节真实展示所有 PNG/ICO/menubar 资源（含 light/dark 反色对照）
- 全局清理 ASCII box-drawing：组件/菜单栏改成指向 01 mockups 链接；状态机改用 mermaid stateDiagram
- 新建项目级 `CLAUDE.md` 写定硬规则（不 cd · 先 TaskCreate+AskUserQuestion · mockups 唯一权威 · 代码密度规则）

#### Design-first 重写（4 章 spec，2202 → 1635 行，-26%）
- 锁定章节内部顺序规则：**先讲设计意图与工作机制 → 再给代码 / 样例 / schema**；写入项目 memory 作为后续硬约束
- **02 IPC**（622 → 480 行，-23%）重写为四段 ── 一·设计（目标 / 命令分组职责 / 错误传播模型 / 命名同步幂等大小）/ 二·机制（3 张关键时序 mermaid 提前到第 5 段）/ 三·契约速查（Commands / Events / TS 监听 / 错误矩阵）/ 四·运行时数字。所有 struct / enum / payload（17 个）删除，链 13 § N
- **09 JSON 引擎**（471 → 370 行，-21%）新增 § 2 "为何用 serde_json 而非 nom/pest/手写" 选型对比 + 模块划分；保留 8 个 ≤ 20 行核心算法（sort_keys 递归 / error_loc::map / walk / unescape / auto_unwrap command 集成等）
- **10 存储 & 会话**（578 → 386 行，-33%）新增 § 2 介质分工选型理由 + § 3 6 条不变量；提前 § 4 SQLite 设计（表 / 索引 / FTS5 / migration / WAL 选型 + max_size=4 理由）；保留状态机 mermaid + RestoreTimer 接口
- **11 AI 客户端**（531 → 399 行，-25%）新增 § 1 五条设计原则展开 + § 2 "为何选 DeepSeek" 选型对比；prompt 5 条规则的设计意图独立成节；保留 prompt 模板 + extract_json 三个 case + diff 算法等核心 ~25 行
- **04 组件库**（395 → 341 行，-14%）删除完整 cva button.tsx + Toast 实现 + global.css；修 4 处 "12 §" 失效链接 → "01 §"；补 6 个组件指向 01 mockup 的视觉链接（TabBar / StatusBar / Toast / ShortcutInput / ApiKeyInput / DiffView）
- assets/style.css 新增 `.section-divider` 类做"一 · 设计 / 二 · 机制 / 三 · 契约 / 四 · 数字"四段视觉分隔

#### Design-first v2 — 补 graphs + 拆 code（用户二次反馈：缺图 + 代码太多）
- 强化 memory `spec-design-first-code-last`：加入两条新硬规则 ── (a) 讲系统 / 模块 / 状态 / 流程的章节<b>必须 ≥ 1 张 mermaid 图</b>（目录树代码块 / flow-steps 卡片不能替代）；(b) 代码块严格 ≤ 20 行，必须是不可替代的核心算法或接口签名
- **00 架构**（414 → 476 行，+15%）**新增 8 张 mermaid 图** ── 双进程拓扑 graph TB / 进程生命周期 stateDiagram-v2 / 启动时序 sequenceDiagram / 呼出时序 sequenceDiagram / format 数据流 sequenceDiagram / 错误传播 graph LR / Rust 模块依赖 graph TD / TypeScript 模块结构 graph TD；删完整 src-tauri/src 目录树 + 完整 src/ 目录树 + JsonitaError Rust enum + TS type 镜像（13 § 1 已唯一权威）+ 完整项目根目录树
- **03 design tokens**（624 → 559 行，-10%）将原 § 2.2 / 2.3 light + dark `:root { ... }` 60+ 行 CSS 块拆为 token 取值表（4 列：token / light / dark / 设计意图）；字号 / 字重 / 行高 / 圆角 / 边框 / 阴影 / 时长 / 缓动 / Z-index 均改表；新增主题切换 graph TB（4 数据源 + 3 处订阅 + 1 FOUC 避免）；Tailwind 完整 config 70 行压为映射规则表 + ~18 行核心 extend；保留 4 个 ≤ 20 行 `<pre>`（resolve+apply / FOUC inline / Rust theme watch / Tailwind 骨架）
- **06 窗口**（534 → 428 行，-20%）cocoa NSPanel 完整 unsafe 实现压为标志位表（styleMask × 3 / collectionBehavior × 3 / 其他 × 2 + 调用骨架 ≤ 15 行）；tauri.conf.json 完整 30 行压为关键字段表（含每个字段的"原因"列）；locate_window 完整 40 行 → 算法步骤表 + 核心循环 ≤ 10 行；**新增 4 张 graph** ── 多屏定位决策 graph TD / 关闭事件路由 graph TD（6 来源 → hide vs close 决策）/ 智能宽度 4 层 graph TD / 窗口生命周期 stateDiagram；保留 4 个 ≤ 20 行 `<pre>`（NSPanel 调用骨架 / locate 核心循环 / close interceptor / blur hide）

#### Spec 完整性补 — 新增 2 章（NFR 锁定但散落）
- **新章 14 国际化 & 无障碍**（357 行 / 3 张 mermaid / 4 个 ≤ 20 行 `<pre>`）── 为 NFR § 3 "M3 中文 UI" 做架构准备 + a11y 清单。设计部分：lib 选型 react-i18next（vs lingui / react-intl / 自写 4 行对比表）/ 资源按章节模块 namespace 拆（shell / panes / settings / history / errors / about / common 7 组）/ locale 检测 3 层 fallback / Rust 错误不翻译策略 / mono 字体 CJK 字符回退；机制部分：3 张 mermaid（locale 检测决策 / 加载与切换流程 / 字体回退决策树）；契约部分：资源目录组织 + JSON 示例 + initI18n / useTranslation API + settings.locale 字段补充；a11y 部分：10 项强制要求 + 3 条 screen reader 关键流
- **新章 15 日志 & 可观测性**（367 行 / 2 张 mermaid / 3 个 ≤ 20 行 `<pre>`）── 为 NFR § 6 "本地滚动日志 + 不上报 + 不记 JSON 内容" 做完整 spec。设计部分：5 条硬约束（不上报 / 不记敏感 / 双进程合流 / 用户可审计 / 资源可控）/ Rust 日志框架选型 tracing+tracing-appender（vs log+env_logger / slog 对比表）/ 双进程合流策略（Rust 唯一写者，WebView 经 log_write IPC 转发）/ 4 级策略（DEBUG 默认关）/ 隐私脱敏字段黑白名单；机制部分：2 张 mermaid（日志写入路径 graph LR / 隐私脱敏决策树 graph TD）+ 关键事件 catalog 19 个 event（含每个 event 的级别 / 触发 / 字段，明确"哪些可记 / 哪些禁记"）；契约部分：JSON Lines 格式 + 必填字段表 + 文件路径 / 滚动策略 / 保留 7 天 / 权限 0600 + 黑白名单表 + RedactLayer 核心 ~20 行 + WebView 端 logger.ts 薄层 ~20 行 + 新 IPC <code>log_write</code> 命令；测试部分：12 条 checklist 含 "API key 不入日志 / JSON 内容不入日志 / 用户名不入日志" 三项审计专项
- 同步：<code>assets/nav.js</code> 加 14 / 15 章节项；<code>index.html</code> Spec 列加 14 / 15 链接（spec 总数 14 → 16 章）

#### 工作流规则
- CLAUDE.md 升级：§ 1.3 "完成工作必须三轨同步：TODO + CHANGELIST + index.html"（之前只写 TODO，导致漏同步）；§ 5.3 把"必要时"改为强制 4 步；§ 3.1 同步 spec 16 章列表
- 新 memory `todo-cleanup-rule`：TODO 完成项必须从 TODO.md 删除（不只是打勾），TODO 只保留未完成；历史归 CHANGELIST.md。后续会话执行
- TODO.md 大清理：删除 Phase 0 / 0.5 / 0.6 全部已完成段（30+ 项 [x]），只保留 Phase 1-5 实施期任务 ── 让用户打开 TODO 直接看到"还剩什么"；同时把 spec/14 / 15 锁定的新工作（日志框架接入 / i18n 框架接入 / a11y 验收 / zh-CN 解锁 / 日志导出 zip）补入对应 Phase

#### Spec stale 清理 + mermaid syntax 修
- 删 spec/12 § 10 发布 checklist（cargo test / git tag / pnpm build 等过程性 runbook 不归 spec）+ § 12 "承上启下 ── 此章是 Spec 终点"（事实错误，13/14/15 在后面）
- 删除 5 章末尾的"承上启下"小作文段：00 § 11 / 05 § 8 / 07 § 7 / 08 § 9 / 12 § 12（已被 13 § 9 / 14 § 10 / 15 § 12 等"对接表"覆盖，不需小尾巴）
- 修 mermaid syntax error：spec/14 § 4 字体回退图（节点 label 含 `→` `/` 没引号包裹，渲染失败）；批量加引号修复 7 个高风险节点（00 § 1 / § 7 / 03 § 11 / 15 § 2.4 / 15 § 3 中含 `/` `:` `*` 在 label 里的）
- 新 memory `mermaid-safe-syntax`：节点 label 强制 `["..."]` 引号包裹；edge label 禁 `→` `/` `*` `（）`；stateDiagram-v2 transition label 用 `<br/>` 换行不用 `→`

#### Index 渲染单源化（删内嵌副本，改 fetch + fallback）
- 用户反馈"双轨副本会出问题" ── 之前 index.html 内嵌 `<script type="text/markdown" id="src-readme/src-todo/src-changelist">` 三段 ~290 行镜像 .md 内容，每次改 .md 都得手动同步内嵌，多次漏改
- 改造：删除 index.html 三段内嵌 markdown 副本（440 → 157 行），renderAll() 改为 fetch `./README.md` / `./TODO.md` / `./CHANGELIST.md` 后用 marked.js 渲染
- file:// 协议下 fetch 会失败（CORS），渲染 fallback 卡片：链接到 .md 原文 + 提示用户跑 `python3 -m http.server 8000` 或 `npx serve .` 起本地服务后访问
- assets/style.css 新增 `.md-fallback` 样式
- CLAUDE.md 同步简化：§ 1.3 与 § 5.3 移除"同步 index.html 内嵌 script" 步骤；§ 5.3 由强制 5 步降为 4 步；index.html 现在只在"新增 / 删除章节"时才需改 Plan/Spec/Progress 列链接

#### CLAUDE.md v3 大改（progress + 测试 + git commit + 内容禁区）
- 新增 § 1.4 "TODO 完成项必须删除（不是打勾）"硬规则；§ 1.5 "完成小节点必须 git commit 但不主动 push"
- § 1.3 同步范围扩展：TODO + CHANGELIST + index.html + progress + nav.js 共 5 轨
- § 3.1 加入 progress/ 5 篇章节列表（01_m0_skeleton ... 05_v11_distribution）
- 新增 § 4.5 "spec 内容禁区"：禁发布 checklist / 承上启下小作文段 / 会话总结式段尾 / 事实错误的宏观断言 / 重复 mockups 视觉描述
- 新增 § 4.6 mermaid 写法精简版（细则指向 memory `mermaid-safe-syntax`）
- § 5.3 升级强制 4 步 → 强制 5 步（加 git commit）
- 新增 § 六 "Progress 迭代规则"：边界 / 状态切换 / Tasks 细于 Progress / spec ↔ progress 双向同步 4 段（细则指向 memory `progress-iteration-rules` 10 条）
- 新增 § 七 "测试策略"：核心 JSON 引擎单测 + 手动验收 + CI 跑什么 + Phase 完成打 tag 4 段
- 新 memory `progress-iteration-rules`：用户 6 条 + Claude 补 4 条 = 10 条 progress 迭代硬规则汇总

### Spec Phase · 0.5 起草
- 完成 12 章技术设计 `spec/00-11_*.html`：
  - 00 系统架构（进程模型 · 模块边界 Rust + TS · 数据流 · 错误传播 · 不变量）
  - 01 IPC 合约（20+ commands · 8 events · 类型镜像 · 错误矩阵）
  - 02 设计令牌（light / dark 双主题 CSS variables · 字号 / 间距 / 圆角 / 阴影 / 动效 · Tailwind 集成 · 对比度核验）
  - 03 组件库映射（shadcn/ui 12 项 + 13 个自定义组件 · 6 态变体规则）
  - 04 图标资源 & 主题（manifest.json 全景 · macOS .icns · Windows .ico · menubar template/light/dark × 18/22 × @1/@2/@3）
  - 05 窗口 runtime（NSPanel-like cocoa 实现 · 多屏定位 · 失焦 · 关闭拦截 · 淡入淡出）
  - 06 菜单栏 & 快捷键（tray API · global-shortcut 注册 · 冲突检测 · macOS 权限）
  - 07 编辑器 & 树 UI（CodeMirror 6 扩展清单 · light/dark theme extension · JSON 树自定义颜色 · JSON Path 复制）
  - 08 JSON 引擎（serde_json 封装 · 嵌套解开算法 + 超时 · 错误位置定位 · ↔ string 互转）
  - 09 存储 & 会话（SQLite schema 含 FTS5 · migration 框架 · Keychain 封装 · last_session 状态机）
  - 10 AI 客户端（DeepSeek 请求 · prompt 模板 · 响应验证 · 进度推送 · 错误透传含 429）
  - 11 打包、签名、验收（tauri.conf 全文 · entitlements · CI workflow · 9 类验收用例对齐 plan NFR）
  - 12 原型图 & 交互细节（主浮窗 6 态 + 单窗模式 + 状态栏 4 态 + 菜单栏 tray + 设置 Modal + 历史 Modal + RestoreBar + Toast 四 variant + AI Fix DiffView + 权限引导 + Empty States + light vs dark 对照）
- 04 图标章节真实展示所有图片资源：source masters / 多尺寸 PNG / macOS iconset / Windows ICO / menubar template 全套（含暗背景反色对照）
- 全局清理 ASCII box-drawing 原型图：组件 / 菜单栏改成指向 12 章 mockups；状态机改用 mermaid stateDiagram

---

## [0.1.0-plan] - 2026-05-22

### Added
- 项目目录骨架：`plan/` `spec/` `progress/` `assets/`
- 共享文档样式 `assets/style.css`
- 共享文档导航脚本 `assets/nav.js`
- 根目录 `index.html` —— 项目文档导航入口
- `plan/` 10 篇产品设计：
  - `00_overview.html` 项目概览（含设计约束 Constraints & Must-have）
  - `01_features.html` 功能清单
  - `02_interaction.html` 交互草图
  - `03_tech_stack.html` 技术选型
  - `04_nfr.html` 非功能性需求
  - `05_milestones.html` 里程碑
  - `06_out_of_scope.html` 不做的事
  - `07_risks.html` 风险与未决
  - `08_acceptance.html` 验收标准
  - `09_next.html` 下一步
- `README.md` `TODO.md` `CHANGELIST.md` `.gitignore`

### Changed (after multiple rounds of review)
- 删除 `00_overview.html` 的「阅读路径建议」「这份文档」「命名由来」装饰性章节，开场白也删除
- 删除原 `02_core_value.html`，「核心价值」从口号化卡片重构为 `00_overview.html` C 章节的「设计约束（Constraints & Must-have）」可量化列表
- C 章节进一步改为左右双列对照：Must Have ✓ / Must Not ✕（视觉减负）
- 删除原 `01_positioning.html`（套路化 PM 模板，无信息量）
- 删除原 `02_user_stories.html`（细节过多，属于 spec 阶段）
- 章节数从初始 13 → 10，多次重编号
- 重做 `01_features.html`：F1-F4 加 before/after 实例；F2 用 HTML/CSS 真模拟彩色树状视图
- 重做 `02_interaction.html`：删除所有 ASCII art，改用 HTML/CSS macOS 风格 mockup（traffic light + Tab + 双栏 + 状态栏）+ flow-steps 卡片表达流程
- 新增 CSS 组件：`.constraints-grid` / `.example-grid` / `.tree-mock` / `.mockup-window` / `.flow-steps`

### Added (post-review feature)
- **F8 会话保留与恢复**：关闭后 5 min 内（可配置 Off / 1 / 5 / 15 / 60 min）唤起自动恢复内容；<kbd>⌘⇧L</kbd> 任意时刻找回上次（即使应用重启）；<kbd>⌘K</kbd> 主动清空不污染「上次会话」
- 实现：sqlite `last_session` 单行表（持久化）+ in-memory 计时器（窗口期）
- C 章节同步加 must-have「短期会话恢复」+ must-not「超时仍自动还原」
- 02 主流程 STEP 04 行为更新（"暂存上次会话"）
- **F3.3 嵌套 Stringified JSON 全量解开**：Golang proto 序列化常见场景；自动识别字段值是 stringified JSON 时递归展开（默认开启，**无层数限制**，单次解析超时 200ms 即停防死循环 / 巨型嵌套）
- F6 快捷键精简：删「切换 Tab ⌘1-⌘6 / 复制输出 ⌘⇧C / 聚焦输入框 ⌘L」（非核心，污染系统级快捷键）
- F7 设置面板重构：从单行 inline 文字改为 6 个分组（General / Shortcuts / AI / History / JSON Transform / About）+ checkbox 清晰展示（开机自启动 / 菜单栏图标 / 自动粘贴 / 失焦隐藏 / 启用 AI / 自动解嵌套 等）
- 00 C 章节重写：删工程数字，改为产品级 7 vs 7 简短约束（"可安装"/"不联网"等）；具体指标链接到 04 NFR

### Roadmap noted (post-v1)
- v1.1+ 分发扩展：homebrew tap、npm 包装（用户提出，"后话"）

### Removed (post-review)
- 删除客户端限流（10 次/min）—— 用户用自己的 API key，应用不当家长替用户"省 token"；上游 DeepSeek 的 rate limit (429 + retry-after) 透传即可
- 02 状态表合并「AI 调用失败」+「AI 限流」为一项；02 AI Fix 流程 STEP 02 描述更新
- 删除 03 末尾 SPEC callout（spec 文件还不存在，不应预告）+ F7.3「spec 阶段确认」括号
- 删除 01 F5 导出格式 / F7.4 导出按钮（"数据全本地"不含"可导出"）
- 删除 02 第 6 章节「窗口与剪贴板行为」（会话恢复/找回/清空 在 01 F8；多屏/切应用/失焦 合并到第 1 章节）
- 删除 04 末尾 RISK callout（性能基线锁定属 progress，不是 plan）
- 删除 00 C「够轻够快」hover 数字 + F1「性能：100KB < 50ms」段（数字归 04 NFR，plan 不重复）

### Added (more)
- **F9 单窗模式**：可选 in-place 替换 input 编辑器（取消左右双栏），<kbd>⌘Z</kbd> 用 CodeMirror 6 history extension 回滚；F7.1 General 加 ☐ 开关；AI Fix 单窗下退化为 toast「已修复，⌘Z 撤销」
- **F1 编辑器交互细节**：补全 CodeMirror 6 标配扩展说明 —— soft-wrap 软换行、括号匹配高亮、缩进引导垂直线、大数组/对象折叠 <code>[ … ]</code>、行号、当前行高亮、<kbd>⌘F</kbd> 搜索、<kbd>⌘D</kbd> 多光标、<kbd>⌘Z</kbd> undo
- **JSON syntax highlighting**：nav.js 加 CSS-only highlighter（auto-detect <pre><code> starting with [/{/"），CSS .json-key/string/number/bool/null 与 .tree-* 同色（string 用绿色 #15803D）
- **Constraints hover tooltip**：00 C 章节 small 灰字改为 CSS-only hover tooltip（data-tip 属性 + ::after，"够轻够快" 类无 tooltip 直接简短）

### Removed (plan 聚焦产品边界)
- 删除 `05_milestones.html`（属 progress 范畴 —— 里程碑 / 时间线归实施期）
- 删除 `06_out_of_scope.html`（受众不清；"不做的事"用 00 C 章节 Must Not 7 条覆盖足够，细节归 progress）
- 删除 `07_risks.html`（plan 阶段只提问题不给措施 → 没价值；归 progress 持续跟踪）
- 删除 `08_acceptance.html`（验收标准属 spec；plan 阶段产品边界已经定义清楚）
- 删除 `09_next.html`（meta 章节无信息量；spec / progress 计划在 README / TODO 即可）
- plan 从 10 篇 → 5 篇（00 overview / 01 features / 02 interaction / 03 tech / 04 nfr）—— 只保留"产品定义"层，不涉及"实施层"

### Decided
- **桌面壳**：Tauri 2.x（Rust + 系统 WebView）—— 为后续 Windows 适配留口
- **前端栈**：React 18 + TypeScript 5 + Vite + Tailwind + shadcn/ui
- **编辑器**：CodeMirror 6（~150KB，比 Monaco 轻量）
- **JSON 树**：react-json-view-lite
- **状态**：Zustand
- **本地存储**：SQLite（rusqlite）+ macOS Keychain（API key）
- **交互**：菜单栏常驻图标 + 全局快捷键浮窗
- **历史**：SQLite 限制最近 100 条

### Out of Scope (v1)
- HTTP 客户端 / JSON Schema 编辑器 / JSON Diff / 云同步 / 协作

---

## 版本规划

| 版本 | 阶段 | 目标 |
|---|---|---|
| `0.1.0-plan` | 当前 | 完整 Plan 文档（PRD） |
| `0.2.0-spec` | 下一阶段 | 完整 Spec 文档（技术设计） |
| `0.3.0-m0` | M0 | Tauri 脚手架 + 菜单栏图标 + 全局快捷键 |
| `0.4.0-m1` | M1 | 核心 JSON 能力（Format/Tree/String 互转）+ 历史记录 |
| `0.5.0-m2` | M2 | AI Auto Fix + 设置面板 + 自定义快捷键 + dmg 打包 |
| `1.0.0` | M3 | 打磨发布 + 中文 UI + Windows 适配（可选） |
