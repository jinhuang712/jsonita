# Jsonita TODO

> 高层 TODO 占位；详细任务跟踪进入 progress 后改用 `progress/`。

## Phase 0 · Planning（done）

- [x] 项目命名 Jsonita（查重通过）
- [x] git init + 项目骨架
- [x] 根 `index.html` 文档导航 + `assets/style.css` + `assets/nav.js`
- [x] `plan/` 5 篇产品设计（精简至 00-04，聚焦产品边界）
- [x] `01_features` 加 before/after 实例 + F2 真 HTML 树状 + F3.3 嵌套 stringified 解开
- [x] `02_interaction` HTML/CSS mockup 替代 ASCII
- [x] `CHANGELIST.md`（Keep a Changelog 风格）
- [x] 用户审阅 & 批准 plan

## Phase 0.5 · Spec · 起草（done）

- [x] `spec/00_architecture` 系统架构 + 进程模型 + 模块边界
- [x] `spec/01_mockups` 所有界面 HTML/CSS 原型集（visual source of truth；从 12 提到 01）
- [x] `spec/02_ipc` 完整 commands / events 合约（含错误矩阵）
- [x] `spec/03_design_tokens` light / dark 双主题 token 系统 + Tailwind 集成
- [x] `spec/04_components` shadcn/ui 选用 + 自定义组件清单
- [x] `spec/05_icons_theme` 图标资源全景 + manifest + 真实图片预览
- [x] `spec/06_window` 浮窗 NSPanel-like 实现 + 定位 + 失焦 + 动效
- [x] `spec/07_menubar` tray icon + 全局快捷键 + 冲突检测 + 权限引导
- [x] `spec/08_editor` CodeMirror 6 配置 + JSON 树 + 错误标注
- [x] `spec/09_json_engine` Rust 端 format / minify / unwrap / 错误定位算法
- [x] `spec/10_storage` SQLite schema + migration + Keychain + last_session 时序
- [x] `spec/11_ai_client` DeepSeek 请求 / prompt / 验证 / diff / 测试连接
- [x] `spec/12_packaging` tauri.conf 全文 + 签名 + notarize + 验收用例

## Phase 0.6 · Spec · 重构 & 增补（in progress）

### Refactor

- [x] 重排序：把 mockups 从 spec/12 提到 spec/01（文件已 mv）
- [x] **#19** 完成 spec 重排序收尾（文件内部 data-chapter / title / doc-tag / 跨章节 href / nav.js / index.html Spec 列）
- [x] **#26** 新建 `spec/13_schemas.html` 集中所有数据模型（Rust struct / enum / SQL DDL / TS interface / config schema）
- [ ] **#20** 激进精简各章 ── 删除散落的 struct/SQL/enum（改为 link 到 13 § N + 接口签名一行）。预计影响：02 ipc / 09 json_engine / 10 storage / 11 ai
- [ ] **#21** 删除各章里和 mockups 重复的视觉内容，统一指向 `01_mockups` 对应 §

### 新增

- [x] **#22** 补充 dark mode 原型图：spec/01 每个 mock 左右 light/dark 双版（12 个 mock × 2）
- [x] **#23** 新需求 · soft-wrap / 浮窗智能宽度
  - plan F2 加 hover · F7.1 加 3 项 · F10 浮窗智能宽度 · 02 § 1 尺寸更新
  - spec 02 IPC 加 `window_resize_for_content` / `window:resized` · 06 § 9 智能宽度算法 + 4 层逻辑表 · 01 § 11 智能宽度 mock
- [x] **#24** 新需求 · JSON 树 hover 复制
  - plan F2 加 hover 复制规则
  - spec 04 TreeView props 加 onCopyNode · 08 § 4.5 实现 + CSS · 01 § 12 hover 复制 mock

### 同步

- [ ] **#25** 同步：`index.html` 内嵌 README/TODO/CHANGELIST · `README.md` 进度 · `CHANGELIST.md` 新增段

## Phase 1 · M0 Skeleton（pending spec final）

- [ ] `pnpm create tauri-app` —— React + TypeScript + Vite 模板
- [ ] 菜单栏图标（Rust 端 tray icon）
- [ ] 浮窗（NSPanel-like 行为，失焦自动隐藏 POC）
- [ ] 全局快捷键（默认 `⌘⇧J`）
- [ ] 空白 UI 跑通 `.dmg` 打包

## Phase 2 · M1 Core JSON

- [ ] CodeMirror 6 集成 + 标配扩展（lineWrapping / bracketMatching / indentationMarkers / foldGutter+codeFolding / lineNumbers / highlightActiveLine / search / multipleSelections / history）
- [ ] JSON Formatter（缩进 / Sort keys / Minify）
- [ ] JSON TreeView（折叠 / 搜索 / Path 复制 / **hover 节点复制**）
- [ ] JSON ↔ String 互转
- [ ] 历史记录（SQLite）
- [ ] 会话保留与恢复（last_session 表 + in-memory 计时器 + ⌘⇧L 找回 + ⌘K 不污染上次）
- [ ] 嵌套 stringified JSON 全量解开（F3.3，Golang proto 场景，无层数限制 + 200ms 超时防死循环）
- [ ] 单窗模式（F9，in-place 替换 input + CodeMirror history ⌘Z 回滚 / F7.1 设置开关）
- [ ] **soft-wrap / 浮窗智能宽度**

## Phase 3 · M2 AI Fix + Settings

- [ ] DeepSeek 客户端（fetch + 节流）
- [ ] API key 管理（Keychain）
- [ ] 设置面板
- [ ] 自定义快捷键 + 冲突检测
- [ ] code signing + notarization

## Phase 4 · M3 Polish + Cross-platform

- [ ] 主题 / 动效 / Empty State
- [ ] 中文 UI
- [ ] Windows 构建（可选）
- [ ] README / 演示 GIF

## Phase 5 · 分发扩展（v1.1+）

- [ ] homebrew tap：`brew install jsonita`
- [ ] npm 包装：`npx jsonita` 或 `npm install -g jsonita`
- [ ] 自动更新（tauri-plugin-updater）
