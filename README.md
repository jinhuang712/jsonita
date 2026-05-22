# Jsonita

一款常驻 macOS 菜单栏、按全局快捷键瞬时呼出的极轻量 JSON 工具集。

> **Status**: Implementation Phase · M0 active (next: M0-N1 工程脚手架)
> **Stack**: Tauri 2.x · React 18 · TypeScript · Rust · CodeMirror 6 · SQLite

核心能力：JSON 格式化 · 树状视图 · String 互转 · 嵌套 stringified 解开 · AI Auto Fix · 历史记录 · 会话保留 · 自定义快捷键

完整的设计约束（产品边界）见 [`plan/00_overview.html`](plan/00_overview.html) C 章节；具体性能指标见 [`plan/04_nfr.html`](plan/04_nfr.html)。

## 项目结构

```
jsonita/
├─ index.html                # 📍 文档导航入口（用浏览器打开此文件）
├─ README.md                 # 本文件
├─ TODO.md                   # 阶段性 TODO
├─ CHANGELIST.md             # 变更历史
├─ AGENT_RUNBOOK.md          # coding agent 执行 SOP
├─ AGENTS.md / CLAUDE.md     # Codex / Claude 项目硬约束
│
├─ assets/                   # 文档共享资源
│  ├─ style.css              # 共享样式
│  └─ nav.js                 # 共享导航
│
├─ plan/                     # ✓ 产品设计（5 篇）
├─ spec/                     # ✓ 技术设计（16 篇，见 index.html Spec 列）
├─ progress/                 # ✓ 实施进度
│  ├─ 01_m0_skeleton.html    M0 (active)
│  ├─ 02_m1_core_json.html   M1 (planned)
│  ├─ 03_m2_ai_settings.html M2 (planned)
│  ├─ 04_m3_polish_cross.html M3 (planned)
│  ├─ 05_v11_distribution.html D / v1.1+ (planned)
│  ├─ tasks/                 实施期任务卡（每节点一张）
│  └─ manifest.json          机器可读节点状态总表
│
├─ docs/                     # 项目侧文档
│  └─ traceability.md        Feature ↔ Spec ↔ Progress 矩阵
│
├─ scripts/                  # 文档工具
│  └─ verify_doc_links.mjs   本地链接 + 锚点校验
│
├─ src/                      # React 前端（M0-N1 起新增）
└─ src-tauri/                # Rust 后端（M0-N1 起新增）
```

## 如何阅读

```bash
open index.html
```

## 当前进度

- [x] 项目命名 & 查重
- [x] 项目骨架 & git init
- [x] 根 `index.html` 文档导航
- [x] `plan/00-04_*.html` 5 篇产品设计（聚焦产品边界）
- [x] `spec/00-15_*.html` 16 篇技术设计
- [x] `progress/01-05_*.html` 5 篇实施路线 + agent 控制面（tasks / manifest / runbook / traceability / 链接校验脚本）
- [ ] **当前 active**：M0 Skeleton —— 等用户起手 `pnpm create tauri-app`（M0-N1 工程脚手架）

## 给后续 agent / 协作者

- 实施期 SOP：先读 [`AGENT_RUNBOOK.md`](AGENT_RUNBOOK.md) 再动手
- 当前 active phase / 节点状态：[`progress/manifest.json`](progress/manifest.json)
- 节点任务卡：`progress/tasks/M0-N*.md`
- 改文档后跑：`node scripts/verify_doc_links.mjs`（应 0 broken link）

## License

待定（计划：MIT 或 Apache-2.0）
