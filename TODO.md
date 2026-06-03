# Jsonita TODO

> 本文件是 [`site/todo.json`](site/todo.json) 的人工可读镜像；静态页面见 [`todo.html`](todo.html)。
> TODO 只保留开放事项，已完成或已回答的内容进入 [`CHANGELIST.md`](CHANGELIST.md) / [`site/changelist.json`](site/changelist.json)。

## P1

- [ ] 崩溃恢复 / 数据完整性 spec 增补：补齐 SQLite、settings.json、window.json 损坏时的检测、恢复、用户提示与日志策略；完成条件是 `spec/10_storage.html` 与 `spec/15_logging.html` 都有明确契约。
- [ ] CAST JSON-first 迁移：`plan/*.html` 与 `spec/*.html` 仍是 legacy HTML 发布页；完成条件是逐页拥有 CAST JSON 源、渲染产物与 freshness check。
- [ ] legacy Mermaid 发布面：图表修改后必须运行 `pnpm docs:render-mermaid` 与 `pnpm docs:check`，确保不回退到 raw Mermaid 或运行时 CDN。

## P2

- [ ] macOS 原生 vibrancy 跟随主题验收：在真实 macOS 环境运行 `cargo build` / `pnpm tauri dev`，确认 light/dark/system 下 NSVisualEffectView 材质和 appearance 同步；必要时比较 HudWindow 与 UnderWindowBackground。
- [ ] 为 CAST 文档脚本补 CI：把 `pnpm docs:check` 接入 GitHub Actions 或发布前脚本；完成条件是 freshness、homepage contract、Mermaid/CDN 检查自动失败。

## P3

- [ ] 安全合规审计清单：面向 macOS App Store、企业部署或更大范围分发时，补充权限、隐私、签名、公证和数据保留材料清单；v1 小范围内测不阻塞。
