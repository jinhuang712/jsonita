# JSON Engine

JSON engine 是 Jsonita 最核心的纯逻辑模块。它把文本变成格式化 JSON、压缩 JSON、字符串字面量或解开的嵌套 JSON，但不关心 UI、不写历史、不读设置、不调用 AI。

## 读完这篇你应该知道

- 每个 JSON 操作的输入、输出和失败类型。
- 为什么 v1 选择 `serde_json`。
- nested stringified JSON unwrap 的策略和边界。
- engine 如何避免 UI 副作用。

## 能力范围

| 操作 | 输入 | 输出 | 失败 |
| --- | --- | --- | --- |
| Format | JSON 文本 + format option | pretty JSON | parse error，带 line/column。 |
| Minify | JSON 文本 | compact JSON | parse error。 |
| Sort keys | object/array | 递归排序后的 JSON | parse error。 |
| JSON to String | JSON 文本 | escaped string literal | parse 或 escape failure。 |
| String to JSON | JSON 字符串字面量 | JSON 文本 | unescape/parse failure。 |
| Unwrap stringified | 含嵌套 JSON 字符串的 JSON | 递归解包后的 JSON | parse error 或 timeout。 |

## 技术路径

v1 使用 `serde_json` 作为 parser/serializer。原因是它严格、稳定、生态成本低、能给出错误位置，并且性能足以覆盖 Jsonita 的目标文件范围。自研 parser、`nom`、`pest` 都不是 v1 范围，除非后续有明确性能或语义缺口。

engine 函数保持纯函数：输入是 text 和 options，输出是 string 或 `JsonitaError`。timeout、max depth、size limit 这类策略由调用方传入，engine 不自己读取 settings。

## Unwrap 策略

嵌套 stringified JSON 常见于网关包裹、Go proto 序列化和日志字段。unwrap 的规则是：先解析外层 JSON，然后递归检查 string value 是否本身是合法 JSON；合法则替换为对应 JSON value，不合法则保持原字符串。

为避免恶意或极端输入卡死，unwrap 必须受 timeout 和 max depth 保护。超时是可恢复失败，前端应保持原输入，并提示用户关闭 auto unwrap 或调整阈值。

## 结果如何进入 UI 和存储

engine 不决定结果是否覆盖 input，也不决定是否写 history。前端在双栏模式展示 output，在单窗模式等待 `Cmd+Enter` apply。Rust command 或上层 service 在成功后才可能更新 last_session/history。

这条边界很重要：engine 失败永远不能直接损坏 editor，也不能写入持久化。

## 失败语义

Parse 失败要保留 line/column。String 转换失败归 parse 类失败，不归 storage 或 IPC。UnwrapTimeout 是可恢复失败，用户输入保持不变。任何 engine 错误都不能把部分结果伪装成成功 JSON。

## 附录

- 函数签名、option 字段、算法细节和测试样例见 [appendix/json-engine-details.md](appendix/json-engine-details.md)。
- option payload 的完整字段见 [appendix/schemas.md](appendix/schemas.md)。
