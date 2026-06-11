# Jsonita TODO

> This Markdown file is the project-level TODO source. Completed documentation migration work is recorded in [`CHANGELIST.md`](CHANGELIST.md).

## P1

- [ ] 崩溃恢复 / 数据完整性 spec 增补：补齐 SQLite、settings.json、window.json 损坏时的检测、恢复、用户提示与日志策略；完成条件是 [`spec/07_storage_session.md`](spec/07_storage_session.md) 与 [`spec/09_logging_observability.md`](spec/09_logging_observability.md) 都有明确契约。

## P2

- [ ] macOS 原生 vibrancy 跟随主题验收：在真实 macOS 环境运行 `cargo build` / `pnpm tauri dev`，确认 light/dark/system 下 NSVisualEffectView 材质和 appearance 同步；必要时比较 HudWindow 与 UnderWindowBackground。
## P3

- [ ] 安全合规审计清单：面向 macOS App Store、企业部署或更大范围分发时，补充权限、隐私、签名、公证和数据保留材料清单；v1 小范围内测不阻塞。

## Closed By Markdown Migration

- [x] CAST JSON-first 迁移：旧目标是为 `plan/*.html` 与 `spec/*.html` 建 CAST JSON 源、渲染产物与 freshness check；本次改为 Markdown-first，`plan/*.md`、`spec/*.md` 与 `design/*.md` 是最终文档源，CAST / HTML 发布面已移除。
- [x] legacy Mermaid 发布面：旧目标是用 `pnpm docs:render-mermaid` 与 `pnpm docs:check` 防止 raw Mermaid / CDN 回归；本次移除生成式文档 HTML 与相关脚本，并把压扁图表转为 Markdown 表格 / 步骤说明或保留在 prototype source docs。
- [x] 为 CAST 文档脚本补 CI：旧目标是把 `pnpm docs:check` 接入 CI；本次删除 CAST 文档脚本，替换为 Markdown link、旧 HTML、CAST residue、flattened diagram、`git diff --check` 与 `pnpm tsc --noEmit` 的本地验证流程。
