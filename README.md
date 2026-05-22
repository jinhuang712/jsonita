# Jsonita

一款常驻 macOS 菜单栏、按全局快捷键瞬时呼出的极轻量 JSON 工具集。

> **Status**: Planning · v0.1
> **Stack**: Tauri 2.x · React 18 · TypeScript · Rust · CodeMirror 6 · SQLite

核心能力：JSON 格式化 · 树状视图 · String 互转 · 嵌套 stringified 解开 · AI Auto Fix · 历史记录 · 会话保留 · 自定义快捷键

完整的设计约束（产品边界）见 [`plan/00_overview.html`](plan/00_overview.html) C 章节；具体性能指标见 [`plan/04_nfr.html`](plan/04_nfr.html)。

## 项目结构

```
jsonita/
├─ index.html         # 📍 文档导航入口（用浏览器打开此文件）
├─ README.md          # 本文件
├─ TODO.md            # 阶段性 TODO
├─ CHANGELIST.md      # 变更历史
│
├─ assets/            # 文档共享资源
│  ├─ style.css       # 共享样式
│  └─ nav.js          # 共享导航（sidebar / topbar / pagination 自动渲染）
│
├─ plan/              # 产品设计（5 篇，聚焦产品定义）
│  ├─ 00_overview.html       项目概览 + 设计约束
│  ├─ 01_features.html       功能清单（含 before/after 实例）
│  ├─ 02_interaction.html    交互草图（HTML mockup）
│  ├─ 03_tech_stack.html     技术选型
│  └─ 04_nfr.html            非功能性需求
│
├─ spec/              # 技术设计（待 plan 批准后生成；含验收标准等实施细节）
├─ progress/          # 实施进度（待 spec 完成后生成；含里程碑 / 风险 / 不做的事 / 看板）
│
├─ src/               # React 前端（M0 起新增）
└─ src-tauri/         # Rust 后端（M0 起新增）
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
- [x] `spec/00-13_*.html` 14 篇技术设计（含架构 / 原型图集 / IPC / tokens / 组件 / 图标 / runtime / 编辑器 / 引擎 / 存储 / AI / 打包验收 / 数据模型参考）
- [ ] `progress/*.html` 进度跟踪（含里程碑、看板、日志、风险）
- [ ] M0 Skeleton —— Tauri 脚手架 + 菜单栏图标 + 全局快捷键

## License

待定（计划：MIT 或 Apache-2.0）
