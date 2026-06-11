# 存储与会话

Jsonita 有多种本地数据，但它们不是一类东西。history 是历史记录，last_session 是显式恢复目标，settings 是配置，window.json 是窗口运行状态，secrets.json 是 API key。把这些数据混在一起会直接造成恢复错乱、隐私风险和调试困难。

## 读完这篇你应该知道

- SQLite 和 JSON 文件各自负责什么。
- history 与 last_session 为什么分开。
- settings/window/secrets 的数据主权在哪里。
- 存储失败时如何避免损坏当前编辑状态。

## 数据介质

| 介质 | 存什么 | 为什么 |
| --- | --- | --- |
| SQLite | history、last_session、schema version | 需要查询、裁剪、事务和迁移。 |
| settings.json | 用户设置 | 扁平配置，启动时加载、修改时 patch。 |
| window.json | 尺寸、智能缩放记忆 | 与窗口 runtime 绑定，不属于产品数据。 |
| secrets.json | DeepSeek API key | 本地文件、受限权限、独立于 settings。 |
| logs | 本地诊断事件 | support 用，不承载用户 JSON。 |

## History 与 Last Session

history 是可查询的操作历史，记录合法转换结果、opType、摘要、hash、pinned/starred 等信息。last_session 是一个单行恢复目标，服务于 `Cmd+Shift+L`。

合法 transform 成功可以覆盖 last_session；关闭窗口不会覆盖 last_session；`Cmd+K` 主动清空会同时清理 editor 和 last_session，避免恢复出空白。

这两个概念分开后，用户既能保留历史，又不会因为关闭或清空动作污染“找回上次”的语义。

## Settings

settings.json 是 Rust store 的职责。前端启动时读取 settings snapshot，后续 patch 通过 command 写入 Rust，Rust 成功后 emit `settings:changed`。前端收到事件后更新 UI。

旧 settings 缺字段时，Rust 默认值负责补齐；前端不应该在多个地方自造默认值。

## Window State

window.json 只记录窗口运行状态，例如用户拖拽后的尺寸、智能缩放锁定状态。位置不持久化，因为多屏用户拔掉外接屏后，记忆位置容易让浮窗出现在不可见区域。

窗口默认定位以当前鼠标所在屏为准，大小可以记忆。

## Secrets

secrets.json 只由 Rust secrets store 读写。settings payload 不能包含明文 key。测试连接时直接使用输入框当前 key，不依赖已保存 key；保存动作成功后才更新“已有 key”的 UI 状态。

## 失败语义

SQLite 写失败不能清空 editor 内存。settings 写失败时 durable settings 保持旧值，前端要展示失败而不是假装切换成功。secrets 写失败必须阻止 AI key 保存成功态。window.json 写失败不应该阻塞 JSON 主流程，但需要记录脱敏日志。

## 附录

- SQLite DDL、PRAGMA、迁移策略见 [appendix/storage-details.md](appendix/storage-details.md)。
- settings/window/secrets schema 和 IPC payload 字段见 [appendix/schemas.md](appendix/schemas.md)。
