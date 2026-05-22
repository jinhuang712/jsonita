# Traceability Matrix

> **目的**：把"产品能力 / 功能"作为索引列，对照该能力的**spec 设计 → progress 节点 → 任务卡 → 自动测试 → 手动验收**端到端链路。新功能从 plan 起，每经过一层都要在本文件加一行（或更新已有行），让任何 reviewer 能 30 秒内从能力定位到代码。
>
> 规则：
> - 一行 = 一个用户可感知的能力。**不**列内部抽象（如 "Zustand store"）
> - "Automated Test" 列指 `cargo test` 或前端单测；UI / IPC / 平台 API 不写测试（CLAUDE.md § 7.2），写"manual"
> - "Manual Acceptance" 列直接用 progress 中的用例 ID（`M0-A1` / `E11` / `M2-A17b` 等）
> - 改动 spec 后必须同步本表（CLAUDE.md § 6.4）

---

## M0 · Skeleton

| Feature / Capability | Spec Source | Progress Node | Task Card | Automated Test | Manual Acceptance | Notes |
|---|---|---|---|---|---|---|
| 工程脚手架（Tauri 2 + React + TS） | [spec/00 § 6-7](../spec/00_architecture.html) · [spec/12 § 1](../spec/12_packaging.html) | [M0-N1](../progress/01_m0_skeleton.html#m0-n1-scaffold) | [`tasks/M0-N1_scaffold.md`](../progress/tasks/M0-N1_scaffold.md) | `pnpm tsc --noEmit` + `cargo check` | M0-N7 后回归 | identifier 锁死 com.jsonita.app |
| 菜单栏 tray + template icon | [spec/05 § 3-4](../spec/05_icons_theme.html) · [spec/07 § 1-3](../spec/07_menubar.html) | [M0-N2](../progress/01_m0_skeleton.html#m0-n2-tray) | [`tasks/M0-N2_tray_icon.md`](../progress/tasks/M0-N2_tray_icon.md) | manual | M0-A1 / M0-A3 | template PNG 自动 light/dark 反色 |
| 浮窗 NSPanel 行为（不抢焦点 / 失焦隐藏 / 多屏） | [spec/06 § 2-5 § 9.2](../spec/06_window.html) | [M0-N3](../progress/01_m0_skeleton.html#m0-n3-nspanel) | [`tasks/M0-N3_nspanel_poc.md`](../progress/tasks/M0-N3_nspanel_poc.md) | manual (平台 API) | M0-A4 / A6 / A7 / A8 | cocoa unsafe；仅 macOS |
| 全局快捷键 `⌘⇧J` + 权限引导 Modal | [spec/07 § 4-5](../spec/07_menubar.html) · [spec/01 § 7](../spec/01_mockups.html) | [M0-N4](../progress/01_m0_skeleton.html#m0-n4-shortcut) | [`tasks/M0-N4_global_shortcut.md`](../progress/tasks/M0-N4_global_shortcut.md) | manual | M0-A4 / A9 / A10 | 授权后不重启可用 |
| 本地滚动日志（tracing + 0600） | [spec/15 § 4-7](../spec/15_logging.html) | [M0-N5](../progress/01_m0_skeleton.html#m0-n5-logging) | [`tasks/M0-N5_logging.md`](../progress/tasks/M0-N5_logging.md) | manual + RedactLayer 单测留 M2 | M0-A11 / A12 | JSON Lines / 7 天保留 |
| i18n 框架（react-i18next + 7 namespace） | [spec/14 § 3-6](../spec/14_i18n_a11y.html) | [M0-N6](../progress/01_m0_skeleton.html#m0-n6-i18n) | [`tasks/M0-N6_i18n.md`](../progress/tasks/M0-N6_i18n.md) | `pnpm tsc --noEmit` + grep hardcode 英文 | M0-A13 | v1 锁 en-US；zh 留 M3-N2 |
| 本地 dmg 构建 + CI 雏形 | [spec/12 § 1-4 § 7](../spec/12_packaging.html) | [M0-N7](../progress/01_m0_skeleton.html#m0-n7-dmg) | [`tasks/M0-N7_dmg_build.md`](../progress/tasks/M0-N7_dmg_build.md) | CI 4-step | M0-A1 / A2 + 回归全 A1..A13 | universal arm64+x64；< 15 MB |

## M1 · Core JSON

| Feature / Capability | Spec Source | Progress Node | Task Card | Automated Test | Manual Acceptance | Notes |
|---|---|---|---|---|---|---|
| JSON Format（缩进 / Sort keys / Minify） | [spec/09 § 4](../spec/09_json_engine.html) · [spec/13 § 1](../spec/13_schemas.html) | [M1-N2](../progress/02_m1_core_json.html#m1-n2-engine) | TBD（M1 实施时建） | `cargo test format::*` | M1-A1 / A2 / A3 | preserve_order feature 必开 |
| 错误位置定位（line / col 1-indexed） | [spec/09 § 5](../spec/09_json_engine.html) | [M1-N2](../progress/02_m1_core_json.html#m1-n2-engine) | TBD | `cargo test error_loc::*` | M1-A4 | StatusBar invalid 联动 |
| 嵌套 stringified JSON unwrap（无层数 + 200ms） | [spec/09 § 6](../spec/09_json_engine.html) | [M1-N8](../progress/02_m1_core_json.html#m1-n8-unwrap) | TBD | `cargo test unwrap::*`（含 timeout case） | M1-A5 / A6 | Golang proto 场景 |
| JSON ↔ String 互转（含外层 quote） | [spec/09 § 7](../spec/09_json_engine.html) | [M1-N2](../progress/02_m1_core_json.html#m1-n2-engine) | TBD | `cargo test convert::*` | M1-A7 / A8 | 4 层嵌套转义往返 |
| CodeMirror 6 + 12 项扩展 | [spec/08 § 1-3](../spec/08_editor.html) | [M1-N3](../progress/02_m1_core_json.html#m1-n3-codemirror) | TBD | manual (React + CM6) | M1-A1 + 切主题 + ⌘F / ⌘D / ⌘Z | Compartment 切 theme |
| TreeView + JSON Path 复制 + hover 复制 | [spec/08 § 4-4.5](../spec/08_editor.html) · [spec/01 § 12](../spec/01_mockups.html) | [M1-N5](../progress/02_m1_core_json.html#m1-n5-tree) | TBD | TS 单测 `tree/jsonpath.ts` | M1-A9 / A10 / A11 | react-json-view-lite 懒渲染 |
| SQLite 历史 100 条 + FTS5 中文搜索 | [spec/10 § 4 § 8](../spec/10_storage.html) | [M1-N6](../progress/02_m1_core_json.html#m1-n6-sqlite-history) | TBD | rusqlite 自带 + 业务约束单测 | M1-A12 / A13 / A14 | unicode61 tokenizer |
| 会话保留（5min in-memory）+ ⌘⇧L 找回 + ⌘K 清空 | [spec/10 § 5](../spec/10_storage.html) | [M1-N7](../progress/02_m1_core_json.html#m1-n7-session) | TBD | manual + state machine 单测 | M1-A15..A18 | ⌘K 不污染 last_session |
| 单窗模式（F7.1 开关 / ⌘Z undo） | [spec/01 § 1-5](../spec/01_mockups.html) · [spec/08 § 1](../spec/08_editor.html) | [M1-N4](../progress/02_m1_core_json.html#m1-n4-layout) | TBD | manual | M1-A19 | 共享 editor 实例 |
| 浮窗智能宽度 4 层 | [spec/06 § 9](../spec/06_window.html) | [M1-N9](../progress/02_m1_core_json.html#m1-n9-smart-width) | TBD | manual | M1-A20 / A21 / A22 | userDragged 锁定 |

## M2 · AI Fix + Settings

| Feature / Capability | Spec Source | Progress Node | Task Card | Automated Test | Manual Acceptance | Notes |
|---|---|---|---|---|---|---|
| Settings 面板 6 分组 + 立即生效 | [spec/01 § 6](../spec/01_mockups.html) · [spec/04](../spec/04_components.html) · [spec/10 § 7](../spec/10_storage.html) | [M2-N1](../progress/03_m2_ai_settings.html#m2-n1-settings-ui) | TBD | manual | M2-A1..A4 | deep merge patch |
| API key Keychain 落地 + 不入 settings/log/event | [spec/10 § 6](../spec/10_storage.html) · [spec/11 § 6](../spec/11_ai_client.html) | [M2-N2](../progress/03_m2_ai_settings.html#m2-n2-keychain) | TBD | Keychain wrapper 单测（mock service id） | M2-A5..A9 | 隐私审计 grep 0 命中 |
| DeepSeek 客户端 + extract_json 3 case | [spec/11](../spec/11_ai_client.html) | [M2-N3](../progress/03_m2_ai_settings.html#m2-n3-deepseek) | TBD | `cargo test extract_json::*` 3 case | M2-A10..A14 | token clamp(512, 8192) |
| AI Fix 流程 (Tab + DiffView + 写历史) | [spec/01 § 8](../spec/01_mockups.html) · [spec/04 DiffView](../spec/04_components.html) | [M2-N4](../progress/03_m2_ai_settings.html#m2-n4-ai-fix) | TBD | manual | M2-A10..A14 | op_type='ai-fix' |
| 自定义快捷键 + 冲突阻塞 + override 二次确认 | [spec/07 § 4](../spec/07_menubar.html) · [spec/04 ShortcutInput](../spec/04_components.html) | [M2-N5](../progress/03_m2_ai_settings.html#m2-n5-shortcuts) | TBD | manual | M2-A15..A17b | ⚠ 角标标识 override |
| macOS code signing + notarization + CI | [spec/12 § 3 § 5 § 7](../spec/12_packaging.html) | [M2-N6](../progress/03_m2_ai_settings.html#m2-n6-signing) | TBD | CI release workflow | M2-A18..A21 | **需用户授权访问证书** |

## M3 · Polish + Cross

| Feature / Capability | Spec Source | Progress Node | Task Card | Automated Test | Manual Acceptance | Notes |
|---|---|---|---|---|---|---|
| 主题动效 (3 数据源 / FOUC 避免 / reduced-motion) | [spec/03 § 4 § 8](../spec/03_design_tokens.html) · [spec/01 § 9](../spec/01_mockups.html) | [M3-N1](../progress/04_m3_polish_cross.html#m3-n1-theme-empty) | TBD | manual | M3-A1 / A2 / A3 | inline script < 1 KB |
| 6 处 Empty State 真实组件 | [spec/01 § 9](../spec/01_mockups.html) | [M3-N1](../progress/04_m3_polish_cross.html#m3-n1-theme-empty) | TBD | manual | M3-A3 | — |
| 中文 UI 解锁（zh-CN 7 namespace） | [spec/14 § 5-8](../spec/14_i18n_a11y.html) | [M3-N2](../progress/04_m3_polish_cross.html#m3-n2-zh) | TBD | grep 残留英文 | M3-A4..A8 | CJK 字体回退 PingFang SC |
| a11y 验收（VoiceOver / 全键盘 / 200% 缩放） | [spec/14 § 9-10](../spec/14_i18n_a11y.html) · [spec/04](../spec/04_components.html) | [M3-N3](../progress/04_m3_polish_cross.html#m3-n3-a11y) | TBD | manual (VoiceOver) | M3-A9..A13 | NFR § 4 硬要求 |
| macOS 多版本回归（11 + 14 + 15） | [spec/12 § 1](../spec/12_packaging.html) · [plan/04 § 5](../plan/04_nfr.html) | [M3-N4](../progress/04_m3_polish_cross.html#m3-n4-macos-versions) | TBD | manual (多机) | M3-A14..A17 | Stage Manager 单独验 |
| Windows 实验构建（**非阻塞**） | [spec/05 § 5](../spec/05_icons_theme.html) · [spec/07 § 5](../spec/07_menubar.html) | [M3-N5](../progress/04_m3_polish_cross.html#m3-n5-windows) | TBD | manual (VM/物理机) | M3-A18..A20 | 跳过需 Verification Log 记决策 |
| README + 演示 GIF + v1.0 发布 | — | [M3-N6](../progress/04_m3_polish_cross.html#m3-n6-release) | TBD | manual | E12 / E13 | `git tag 1.0.0` |

## D · v1.1+ Distribution（弹性独立）

| Feature / Capability | Spec Source | Progress Node | Task Card | Automated Test | Manual Acceptance | Notes |
|---|---|---|---|---|---|---|
| homebrew tap (`brew install jsonita`) | [spec/12 § 9](../spec/12_packaging.html) | [D-N1](../progress/05_v11_distribution.html#d-n1-brew) | TBD | brew cask audit | 干净 macOS 跑 brew tap+install 能装 | 推荐 v1.1 |
| npm 启动器 (`npx jsonita`) | [spec/12 § 9](../spec/12_packaging.html) | [D-N2](../progress/05_v11_distribution.html#d-n2-npm) | TBD | manual | `npx jsonita` 启动 | 推荐 v1.2 |
| 自动更新 (tauri-plugin-updater) | [spec/12 § 8](../spec/12_packaging.html) | [D-N3](../progress/05_v11_distribution.html#d-n3-updater) | TBD | release workflow 含 signature 生成 | 从 v1.0 升 v1.1 Toast + 重启 | 推荐 v1.1 / **需用户授权 update signing key** |
| Windows EV cert + winget | [spec/12 § 6](../spec/12_packaging.html) · [spec/05 § 5](../spec/05_icons_theme.html) | [D-N4](../progress/05_v11_distribution.html#d-n4-windows-signing) | TBD | manual | winget install 能装 | 推荐 v1.2/v1.3 / **需 EV USB token** |
| 日志导出 zip (最近 7 日) | [spec/15 § 10](../spec/15_logging.html) | [D-N5](../progress/05_v11_distribution.html#d-n5-log-export) | TBD | manual + RedactLayer 二扫 | Settings → About → 导出按钮 | 推荐 v1.1 |

---

## 维护规则

1. **新加 spec 章节 / progress 节点** → 必须在本表加行
2. **改 spec § 编号** → 全表 grep / 改对应 link
3. **task card 创建** → "Task Card" 列从 `TBD` 改成真实 link
4. **节点完成** → 不删行，但在 Notes 列加 `✓ <commit-sha>` 标记
5. **删除 feature**（极少；要回 plan） → 删本表对应行 + 加 CHANGELIST 记录
