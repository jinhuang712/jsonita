# 打包与分发

打包 spec 定义 Jsonita 如何从源码变成可安装产物，以及什么时候可以发布。它不决定功能范围和 UI，但它决定版本一致性、产物类型、签名/公证边界和发布失败语义。

## 读完这篇你应该知道

- v1 beta 走什么发布路径。
- 哪些版本号必须一致。
- DMG、APP、NSIS、Homebrew、Updater 的边界。
- 哪些打包失败必须阻止发布。

## v1 beta 发布路径

v1 beta 的主路径是 GitHub Releases + macOS `.dmg`，用于小范围内部测试。`.app` 产物可以用于本地验证；Windows NSIS 由对应脚本支持，但不是当前 macOS beta 主链路。

Homebrew Cask、Tauri updater、npm wrapper 和更广泛分发都属于 v1.1+，必须等稳定 release URL、sha256、签名策略和更新通道确定后再进入主线。

## 版本一致性

发布前必须确认 `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json` 和 About panel 的版本一致。任何一个版本漂移都应阻止发布，因为用户、产物、release notes 和 support 日志会无法对齐。

## 产物边界

| 产物 | 当前状态 | 说明 |
| --- | --- | --- |
| macOS `.dmg` | v1 beta 主产物 | GitHub Release 附件。 |
| macOS `.app` | 本地/手动验证 | 可用于 smoke test。 |
| Windows NSIS `.exe` | 脚本支持 | 需要 Windows runner 和签名策略。 |
| Homebrew Cask | v1.1+ | 需要稳定 URL 和 sha256。 |
| Updater metadata | v1.1+ | 需要 signing/update channel 决策。 |

## 签名、公证和权限

小范围 beta 可以先不完成公开分发级别的签名/公证，但公开发布必须补齐 macOS signing/notarization。Tauri capabilities 和 entitlements 保持最小化，只开放实际需要的 command 能力。

## 失败语义

打包失败是 release blocker，不存在 runtime fallback。notarization 失败、checksum 缺失、版本不一致、capability 配置缺失都必须停止发布。不能发布一个“基本能用但 metadata 错”的产物。

## 附录

- Tauri config、capabilities、entitlements、release script、CI、签名和分发命令见 [appendix/packaging-details.md](appendix/packaging-details.md)。
