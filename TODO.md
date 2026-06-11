# Jsonita TODO

> This Markdown file is the project-level TODO source. Completed documentation migration work is recorded in [`CHANGELIST.md`](CHANGELIST.md).

## P1

- [ ] 崩溃恢复 / 数据完整性 spec 增补：补齐 SQLite、settings.json、window.json 损坏时的检测、恢复、用户提示与日志策略；完成条件是 [`spec/S05-storage-session.md`](spec/S05-storage-session.md) 与 [`spec/S06-logging-observability.md`](spec/S06-logging-observability.md) 都有明确契约。

## P2

- [ ] macOS 原生 vibrancy 跟随主题验收：在真实 macOS 环境运行 `cargo build` / `pnpm tauri dev`，确认 light/dark/system 下 NSVisualEffectView 材质和 appearance 同步；必要时比较 HudWindow 与 UnderWindowBackground。
## P3

- [ ] 安全合规审计清单：面向 macOS App Store、企业部署或更大范围分发时，补充权限、隐私、签名、公证和数据保留材料清单；v1 小范围内测不阻塞。
