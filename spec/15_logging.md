SPEC · 章节 15

# 日志 & 可观测性

本地滚动日志 + 不上报 + 不记 JSON 内容 ── 先讲设计原则与隐私边界，再讲合流机制与契约。

REF

本章对齐 [plan/04 NFR § 6](../plan/04_nfr.md) （本地滚动日志，不上报，不记 JSON 内容）+ [§ 2 隐私](../plan/04_nfr.md) （API key 只在 `secrets.json`，不进 settings / 日志 / event payload）+ [plan/01 F7](../plan/01_features.md) （设置面板"打开日志目录"按钮）。错误类型见 [13 § 1](13_schemas.md)；与 IPC 错误契约（ [02 § 8](02_ipc.md) ）、AI 错误透传（ [11 § 7](11_ai_client.md) ）、migration 失败（ [10 § 4.4](10_storage.md) ）对接。

一 · 设计

## 1 设计目标与边界

日志服务 开发者排障 与 用户反馈 两个场景，但 绝不 服务"产品分析" ── 五条硬约束：

| 原则 | 含义 | 实现影响 |
| --- | --- | --- |
| 不上报 | 无任何 telemetry endpoint；日志只写本地文件 | Cargo.toml 不引 sentry / opentelemetry / posthog 等 |
| 不记敏感 | API key / JSON 内容 / 用户家目录路径 ── 永远不入日志 | tracing field 黑名单 + Debug 实现自定义脱敏 |
| 双进程合流 | 当前只有 Rust 写本地文件；WebView 端只写 console | `log_write` IPC 合流为保留设计 |
| 用户可审计 | 路径公开（ `~/Library/Logs/Jsonita/` ）；用户可直接打开、复制、附 issue | `open_log_dir` 已实现；导出 zip 为保留设计 |
| 资源可控 | 按天滚动 + 保留 7 天；单文件 5 MB 分片为保留设计 | tracing-appender daily rolling + 启动时清理 7 天前文件 |

## 2 关键设计决策

### 2.1 Rust 日志框架选型

| 方案 | 结构化 | 滚动 | 体积 | 结论 |
| --- | --- | --- | --- | --- |
| tracing + tracing-appender （选） | 原生 structured fields | tracing-appender 内置 daily / hourly rotation | ~80 KB | Tauri 生态默认；async 友好；fields 易脱敏 |
| log + env_logger | 纯文本 fmt | 需自接 file_rotate crate | ~30 KB | 缺 structured；脱敏要 fmt args 拦截 |
| slog | 结构化但 API 啰嗦 | 需 slog-async + slog-term 组装 | ~50 KB | v1 团队规模没必要 |

### 2.2 双进程合流

Rust 是唯一文件写者。当前 WebView 端 `src/services/logger.ts` 只写 `console.*`；通过新 IPC `log_write(level, target, msg, fields)` 合流到 Rust 是保留设计。未来接入后：

同一文件，同一格式 ── 排障时不用看两个地方

WebView 端不持有文件句柄（沙箱 + I-5 不变量）

WebView 写日志频率天然受限于 IPC 节流（debounce / batch）

### 2.3 级别策略

| 级别 | v1 默认 | 含义 | 示例 |
| --- | --- | --- | --- |
| `ERROR` | 开 | 需要用户 / 开发者关注的问题 | SQLite 写失败 / secrets.json 写错 / AI HTTP 5xx |
| `WARN` | 开 | 降级但可继续 | UnwrapTimeout / RateLimit / FTS5 索引失败但主表 ok |
| `INFO` | 开（关键事件） | 关键状态变更 | 启动 / 退出 / migration 应用 / AI 调用开始结束（不含 prompt） |
| `DEBUG` | 关 （默认） | 开发期排障 | 每次 IPC 调用 / 每次状态机迁移 |
| `TRACE` | 关 （永不开） | 逐函数级 | — |

开启 DEBUG 的方式：环境变量 `RUST_LOG=jsonita=debug` （开发者使用）或 用户反馈 issue 时 设置面板 About → "开启 DEBUG 日志 10 分钟" 按钮（v1.1 加，v1 不暴露）。

### 2.4 隐私脱敏 ── 字段黑白名单

这是日志章节 最关键 的设计点。所有 新代码 调 tracing 前必须自查：fields 中是否含敏感数据？

字段判定矩阵：

| 字段内容 | 处理 |
| --- | --- |
| API key / access token / password | 拒绝，永不入日志 |
| 用户 JSON 内容：`content` / `text` / `body` | 不记录内容，只记 `len` + `sha256 prefix8` |
| fs 路径且包含 home dir | 把 `$HOME` 替换为 `~`，避免泄漏用户名 |
| error msg / stack trace | 可记，但必须确认 msg 内不含 inline 用户内容 |
| IPC 命令名 / 状态名 / 计数 / 耗时 | 可记，属于安全元数据 |
| 未分类新字段 | 默认拒绝，需 review 后加入白名单 |

### 2.5 滚动与保留

| 策略 | 值 | 原因 |
| --- | --- | --- |
| 滚动节奏 | 按天（00:00 切新文件） | 命名规则 `jsonita.YYYY-MM-DD.log` ── 用户附 issue 时容易找当天 |
| 单文件上限 | 保留设计 | 当前仅 daily rolling；5 MB 分片尚未实现 |
| 保留天数 | 7 天 | 启动时清理 8 天前文件；够用户回溯一周内的问题 |
| 启动写入 | `app.start` （version / OS / arch） | 当前不写 app_data_dir / tauri version |

二 · 工作机制

## 3 日志写入路径

WebView (React) Rust host reserved future console out
开发模式 console calls
DevTools 业务代码
tracing::info! / error! tracing Subscriber 字段脱敏 layer
检查黑名单 / 转换 tracing-appender
daily rolling FileAppender 业务代码
logger.error(target, msg, fields) 薄层 logger.ts
console calls + invoke invoke log_write IPC
(reserved) (jsonita.YYYY-MM-DD.log
~/Library/Logs/Jsonita/) 终端 stdout Chrome DevTools

注意 R3 脱敏 layer：当前 `RedactLayer` 已挂入 subscriber chain，但实现仍是占位，不会改写字段。新日志调用仍需在调用点避免传 API key / JSON 原文；字段级自动脱敏是保留设计。

## 4 关键事件 catalog

下表是 v1 实施期 所有 tracing event 的清单 ── 写新代码时不在表里的事件，先 review 是否需要加入。

| 事件名 | 级别 | 触发 | 字段 |
| --- | --- | --- | --- |
| `app.start` | INFO | main() 入口 | version, os, arch |
| `db.open` | INFO | SQLite open 成功 | path |
| `db.open.failed` | ERROR | SQLite open 失败 | error, path |
| `window.toggle` | INFO | tray / shortcut 切换显隐 | action: show \| hide |
| `shortcut.registered` | INFO | 启动期快捷键注册成功 | action = toggle-window |
| `shortcut.register_failed` | WARN | 启动期快捷键注册失败 | error |
| `reserved` | — | AI 调用、IPC 错误、panic hook、settings.changed 等细粒度事件 | 当前未统一打点 |

三 · 契约

## 5 日志记录格式

### 5.1 每行是一个 JSON

JSON Lines （ndjson）格式 ── 一行一个 event，便于 `jq` /`grep` / 第三方 viewer 处理。

```
// 示例：3 个 events
{"timestamp":"2026-05-22T14:23:01.103Z","level":"INFO","fields":{"message":"app.start","version":"1.0.0-beta.1","os":"macos","arch":"aarch64"},"target":"jsonita"}
{"timestamp":"2026-05-22T14:23:01.842Z","level":"INFO","fields":{"message":"db.open","path":"/Users/.../Jsonita/history.db"},"target":"jsonita"}
{"timestamp":"2026-05-22T14:23:04.117Z","level":"INFO","fields":{"message":"window.toggle","action":"show"},"target":"jsonita::window"}
```

### 5.2 必填字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `timestamp` | string | tracing-subscriber JSON formatter 时间戳 |
| `level` | `'ERROR' \| 'WARN' \| 'INFO' \| 'DEBUG'` | 大写 |
| `target` | string | 模块路径 `jsonita::ai` / WebView 端用 `web::editor` |
| `fields.message` | string | 事件名，例如 `app.start` |
| `fields.*` | 各类型 | 结构化字段，每个 event 不同（参 § 4 catalog 列） |

## 6 文件路径与滚动

| 项 | 值 |
| --- | --- |
| 目录 | `~/Library/Logs/Jsonita/` （macOS）/`%LOCALAPPDATA%\Jsonita\Logs\` （Windows） |
| 文件名 | `jsonita.YYYY-MM-DD.log` （tracing-appender daily rolling） |
| 滚动时机 | 00:00 本地时间；单文件 ≥ 5 MB 分片为保留设计 |
| 保留 | 启动时删除 8 天前的旧文件；当前实现按文件修改时间判断，不限制文件名 |
| 权限 | 0600（仅当前用户可读） |

## 7 隐私白 / 黑名单

### 7.1 黑名单（强制脱敏 / 拒绝）

| 字段名匹配 | 处理 |
| --- | --- |
| `api_key` /`access_token` /`refresh_token` /`password` /`secret` | 调用点禁止传入；自动替换为 `"[REDACTED]"` 是保留设计 |
| `content` /`text` /`body` /`raw` /`prompt` （指用户输入或 AI 返回） | 调用点只记元数据；自动 `len` + `sha256[:8]` 是保留设计 |
| `fixed` （AI 修复后 JSON） | 调用点禁止传入 |
| 路径字段（ `path` /`dir` /`file` ） | 当前可能直接写入； `$HOME` →`~` 自动替换为保留设计 |
| HTTP `body` （DeepSeek 响应） | 当前错误 payload 可能包含 body；日志调用点不应直接记录 body |

### 7.2 白名单（可直接记）

仅元数据安全：

枚举值（ `error_kind` / `source` / `op_type` 等）

计数 / 长度 / 耗时（ `len` / `elapsed_ms` / `retry_after_sec` / `tokens_in` ）

系统元信息（ `os` / `arch` / `version` / `tauri_version` ）

状态名 / 命令名（ `cmd` / `state` / `event` ）

哈希前缀（ `sha256[:8]` ）

### 7.3 RedactLayer（reserved / future）

当前 `src-tauri/src/logging/redact.rs` 的 `on_event` 是 no-op 占位。以下为未来字段级脱敏方向，不代表当前已实现。

```
// src-tauri/src/log/redact.rs ── 自定义 tracing Layer
const DENY: &[&str] = &["api_key","access_token","password","secret","prompt","raw"];
const HASH: &[&str] = &["content","text","body","fixed"];

impl<S: Subscriber> Layer<S> for RedactLayer {
    fn on_event(&self, event: &Event, _: Context<S>) {
        event.record(&mut |field: &Field, value: &dyn fmt::Debug| {
            let name = field.name();
            if DENY.iter().any(|d| name.contains(d)) {
                self.emit(name, "[REDACTED]");
            } else if HASH.iter().any(|h| name.contains(h)) {
                let s = format!("{:?}", value);
                self.emit(name, &format!("len={} sha256={}",
                                          s.len(), &sha256(&s)[..8]));
            } else {
                self.emit(name, &format!("{:?}", value));
            }
        });
    }
}
```

## 8 WebView 端薄层

```
// src/services/logger.ts ── 前端日志薄层（当前实现）
type Level = 'error' | 'warn' | 'info' | 'debug';

function emit(level: Level, target: string, event: string, fields?: Record<string, unknown>) {
  const consoleFn =
    level === 'debug' ? console.log : level === 'info' ? console.info : console[level];
  consoleFn(`[${target}] ${event}`, fields ?? {});
  // reserved: invoke('log_write', { level, target, event, fields })
}

export const logger = {
  error: (t: string, e: string, f?: Record<string, unknown>) => emit('error', t, e, f ?? {}),
  warn:  (t: string, e: string, f?: Record<string, unknown>) => emit('warn',  t, e, f ?? {}),
  info:  (t: string, e: string, f?: Record<string, unknown>) => emit('info',  t, e, f ?? {}),
};
```

注意：前端调用 `logger.*` 时仍要遵守 § 7 黑名单 ── 不能传 `content` 原文给 fields。约定通过 ESLint 自定义规则 + code review 双保险。

## 9 IPC 命令

当前只有 `open_log_dir` 已实现；其余是保留设计。

| 命令 | 返回 | 说明 |
| --- | --- | --- |
| `log_write(level, target, event, fields)` | `()` | reserved；WebView → Rust 日志转发 |
| `log_open_dir()` | `()` | Finder 打开日志目录 ── 复用 [02 § 6.1.7](02_ipc.md) `open_log_dir`，无需新命令 |
| `log_export_recent(days)` | `String` （zip 路径） | v1.1+：打包最近 N 日日志为 zip，返回路径供用户附 issue |

## 10 用户视角：导出 & 反馈

打开日志目录 ： `open_log_dir` command 已实现；Settings About 按钮为保留 UI

"导出最近 N 日" （v1.1）：调 `log_export_recent(7)` ，弹保存对话框，生成 `jsonita-logs-YYYY-MM-DD.zip`

反馈引导（reserved / future）：未来由 design 层定义错误反馈入口，跳 GitHub Issues 模板（预填 OS / version / 引导用户附最近 1 日日志）

## 11 与其他章节对接

| 章节 | 对接点 |
| --- | --- |
| 02 IPC § 6.1.7 system | 现有 `open_log_dir` 沿用； `log_write` 为保留命令 |
| 10 storage § 4.4 migration | migration 失败时返回 `JsonitaError::Sqlite`；备份路径为保留设计 |
| 11 ai client § 7 | AI 细粒度日志为保留设计；当前未统一 emit `ai.call.*` |
| 06 window § 5 | 当前窗口切换记录 `window.toggle` INFO； `window.hidden/window.shown` 细分事件为保留设计 |
| 07 menubar | 当前启动期注册成功 / 失败有日志；shortcut 冲突细粒度事件为保留设计 |
| 04 components | 未来错误反馈入口由 design 层定义；本章只要求可附最近日志 |
| plan/01 F7 | 设置 About 面板加"打开日志目录"按钮（已规划）；v1.1 加"导出最近 7 日"按钮 |
