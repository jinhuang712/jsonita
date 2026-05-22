# Jsonita TODO

> 只列**未完成**项；已完成的归 `CHANGELIST.md`，不在此处堆叠。
> 实施期详细任务进 `progress/` 后改用 progress/。

## Phase 1 · M0 Skeleton（next）

- [ ] `pnpm create tauri-app` —— React + TypeScript + Vite 模板
- [ ] 菜单栏图标（Rust 端 tray icon）
- [ ] 浮窗（NSPanel-like 行为，失焦自动隐藏 POC）
- [ ] 全局快捷键（默认 `⌘⇧J`）
- [ ] 空白 UI 跑通 `.dmg` 打包
- [ ] 日志框架接入（spec/15 锁定）—— tracing + tracing-appender + RedactLayer，daily rolling
- [ ] i18n 框架接入（spec/14 锁定）—— react-i18next + 7 个 namespace 骨架（v1 仅 en-US）

## Phase 2 · M1 Core JSON

- [ ] CodeMirror 6 集成 + 标配扩展（lineWrapping / bracketMatching / indentationMarkers / foldGutter+codeFolding / lineNumbers / highlightActiveLine / search / multipleSelections / history）
- [ ] JSON Formatter（缩进 / Sort keys / Minify）
- [ ] JSON TreeView（折叠 / 搜索 / Path 复制 / hover 节点复制）
- [ ] JSON ↔ String 互转
- [ ] 历史记录（SQLite）
- [ ] 会话保留与恢复（last_session 表 + in-memory 计时器 + ⌘⇧L 找回 + ⌘K 不污染上次）
- [ ] 嵌套 stringified JSON 全量解开（F3.3，Golang proto 场景，无层数限制 + 200ms 超时防死循环）
- [ ] 单窗模式（F9，in-place 替换 input + CodeMirror history ⌘Z 回滚 / F7.1 设置开关）
- [ ] soft-wrap / 浮窗智能宽度

## Phase 3 · M2 AI Fix + Settings

- [ ] DeepSeek 客户端（fetch + 节流）
- [ ] API key 管理（Keychain）
- [ ] 设置面板
- [ ] 自定义快捷键 + 冲突检测
- [ ] code signing + notarization

## Phase 4 · M3 Polish + Cross-platform

- [ ] 主题 / 动效 / Empty State
- [ ] 中文 UI（v1 解锁 zh-CN locale 资源 + Settings Language Select）
- [ ] a11y 验收（VoiceOver 3 条关键流 + Tab 序 + 200% 缩放）
- [ ] Windows 构建（可选）
- [ ] README / 演示 GIF

## Phase 5 · 分发扩展（v1.1+）

- [ ] homebrew tap：`brew install jsonita`
- [ ] npm 包装：`npx jsonita` 或 `npm install -g jsonita`
- [ ] 自动更新（tauri-plugin-updater）
- [ ] 日志导出 zip（spec/15 § 10，最近 7 日 + metadata.json）

## 待评估（无明确归属，遇到时分到对应 Phase）

- [ ] 测试矩阵 spec 增补（unit / integration / e2e + Tauri mock / SQLite in-memory / reqwest mock）── 可并入 spec/12 packaging § 9
- [ ] 崩溃恢复 / 数据完整性 spec 增补（SQLite 损坏 / settings.json 损坏的处理）── 可并入 spec/10 § 12
- [ ] 安全合规审计清单 spec 增补 ── 可并入 spec/12 packaging § 8
