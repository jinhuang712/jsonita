SPEC · 章节 10

# 存储 & 会话

SQLite · secrets.json · settings store · last_session ── 先讲分层设计与状态机，再列 schema 速查。

REF

SQLite 表结构（字段 / 索引 / PRAGMA）见 [13 § 4](13_schemas.md)；secrets.json 字段见 [13 § 6](13_schemas.md)；settings 字段表见 [13 § 3.3](13_schemas.md)；window.json 见 [13 § 5.2](13_schemas.md)。本章不重复 DDL，只讲 为何这么设计 + 怎么工作。

一 · 设计

## 1 设计目标与边界

存储层承担三件事： 持久化用户数据 （历史 / 设置）/恢复短期工作状态 （last_session）/隔离敏感凭证 （API key）。设计原则：

数据全本地 ：依 [plan/00 must-have](../plan/00_overview.md) ，所有用户数据不上传；这也意味着不需要 schema 版本迁移到云端 / 跨设备同步

关停即安全 ：API key 走 `secrets.json` （ `chmod 600` 只本人可读），应用崩溃也不会写到 settings / 日志；JSON 历史走 SQLite，权限是用户家目录默认权限

卸载干净 ：一条 `rm -rf ~/Library/Application Support/Jsonita` 完全清理（含 history.db + settings.json + secrets.json + window.json）

恢复优于警告 ：意外关闭后再呼出，恢复内容比"你刚才编辑了 X 行，是否找回"友好 ── 但提供 ⌘K 让用户主动放弃

## 2 存储介质分工

四种介质，按 数据特征 分工：

| 介质 | 承载 | 选型理由 | 路径 |
| --- | --- | --- | --- |
| SQLite | 历史记录 + last_session | 需要 FTS5 全文搜索 / pinned-starred 索引 / 事务原子性 | `~/Library/Application Support/Jsonita/history.db` |
| JSON 文件 Store | 设置项 · window.json 尺寸记忆 | 纯 KV 配置 + 启动一次加载 ── 不值得开 SQLite 连接池；当前用自写 `SettingsStore` /`WindowStore` 读写 JSON | `~/Library/Application Support/Jsonita/{settings,window}.json` |
| secrets.json | DeepSeek API key | 无系统凭据弹窗、无 codesign 身份依赖、dev rebuild 不丢； `chmod 600` 限制只本人可读 | `~/Library/Application Support/Jsonita/secrets.json` |
| 本地日志文件 | error / warn / info 级别日志 | 调试反馈用；不放 SQLite 是因为日志写入频繁 + 不需要查询 | `~/Library/Logs/Jsonita/jsonita.YYYY-MM-DD.log` （按天滚动，保留 7 天） |

为何不全用 SQLite：设置项是 读密集 + 写稀疏 + 全量加载 的小 KV，开 SQLite 反而是过度工程；JSON 文件一次 `fs::read` 进内存即可，write-through 持久化。

## 3 不变量与数据策略

"数据写到哪 / 留多久 / 谁可读"的规则， 新代码必须遵守：

| 不变量 | 规则 | 违反后果 |
| --- | --- | --- |
| I-1 history 去重 | `content_hash` （sha256）唯一索引 ── 同内容多次操作合并为一条（更新 created_at + op_type） | 历史爆满 + 用户困惑同条目多份 |
| I-2 last_session 单行 | `CHECK (id = 1)` ── 整张表只能 1 行 | 恢复时不知道用哪条 |
| I-3 写入原子 | 所有 DB 写在单一事务（ `rusqlite::Transaction` ），失败回滚 | 半成品数据 / FTS 与主表不一致 |
| I-4 凭证隔离 | API key 不出现于 任何 fs 文件 / 日志 / event payload / 报错信息 | 泄漏 |
| I-5 设置单一入口 | 所有 settings.json 读 / 写经过 `SettingsStore`，其他模块禁止直接打开文件 | 缓存不一致 / 设置事件丢失 |
| I-6 滚动裁剪 | history 写入触发 DELETE 保留 pinned + starred + 最近 `settings.history_limit` 条 | 无限增长 |

二 · 机制

## 4 SQLite 设计

### 4.1 表设计要点

完整 DDL 见 [13 § 4](13_schemas.md)，这里讲 每张表为什么这么设计：

`history` ：主键 AUTOINCREMENT； `content_hash` 加 UNIQUE 实现 UPSERT 去重； `op_type` 加 CHECK 约束防写错值； `pinned` / `starred` 用 0/1 + CHECK（SQLite 没原生 bool）； `tags` 预留为 NULL JSON array，v2 加标签时不用改 schema

`last_session` ： `CHECK (id = 1)` 强制单行 ── 比"每次先 DELETE 再 INSERT"原子且省一次 round trip，用 UPSERT 直接覆盖

`app_meta` ：KV 形态（key TEXT PRIMARY KEY），当前已建表但未写入业务数据；保留给 `install_at` 等未来元数据

`schema_version` ：独立单字段表（v INTEGER），不放 app_meta 的原因是 `MAX(v)` 查询比 KV 解析快，且语义更明确

### 4.2 索引设计

| 索引 | 覆盖的查询 | 设计要点 |
| --- | --- | --- |
| `idx_history_hash` | UPSERT 去重 | UNIQUE，触发 ON CONFLICT 走 update 分支 |
| `idx_history_pinned_created` | list 默认排序 | 复合索引 (pinned DESC, created_at DESC) ── 一次扫描就能给前端"置顶在上 + 时间倒序"的视图 |
| `idx_history_starred` | 筛选 Starred Tab | 稀疏索引（大多数行 starred=0），但筛选时极快 |
| `history_fts` （FTS5） | history_search 全文匹配 | 详见 § 4.3 |

### 4.3 FTS5 索引与触发器

FTS5 虚拟表 + 3 个 trigger（insert / update / delete）保证主表与索引同步。tokenizer 用 `unicode61 remove_diacritics 2`；搜索命令会把 query 包进双引号执行 `MATCH`。

```
-- 索引同步 trigger（完整 SQL 见 13 § 4 / migrations/0001_init.sql）
CREATE TRIGGER history_ai AFTER INSERT ON history BEGIN
  INSERT INTO history_fts (rowid, content, summary)
    VALUES (new.id, new.content, new.summary);
END;

-- delete / update 类似（先 'delete' tombstone，再 insert 新版）
```

注意：FTS5 是 external content 表（ `content='history'` + `content_rowid='id'` ），不存第二份内容；只索引。这让 SQLite 文件大小可控。

### 4.4 migration 框架

策略： 单调递增版本号 + 顺序 apply + 启动时同步执行。简单到不需要回滚（v1 不支持 down-migration）。

每个 migration 是一个 `.sql` 文件， `include_str!` 编译进二进制 ── 用户不需要管 migration 文件

启动时读 `schema_version.MAX(v)` ，未达到的逐一 apply，全部在单一事务里执行

任一 migration 失败 → 事务回滚并返回 `JsonitaError::Sqlite`；备份路径为保留设计，用户可见反馈由 design 层维护

```
// src-tauri/src/store/db.rs ── 核心 ~20 行
const MIGRATIONS: &[(u32, &str)] = &[
    (1, include_str!("migrations/0001_init.sql")),
    // future: (2, include_str!("migrations/0002_xxx.sql")),
];

fn migrate(conn: &mut Connection) -> Result<(), JsonitaError> {
    conn.execute_batch("CREATE TABLE IF NOT EXISTS schema_version (v INTEGER NOT NULL)")?;
    let current: u32 = conn.query_row(
        "SELECT COALESCE(MAX(v), 0) FROM schema_version", [], |r| r.get(0))?;
    let tx = conn.transaction()?;
    for (v, sql) in MIGRATIONS {
        if *v > current {
            tx.execute_batch(sql).map_err(|e|
                JsonitaError::Sqlite(format!("migration {}: {}", v, e)))?;
            tx.execute("INSERT INTO schema_version (v) VALUES (?1)", params![v])?;
        }
    }
    tx.commit()?;
    Ok(())
}
```

### 4.5 连接池：WAL 模式 + r2d2

SQLite 默认 rollback journal 不支持读 / 写并发； WAL 模式 允许"任意多 reader + 1 writer"同时进行，对桌面应用是关键 ── 比如 history_list 不会被 history_add 阻塞。

```
// PRAGMA 必须在每个新连接初始化时执行（连接级而非数据库级）
let mgr = SqliteConnectionManager::file(path).with_init(|c| {
    c.execute_batch("
        PRAGMA journal_mode = WAL;       -- 读 / 写并发
        PRAGMA synchronous  = NORMAL;     -- WAL 下安全 + 快
        PRAGMA foreign_keys = ON;         -- 预防未来表关系
        PRAGMA busy_timeout = 5000;       -- 避免 lock 失败
    ")?; Ok(())
});
Pool::builder().max_size(4).build(mgr)?
```

为何 max_size = 4：v1 是单进程 + tokio runtime 默认几个 worker，4 个连接足够；调高反而增加内存（每连接 ~50 KB SQLite cache）。

## 5 last_session 状态机

### 5.1 设计动机

用户场景： 打开浮窗 → 编辑 30s → 切走应用 → 5 min 后回来。我们希望第二次呼出能直接接续，而不是从空白开始。但又要保留"主动放弃"出口（⌘K）。

单行持久化 是关键设计：

SQLite `last_session` ：长期保留 ── 即使应用 Quit + 重启，用户按 `⌘⇧L` 仍可找回

保存时机 ：前端 transform 成功后调用 `session_save_last` ，避免关闭时用空白 / 非法内容覆盖

当前实现不做 RestoreTimer / RestoreBar 自动恢复；恢复入口是用户主动按 `⌘⇧L`。

### 5.2 三种呼出场景

| 场景 | 行为 | 调用方效果 |
| --- | --- | --- |
| 合法 transform 成功 | 保存为 last_session | 不发额外事件 |
| 用户主动按 `⌘⇧L` 找回 | 全局快捷键先显示 / 聚焦浮窗，再读 sqlite last_session → setEditorContent | 调用方获得上次合法内容 |
| 用户按 `⌘K` 清空 | clear_last + 清空编辑器 | 调用方获得空内容 |

### 5.3 状态机

状态迁移：

| 起点 | 触发 | 终点 | 持久化影响 |
| --- | --- | --- | --- |
| 应用启动 | WebView 预建但 hidden | HiddenIdle | SQLite `last_session` 可能保留 |
| HiddenIdle | 呼出 | VisibleFresh | 不自动读取 last_session |
| VisibleFresh | 非编辑态双击 `Esc` / 失焦 / `⌘W` | HiddenIdle | `window.hide()`；不覆盖 last_session |
| VisibleFresh | `⌘K` 清空 | VisibleFresh | `session_clear_last` 清空 last_session，并清空编辑器 |
| HiddenIdle 或 VisibleFresh | `⌘⇧L` 找回 | VisibleRestored | `session_load_last` 读取 last_session 并写入编辑器 |
| VisibleRestored | 非编辑态双击 `Esc` / 失焦 / `⌘W` | HiddenIdle | `window.hide()`；last_session 仍可再次找回 |
| 任意状态 | 应用 Quit | 进程退出 | 不额外覆盖 last_session |

| 状态 | 含义 |
| --- | --- |
| HiddenIdle | 浮窗不可见；SQLite last_session 可能仍保留 |
| VisibleFresh | 浮窗可见 · 当前编辑器是用户新输入的内容 |
| VisibleRestored | 浮窗可见 · 当前编辑器内容来自 `⌘⇧L` 载入的 last_session |

## 6 secrets store（本地文件）

### 6.1 设计要点

放数据目录 ： `~/Library/Application Support/Jsonita/secrets.json` ，与 history.db / settings.json 同级，卸载一并清干净

按 account 区分多 key ：v1 只有 `deepseek_api_key` ；预留 `openai_api_key` / `claude_api_key` 等以备 v2 多 AI 后端

"不存在" 不是错误 ： `get` 返回 `Result<Option<String>>` ，文件不存在 / key 不存在都映射为 `Ok(None)` ── 让首次启动正常走"AI 未配置"路径

删除幂等 ： `delete` 不存在的 entry 也返回 `Ok(())`

权限 chmod 600 ：写文件后立刻 `set_permissions` ，限制只本进程拥有者可读

不依赖系统凭据库 ：API key 文件随 Jsonita 数据目录一并备份 / 删除，不受 dev rebuild、签名身份或应用更新影响；安全边界由用户家目录权限 + `chmod 600` 承担

### 6.2 Account 清单（见 13 § 6）

| account | 值 | 状态 |
| --- | --- | --- |
| `deepseek_api_key` | plain text · DeepSeek API key | v1 唯一项 |
| `openai_api_key` | — | v2 预留 |

### 6.3 接口

```
// src-tauri/src/store/secrets.rs ── 接口签名
pub fn set(account: &str, value: &str)   -> Result<(), JsonitaError>;
pub fn get(account: &str)                 -> Result<Option<String>, JsonitaError>;
pub fn delete(account: &str)              -> Result<(), JsonitaError>;   // 幂等
```

内部用 `OnceLock<Mutex<HashMap>>` 缓存避免反复读盘；fs IO 错误（write / chmod）映射为 `JsonitaError::Secrets`。

## 7 settings store

### 7.1 设计动机

settings 是 读密集 + 写稀疏 的小 KV（每次编辑器输入都要读 `auto_unwrap` /`indent` 等），所以走 启动加载到内存 + write-through 落盘 的策略：

启动时 `SettingsStore::load` 把 JSON 文件读进 `Arc<RwLock<Settings>>`

所有 `get()` 走内存（RwLock read，~0.1 ms）

所有 `patch()` 同时改内存 + 落盘 + emit `settings:changed` 事件给所有窗口

I-5 不变量：其他模块不允许绕过 SettingsStore 读写 JSON 文件

### 7.2 patch 算法核心

支持 partial update（只传 1-2 个字段即可），用 `serde_json::Value` 做中间格式做合并：

```
// 核心 ~10 行
pub fn patch(&self, patch: serde_json::Map<String, serde_json::Value>)
    -> Result<Settings, JsonitaError>
{
    let mut current = self.cache.write();
    let mut as_value = serde_json::to_value(&*current).unwrap();
    let obj = as_value.as_object_mut().unwrap();
    for (k, v) in patch { obj.insert(k, v); }              // shallow merge
    let updated: Settings = serde_json::from_value(as_value)?;
    *current = updated.clone();
    self.persist(&updated)?;                                // 落盘 + emit
    Ok(updated)
}
```

注意：shallow merge 即可 ── settings 是扁平结构（无嵌套对象），不需要 deep merge。如果 v2 引入嵌套（如 `ai: { provider, model }` ），改用 `jsonptr` 或自定义 deep merge。

三 · 契约速查

## 8 schema 索引

| 资源 | 定义位置 |
| --- | --- |
| SQLite 表（history / last_session / app_meta / schema_version） | [13 § 4.1-4.4](13_schemas.md) |
| SQLite PRAGMA | [13 § 4.5](13_schemas.md) |
| settings.json schema | [13 § 3.3 + § 5.1](13_schemas.md) |
| window.json schema | [13 § 5.2](13_schemas.md) |
| secrets.json schema | [13 § 6](13_schemas.md) |
| `HistoryRow` /`ListOpts` /`LastSession` Rust struct | [13 § 3.2](13_schemas.md) |

四 · 运行时数字 & 收尾

## 9 性能与并发

| 操作 | P50 | P95 | 实现细节 |
| --- | --- | --- | --- |
| history_list（50 条） | 5 ms | 15 ms | idx_history_pinned_created 覆盖 |
| history_search（FTS5） | 8 ms | 25 ms | unicode61 tokenizer |
| history_add（含裁剪） | 4 ms | 12 ms | 单事务 UPSERT + DELETE |
| session_save_last | 2 ms | 8 ms | 单行 UPSERT |
| settings_get_all | 0.1 ms | 0.5 ms | 纯内存读 RwLock |
| secrets.get（首次） | 0.5 ms | 2 ms | OnceLock 读盘一次 + cache 命中后纯内存 |

## 10 升级与卸载

### 10.1 升级

启动时跑 `migrate()` ，按 `schema_version` 自动 apply 缺失的 migration

失败 → 返回 `JsonitaError::Sqlite` 并记录日志；备份原文件为保留设计，用户可见反馈由 design 层维护

v1 不支持 down-migration

### 10.2 卸载脚本

放在 `scripts/uninstall.sh`，同步在 README 提供。用户也可手动跑：

```
#!/bin/sh
# scripts/uninstall.sh
echo "Removing Jsonita data..."
rm -rf "$HOME/Library/Application Support/Jsonita"
rm -rf "$HOME/Library/Logs/Jsonita"
echo "Done. (Application itself is at /Applications/Jsonita.app, rm manually.)"
```
