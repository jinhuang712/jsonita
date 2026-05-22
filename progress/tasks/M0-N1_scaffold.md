# M0-N1 · 工程脚手架

## Goal

用 `pnpm create tauri-app` 生成 Tauri 2.x + React + TypeScript + Vite 骨架；落地仓库目录结构，让 `pnpm tauri dev` 能启动一个空白窗口。**不**做任何业务逻辑、UI、菜单栏 ── 那些是 M0-N2 起的事。

## Context (必读)

- [`progress/01_m0_skeleton.html#m0-n1-scaffold`](../01_m0_skeleton.html#m0-n1-scaffold) ── 本节点 progress 卡片
- [`spec/00_architecture.html`](../../spec/00_architecture.html) § 6 Rust 模块依赖 / § 7 TypeScript 模块结构 ── 知道目录划分目标
- [`spec/12_packaging.html`](../../spec/12_packaging.html) § 1 `tauri.conf.json` 关键字段表 ── 先把 identifier 等关键字段锁死（一旦发版不能改）
- [`plan/03_tech_stack.html`](../../plan/03_tech_stack.html) ── 技术栈选型已锁，**不要**讨论替换

## Write Scope

仅允许新建 / 修改下列文件：

- `src-tauri/Cargo.toml`
- `src-tauri/src/main.rs`（最小骨架，仅 `tauri::Builder::default()...run()`）
- `src-tauri/tauri.conf.json`（关键字段：`identifier=com.jsonita.app` / `productName=Jsonita` / `version=0.3.0-m0` / `bundle.targets=["dmg"]`）
- `src/main.tsx` · `src/App.tsx`（空白 React 组件）
- `package.json`（dev/build/test scripts）
- `tsconfig.json` · `vite.config.ts`
- `.gitignore`（追加 Rust `target/` · Node `node_modules/` · IDE）
- `pnpm-lock.yaml`（自动生成，不要手改）

## Do Not Touch

- 任何菜单栏 / tray 代码 → M0-N2
- 任何窗口 cocoa 调用 → M0-N3
- 任何快捷键 → M0-N4
- 任何日志 / tracing crate → M0-N5
- 任何 i18n / react-i18next → M0-N6
- 签名 / entitlements / CI → M0-N7
- **未来 Phase 的依赖**（CodeMirror / serde_json 业务 / rusqlite / reqwest / security-framework）── 一律不引

## Deliverables

- [x] `pnpm tauri dev` 在 macOS 上能启动一个空白窗口（标题"Jsonita"，5s 内出现）
- [x] `pnpm tsc --noEmit` 通过
- [x] `cargo check` 通过（Rust 工具链）
- [x] 仓库结构与本任务卡 § Write Scope 一致
- [x] `tauri.conf.json` 的 `identifier` 锁死为 `com.jsonita.app`（**发版后不可改**）

## Verification

```bash
# 1. 命令验证
pnpm install                    # 用户本机跑（CLAUDE.md § 2.3 禁 agent 替跑）
pnpm tsc --noEmit               # 应 0 错
cargo check --manifest-path src-tauri/Cargo.toml  # 应 0 错
pnpm tauri dev                  # 用户本机起 ── 看空白窗口

# 2. 仓库文件检查
ls src-tauri/src/main.rs src-tauri/Cargo.toml src-tauri/tauri.conf.json
ls src/main.tsx src/App.tsx package.json tsconfig.json vite.config.ts .gitignore

# 3. identifier 锁定
grep '"identifier"' src-tauri/tauri.conf.json  # 必须是 com.jsonita.app
```

## Acceptance Mapping

本节点不直接对应 M0-A* 用例（M0 验收用例从 M0-N7 dmg 装完才能跑）；但本节点是 M0-A1（dmg 安装成功）的**前置**。

## Stop And Ask / Update Spec When

- 发现 spec/00 § 6-7 中的 Rust / TS 目录划分与 Tauri 2.x 模板冲突 → **回改 spec/00**，CLAUDE.md § 6.4
- 发现 `pnpm create tauri-app` 在用户本机版本下无法生成 Tauri 2.x → 报告版本要求，先回改 `plan/03 § 1`
- identifier `com.jsonita.app` 已被 App Store 占用 → 立刻问用户确认新 identifier（**发版后不可改**，影响 Keychain service id）

## Notes

- Tauri 2.x 需要 Rust ≥ 1.77；macOS 需 Xcode CLT
- 初次 `pnpm tauri dev` 编译 ~5 min（不要怀疑卡住）
- `pnpm` 版本 ≥ 9（项目锁 pnpm 生态，不要用 npm / yarn 混用）
- React 18 + TypeScript 5 + Vite ── 模板默认选项，按下回车即可
- 完成后 commit message 参考：`feat(m0-n1): bootstrap tauri 2.x scaffold (react+ts+vite)`
