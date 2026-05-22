# Changelog

本项目的所有重要变更记录于此文件。

格式参照 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) ，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/spec/v2.0.0.html) 。

## [Unreleased]

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
