# 附录：打包发布明细

核心语义见 [S07-packaging-distribution.md](../S07-packaging-distribution.md)。本页只列配置摘要、命令和签名变量。

## Tauri config 摘要

| 配置 | 值 |
| --- | --- |
| `productName` | `Jsonita` |
| `identifier` | `com.jsonita.app` |
| `version` | 与 `package.json`、`Cargo.toml`、About panel 对齐。 |
| `beforeDevCommand` | `pnpm dev` |
| `beforeBuildCommand` | `pnpm build` |
| `frontendDist` | `../dist` |
| window label | `main` |
| default size | `860 x 560` |
| min size | `440 x 340` |
| decorations | `false` |
| transparent | `true` |
| visible at startup | `false` |
| bundle targets | `dmg` / `app` |
| macOS minimum | `11.0` |
| network exception | `api.deepseek.com` |

## Capabilities

| permission | 目的 |
| --- | --- |
| `core:default` | 基础 Tauri 能力。 |
| `core:window:allow-start-dragging` | 自定义拖拽。 |
| `core:window:allow-start-resize-dragging` | 自定义 resize handle。 |
| `global-shortcut:default` | 注册全局快捷键。 |

## macOS entitlements

| entitlement | 值 | 说明 |
| --- | --- | --- |
| `com.apple.security.network.client` | true | DeepSeek API。 |
| `com.apple.security.automation.apple-events` | false | 默认不需要 Apple Events。 |
| `com.apple.security.cs.allow-jit` | false | Hardened runtime。 |
| `com.apple.security.cs.allow-unsigned-executable-memory` | false | Hardened runtime。 |
| `com.apple.security.cs.disable-library-validation` | false | Hardened runtime。 |

## Release commands

| 命令 | 产物 | 平台 |
| --- | --- | --- |
| `pnpm release:macos:dmg` | `.dmg` | macOS |
| `pnpm release:macos:app` | `.app` | macOS |
| `pnpm release:windows:exe` | NSIS `.exe` | Windows + MSVC |
| `pnpm release:all` | 当前平台全部可构建产物 | 当前平台 |

## 底层 Tauri build

```
pnpm tauri build --target universal-apple-darwin --bundles dmg
pnpm tauri build --target universal-apple-darwin --bundles app
pnpm tauri build --target x86_64-pc-windows-msvc --bundles nsis
```

## 签名 / 公证变量

| 变量 | 说明 |
| --- | --- |
| `TAURI_SIGNING_IDENTITY` | Developer ID Application identity。 |
| `APPLE_ID` | Apple ID。 |
| `APPLE_PASSWORD` | App-specific password。 |
| `APPLE_TEAM_ID` | Team ID。 |
| `TAURI_NO_SIGN=1` | 本地临时无签名构建。 |
| `TAURI_CI=1` / `CI=true` | CI 非交互构建。 |

## Release artifact directories

| 脚本 | 输出目录 |
| --- | --- |
| macOS DMG | `release-artifacts/macos-dmg/` |
| macOS APP | `release-artifacts/macos-app/` |
| Windows NSIS | `release-artifacts/windows-exe/` |
| all | `release-artifacts/` |
