PLAN · 章节 04

# 非功能性需求（NFR）

性能、隐私、可用性、兼容性，每项都有可测量的目标。

## 1性能

| 指标 | 目标 | 测量方式 |

| --- | --- | --- |

| 冷启动（首次菜单栏点击 → 浮窗可交互） | < 800ms（首次）/ < 500ms（已驻留） | 手动秒表 + performance API |

| 呼出（快捷键 → 浮窗可交互） | < 500ms（P95） | performance.mark |

| 稳态内存 | < 80MB（编辑器空闲时） | Activity Monitor |

| 峰值内存（处理 1MB JSON） | < 200MB | Activity Monitor |

| 安装包体积（.dmg） | < 15MB | Finder |

| 10KB JSON 格式化 | < 20ms | Rust 后端 benchmark |

| 100KB JSON 格式化 | < 50ms | 同上 |

| 1MB JSON 树状渲染 | < 800ms（初次渲染完成） | 前端 performance.mark |

| 历史记录搜索（100 条） | < 30ms | SQLite 内置 timing |

| AI Fix 响应（DeepSeek） | P50 < 3s / P95 < 8s | 客户端日志 |

## 2隐私

本地处理 ：JSON 内容完全本地（Rust + WebView），除 AI Auto Fix 用户主动触发外不联网

密钥管理 ：

  DeepSeek API key 存本地 `~/Library/Application Support/Jsonita/secrets.json` ， `chmod 600` 限制只本人可读

  UI 上始终显示为 `••••••••` ，不显示明文

  读取 key 时仅在 IPC 调用栈内传递；不进 settings.json / 日志 / event payload

无 telemetry ：首版本不收集任何使用数据 / 崩溃日志（如未来开启，必须用户显式同意）

请求最小化 ：调 DeepSeek 时只发送当前编辑器内容 + parse 错误信息，不发送历史记录、文件名、机器信息

本地数据透明 ：历史 SQLite 文件路径公开（ `~/Library/Application Support/Jsonita/history.db` ），用户可直接查看 / 删除

卸载清理 ： `rm -rf ~/Library/Application Support/Jsonita` 一句清空（历史 + 设置 + secrets.json）； `rm -rf ~/Library/Logs/Jsonita` 清日志

## 3可用性

失焦行为可控 ：默认失焦隐藏，设置可关闭

主题适配 ：跟随系统亮 / 暗模式，可手动覆盖

全键盘可达 ：所有核心功能都有快捷键（详见 [01 · F6 全局快捷键](01_features.md) ）

语言 ：v1 首版本 UI 仅英文；中文 UI 在 M3 阶段

Empty State ：所有面板（无 JSON / 无历史 / 无 API key）都有清晰的引导提示

## 4兼容性

| 平台 | 支持版本 | 说明 |

| --- | --- | --- |

| macOS | 11 (Big Sur) 及以上 | Tauri 2.x 最低要求 |

| 架构 | Apple Silicon (arm64) + Intel (x64) universal | .dmg 内含 universal binary |

| Windows | 10 / 11（M3 阶段评估） | 同一份代码，Tauri 自动构建 |

| Linux | v1 不支持 | 受众小 + GTK / WebKitGTK 适配成本 |

## 5可靠性

崩溃容忍 ：前端崩溃不影响菜单栏（Rust 端独立）；可一键 reload 浮窗

数据丢失 ：所有用户输入在浮窗关闭前自动入历史；历史写入用事务保证一致

升级安全 ：自动检测旧版本数据 schema，自动迁移；当前迁移失败会回滚并报错，备份文件为保留设计

网络容错 ：DeepSeek 调用失败时清晰报错 + 重试按钮；不重试到死

## 6可观察性

v1 不做任何上报，仅在本地写按天滚动日志： `~/Library/Logs/Jsonita/jsonita.YYYY-MM-DD.log`

日志级别：INFO / WARN / ERROR（不记录用户 JSON 内容）

`open_log_dir` IPC 已实现；设置面板「打开日志目录」按钮为保留 UI

## 7分发

### 7.1v1（仅 macOS）

格式 ： `.dmg` （universal arm64 + x64）

签名 ：内测可先用未签名 / 本机签名 dmg；公开发给更大范围用户前补 Apple Developer ID + notarization，避免 Gatekeeper 警告

渠道 ：先用 GitHub Releases 小范围内测（ 不 上 Mac App Store —— 沙箱限制全局快捷键 + NSPanel）

更新 ：v1 用户手动下载新版（About 页提供「打开 GitHub Releases」按钮）

### 7.2v1.1+ 分发扩展

| 平台 | 格式 / 命令 | 说明 |

| --- | --- | --- |

| macOS | `.dmg` via GitHub Releases | v1 已有，继续保留 |

| `brew install jsonita` | 建立 homebrew tap（ `klook/homebrew-tap` 或独立 tap），cask 模式拉 .dmg |  |

| Windows 10/11 | `.exe` （NSIS installer） | 推荐主格式：个人用户最熟；带卸载器；菜单栏 / 自启动配置友好 |

| `.msi` （Wix） | 可选：企业批量部署、winget 仓库收录需要 MSI |  |

| 跨平台 CLI 包装 | `npx jsonita` /`npm i -g jsonita` | npm 包是个小启动器，下载对应平台 binary 到本地缓存后启动；面向 Node 生态开发者 |

| Linux | — | v1 / v2 都不做：受众小 + GTK / WebKitGTK 适配成本 |

### 7.3Windows 分发格式选型

| 格式 | 选 / 不选 | 原因 |

| --- | --- | --- |

| `.exe` (NSIS) | ✓ 主 | Tauri 默认；用户体验最接近 macOS .dmg 双击即装；体积小 |

| `.msi` (Wix) | ✓ 备 | 企业 IT 友好；winget 收录要 MSI |

| zip portable | ✗ | 用户要手动解压、放路径、设权限；菜单栏图标 / 全局快捷键依赖安装态；劝退普通用户 |

| Windows Store (MSIX) | ✗（v2 再说） | 沙箱限制 + 上架审核 + 抽成 |

### 7.4签名

macOS ：Apple Developer ID + notarization（v1 必须）

Windows ：EV Code Signing Certificate（v1.1+ Windows 发布前完成；未签名会触发 SmartScreen 警告劝退用户）

### 7.5自动更新

v1 不做

v1.1+ 接入 `tauri-plugin-updater` ：跨平台一致 API + 签名验证；增量更新
