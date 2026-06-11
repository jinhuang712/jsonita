SPEC · 章节 12

# 打包、签名、验收

tauri.conf.json 全配置 · release scripts · dmg/app/Windows exe 打包 · 签名 + notarization。

## 1 tauri.conf.json 全文

```
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Jsonita",
  "version":     "1.0.0-beta.1",
  "identifier":  "com.jsonita.app",

  "build": {
    "beforeDevCommand":   "pnpm dev",
    "beforeBuildCommand": "pnpm build",
    "devUrl":             "http://localhost:5173",
    "frontendDist":       "../dist"
  },

  "app": {
    "withGlobalTauri": false,
    "macOSPrivateApi": true,
    "windows": [
      {
        "label":          "main",
        "url":            "PROJECT.md",
        "title":          "Jsonita",
        "width":          860,
        "height":         560,
        "minWidth":       440,
        "minHeight":      340,
        "resizable":      true,
        "decorations":    false,
        "transparent":    true,
        "shadow":         true,
        "alwaysOnTop":    true,
        "visible":        false,
        "focus":          false,
        "skipTaskbar":    false,
        "dragDropEnabled":false,
        "center":         true,
        "titleBarStyle":  "Overlay",
        "hiddenTitle":    true,
        "acceptFirstMouse": true
      }
    ],
    "security": {
      "csp": null,
      "capabilities": ["default"]
    }
  },

  "bundle": {
    "active":   true,
    "category": "DeveloperTool",
    "copyright": "© 2026 Jin Huang. MIT License.",
    "longDescription":  "Tiny menu-bar JSON toolkit for macOS.",
    "shortDescription": "Tiny menu-bar JSON toolkit.",
    "targets": ["dmg", "app"],
    "icon": [
      "../assets/icons/macos/Jsonita-Light.icns",
      "../assets/icons/windows/jsonita-light.ico",
      "../assets/icons/light/png/icon-32.png",
      "../assets/icons/light/png/icon-128.png",
      "../assets/icons/light/png/icon-256.png",
      "../assets/icons/light/png/icon-512.png",
      "../assets/icons/light/png/icon-1024.png"
    ],
    "macOS": {
      "minimumSystemVersion": "11.0",
      "frameworks": [],
      "exceptionDomain": "api.deepseek.com",
      "signingIdentity":  null,                   /* 由 env TAURI_SIGNING_IDENTITY 提供 */
      "providerShortName": null,
      "entitlements": "entitlements.plist",
      "dmg": {
        "background":   null,
        "windowSize":   { "width": 660, "height": 420 },
        "appPosition":  { "x": 180, "y": 170 },
        "applicationFolderPosition": { "x": 480, "y": 170 }
      }
    },
    "windows": null,
    "linux": null
  },

  "plugins": {
    "global-shortcut": {}
  }
}
```

## 2 capabilities

```
// src-tauri/capabilities/default.json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "default permissions for main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-start-dragging",
    "core:window:allow-start-resize-dragging",
    "global-shortcut:default"
  ]
}
```

## 3 entitlements.plist (macOS)

```
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <!-- 网络（DeepSeek API） -->
  <key>com.apple.security.network.client</key>
  <true/>

  <!-- Apple Events 用于 Open in Finder / open URLs -->
  <key>com.apple.security.automation.apple-events</key>
  <false/>

  <!-- Hardened Runtime（notarization 需要） -->
  <key>com.apple.security.cs.allow-jit</key>
  <false/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <false/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <false/>
</dict>
</plist>
```

## 4 构建命令

### 4.1 本地开发

```
pnpm install
pnpm tauri dev                       # 起 vite dev + tauri host
pnpm icons regen                     # 重新生成图标派生
```

### 4.2 自动发布脚本

| 命令 | 脚本 | 运行环境 | 产物目录 |
| --- | --- | --- | --- |
| `pnpm release:macos:dmg` | `scripts/release-macos-dmg.sh` | macOS | `release-artifacts/macos-dmg/` |
| `pnpm release:macos:app` | `scripts/release-macos-app.sh` | macOS | `release-artifacts/macos-app/` |
| `pnpm release:windows:exe` | `scripts/release-windows-exe.sh` | Windows Git Bash/MSYS + MSVC | `release-artifacts/windows-exe/` |
| `pnpm release:all` | `scripts/release-all.sh` | 当前平台原生产物 | `release-artifacts/` |

```
# macOS dmg（默认 universal-apple-darwin；可用 TAURI_MAC_TARGET 覆盖）
pnpm release:macos:dmg

# macOS .app
pnpm release:macos:app

# Windows NSIS installer .exe（在 Windows runner 上执行；不是裸 exe 分发）
pnpm release:windows:exe

# 当前平台能构建的全部发布产物：
# - macOS：dmg + app，并提示 Windows exe 需 Windows runner
# - Windows：NSIS exe，并提示 macOS 产物需 macOS runner
pnpm release:all
```

脚本公共逻辑在 `scripts/lib/release-common.sh`：统一检查运行平台、执行 `pnpm tauri build`、清空并收集本次产物到 `release-artifacts/`。本地临时无签名构建可加 `TAURI_NO_SIGN=1`；CI 非交互构建可加 `TAURI_CI=1` 或使用标准 `CI=true`。

### 4.3 底层 Tauri 构建命令

```
# dmg
pnpm tauri build --target universal-apple-darwin --bundles dmg

# app
pnpm tauri build --target universal-apple-darwin --bundles app

# Windows installer .exe（NSIS；需 Windows/MSVC 环境）
pnpm tauri build --target x86_64-pc-windows-msvc --bundles nsis
```

## 5 macOS 签名 + notarization

当前发布节奏：v1 先用 `.dmg` + GitHub Releases 做小范围内测；内测包可先未签名或使用本机签名环境构建。扩大测试范围或公开发布前，再补 Developer ID 签名与 notarization，避免 Gatekeeper 警告。

### 5.1 前置

Apple Developer Program 账号（$99/yr）

Developer ID Application 证书（Keychain Access → Certificate Assistant）

App-specific password（appleid.apple.com → App-Specific Passwords）

### 5.2 环境变量

```
# .env.local（git ignore）
export TAURI_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
export APPLE_ID="you@example.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="TEAMID"
```

### 5.3 签名 + notarize 一条命令

```
pnpm tauri build --target universal-apple-darwin \
                 --bundles dmg

# tauri-cli 在 macOS 上若设了 TAURI_SIGNING_IDENTITY，会：
#  1. codesign .app 全部 binary
#  2. 调 notarytool 提交到 Apple
#  3. 等待审核（typically 1-15 min）
#  4. stapler staple .dmg / .app
#
# 完成后产物即可双击打开，无 Gatekeeper 警告
```

### 5.4 手动 notarize（调试）

```
# 1. 签名
codesign --deep --force --options runtime \
         --entitlements src-tauri/entitlements.plist \
         --sign "$TAURI_SIGNING_IDENTITY" \
         "src-tauri/target/release/bundle/macos/Jsonita.app"

# 2. 验证
codesign --verify --deep --strict --verbose=2 \
         "src-tauri/target/release/bundle/macos/Jsonita.app"

# 3. 打包成 zip 给 Apple
ditto -c -k --sequesterRsrc --keepParent \
      "src-tauri/target/release/bundle/macos/Jsonita.app" \
      "Jsonita.zip"

# 4. 提交 notarization
xcrun notarytool submit Jsonita.zip \
      --apple-id "$APPLE_ID" \
      --password "$APPLE_PASSWORD" \
      --team-id  "$APPLE_TEAM_ID" \
      --wait

# 5. 装订
xcrun stapler staple "src-tauri/target/release/bundle/macos/Jsonita.app"
xcrun stapler staple "src-tauri/target/release/bundle/dmg/Jsonita_1.0.0-beta.1_universal.dmg"
```

## 6 Windows 签名（v1.1+）

### 6.1 EV cert 必要性

OV cert：用户首次安装仍触发 Windows SmartScreen "Unknown publisher" 警告，要逐步累积 reputation。
EV cert：立即解除 SmartScreen 警告（白名单），但贵 5x（~$300+/yr）。

WARN

EV cert 必须存在 USB HSM token 中 ── 不能放 CI 环境变量。Windows 签名只能在本地有 token 的机器上做（或租 SignPath 这类托管服务）。

### 6.2 签名命令

```
# tauri.conf.json 设
"windows": {
  "certificateThumbprint": "<thumbprint>",
  "digestAlgorithm":       "sha256",
  "timestampUrl":          "http://timestamp.digicert.com"
}

pnpm release:windows:exe
```

Windows 对外分发的 `.exe` 指 NSIS installer exe。构建目录里的裸 `Jsonita.exe` 只适合开发或内部 smoke test，不作为正式发布物。

## 7 CI（GitHub Actions）

```
# .github/workflows/release.yml
name: release
on:
  push:
    tags: [ "v*" ]

jobs:
  build-macos:
    runs-on: macos-14         # Apple Silicon runner
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - uses: dtolnay/rust-toolchain@stable
        with: { targets: aarch64-apple-darwin,x86_64-apple-darwin }
      - run: pnpm install --frozen-lockfile
      - run: pnpm icons check
      - name: Import certificate
        env:
          CERT_P12_B64:    ${{ secrets.MACOS_CERT_P12_B64 }}
          CERT_PASSWORD:   ${{ secrets.MACOS_CERT_PASSWORD }}
          KEYCHAIN_PASSWORD: ${{ secrets.KEYCHAIN_PASSWORD }}
        run: |
          echo "$CERT_P12_B64" | base64 --decode > cert.p12
          security create-keychain -p "$KEYCHAIN_PASSWORD" build.keychain
          security default-keychain -s build.keychain
          security unlock-keychain -p "$KEYCHAIN_PASSWORD" build.keychain
          security import cert.p12 -k build.keychain -P "$CERT_PASSWORD" -T /usr/bin/codesign
          security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" build.keychain
      - name: Build & sign & notarize
        env:
          TAURI_SIGNING_IDENTITY: ${{ secrets.MACOS_SIGNING_IDENTITY }}
          APPLE_ID:               ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD:         ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          APPLE_TEAM_ID:          ${{ secrets.APPLE_TEAM_ID }}
        run: pnpm tauri build --target universal-apple-darwin
      - uses: softprops/action-gh-release@v2
        with:
          files: src-tauri/target/universal-apple-darwin/release/bundle/dmg/*.dmg
```

## 8 自动更新（v1.1+）

v1 不做。v1.1+ 用 `tauri-plugin-updater`：

```
// tauri.conf.json
"plugins": {
  "updater": {
    "active": true,
    "endpoints": [
      "https://github.com/jin-huang/jsonita/releases/latest/download/latest.json"
    ],
    "dialog": true,
    "pubkey": "<tauri update signing public key>"
  }
}
```

signing key：每个 release 用 `tauri signer sign` 生成签名，updater 客户端用公钥验证。

## 9 分发渠道（plan/04 § 7 锁定）

| 版本 | macOS | Windows |
| --- | --- | --- |
| v0.5.0 (v1) | GitHub Releases .dmg（universal arm64+x64，签名 + notarized） | — |
| v1.1+ | + `brew install jsonita` （homebrew tap cask） | .exe (NSIS) + 可选 .msi · EV 签名 |
| v1.2+ | 同上 | winget 收录 |
| v1.x | + `npx jsonita` npm 启动器 | 同上 |
