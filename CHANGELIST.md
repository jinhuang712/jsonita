# Changelog

本项目的所有重要变更记录于此文件。

格式参照 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) ，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/spec/v2.0.0.html) 。

## [Unreleased]

### M0 实施期 · 0.3.0-m0 路线开工

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
