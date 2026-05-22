# M0-N5 · 日志框架（tracing）

## Goal

接入 Rust `tracing` + `tracing-appender` daily rolling 日志框架。日志写到 `~/Library/Logs/Jsonita/`，权限 0600（仅当前用户可读）。`RedactLayer` 注册（M0 阶段无敏感字段，但接好；M2 加 API key 时直接可用）。WebView 端 logger.ts 薄层（M0 暂时只 `console.log`；IPC `log_write` 合流到同一文件留 M1）。

## Context

- [`progress/01_m0_skeleton.html#m0-n5-logging`](../01_m0_skeleton.html#m0-n5-logging)
- [`spec/15_logging.html`](../../spec/15_logging.html) § 4 4 级策略 § 5 路径 § 6 滚动 § 7 RedactLayer § 8 19 个事件 catalog

## Write Scope

- `src-tauri/Cargo.toml`（加 `tracing = "0.1"` · `tracing-subscriber = { features = ["env-filter", "json"] }` · `tracing-appender = "0.2"`）
- `src-tauri/src/logging/mod.rs`（init + 路径决策 + 权限设置）
- `src-tauri/src/logging/redact.rs`（RedactLayer 实现，按 spec/15 § 7 ~20 行核心）
- `src-tauri/src/main.rs`（启动时 `logging::init()`；emit 第一条 INFO `app.start`）
- `src/services/logger.ts`（前端日志薄封装；M0 暂只 console.log，留 `logger.error()` / `logger.warn()` 接口形状）

## Do Not Touch

- 前端日志合流到 Rust 写者（IPC `log_write` 命令） → 留 M1（M0 阶段前端 console.log 即可，不接 IPC）
- 日志导出 zip 功能 → D-N5
- 敏感字段脱敏的<b>实际触发</b>（API key / JSON 内容）→ M2 / M1，本节点只把 RedactLayer 接好，规则表先空白
- DEBUG 级日志的 production 启用 → 默认 INFO+（用 `RUST_LOG=jsonita=debug` 可临时开）

## Deliverables

- [x] `~/Library/Logs/Jsonita/jsonita-YYYY-MM-DD.log` 文件存在
- [x] 文件权限 `-rw-------`（0600）── `ls -l` 验证
- [x] 启动后日志含一条 INFO `app.start` JSON Lines 格式
- [x] 日志格式严格 JSON Lines（每行一个 JSON object，含 timestamp / level / target / msg + 可选字段）
- [x] daily rolling 可工作（手动改系统时间到次日 → 自动开新文件）
- [x] 5 MB 单文件上限 → 自动开 `.1.log` 分片
- [x] 7 天保留 → 9 天前的旧文件启动后被删
- [x] `RUST_LOG=jsonita=debug` 启动 → DEBUG event 进入文件
- [x] RedactLayer 注册 但 v0 规则表为空（M2 / M1 再填）

## Verification

```bash
# 1. 编译
cargo build --manifest-path src-tauri/Cargo.toml

# 2. 启动后立刻验证文件
pnpm tauri dev
ls -l ~/Library/Logs/Jsonita/
# 应见：-rw------- 1 huangjin staff ... jsonita-YYYY-MM-DD.log

tail -n 1 ~/Library/Logs/Jsonita/jsonita-*.log
# 应见 JSON Lines: {"timestamp":"...","level":"INFO","target":"app","msg":"app.start",...}

# 3. DEBUG 临时开
RUST_LOG=jsonita=debug pnpm tauri dev
grep '"level":"DEBUG"' ~/Library/Logs/Jsonita/jsonita-*.log  # 应有命中

# 4. 滚动手动（可选）
# sudo date MMDDhhmm  # 改系统时间到次日
# 再启动 → 看是否开新 daily 文件
```

## Acceptance Mapping

- M0-A11 ── ls -l 权限 0600
- M0-A12 ── JSON Lines 格式有效

## Stop And Ask / Update Spec When

- spec/15 § 5 路径选 `~/Library/Logs/` vs `~/Library/Application Support/Jsonita/logs/` 在 macOS 沙盒环境下不一致 → 回改 spec/15
- 默认级别从 INFO 改成更细 / 更粗 → 用户决策
- tracing-appender 在某些 macOS 版本下文件权限不持久（每次 rotate 重置） → 加 wrap 重设 + 改 spec/15

## Notes

- tracing-appender daily rolling 是**异步**的 ── 进程退出前 `flush` ：用 `_guard` 模式（`let _guard = WorkerGuard::new(...)`），让 guard 在 `main()` 结束时 drop 触发 flush
- 文件权限 0600 必须在**创建时**用 `OpenOptions::mode(0o600)`（POSIX）；之后 `chmod` 不可靠
- 路径用 `dirs::data_local_dir()` + `Jsonita/logs` 是错的 ── macOS Logs 标准在 `~/Library/Logs/<app>/`
- RedactLayer 用 `tracing_subscriber::Layer` trait 实现，注册在 subscriber chain 中
- 完成后 commit：`feat(m0-n5): tracing + daily rolling + redact layer`
