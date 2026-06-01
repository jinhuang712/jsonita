<p align="center">
  <img src="assets/icon-mark-transparent-2048.png" alt="Jsonita logo" width="96" height="96">
</p>

# Jsonita

**Tiny menu-bar JSON toolkit for macOS — paste, format, fix, copy. ⌘⇧J.**

一款常驻 macOS 菜单栏、按全局快捷键瞬时呼出的极轻量 JSON 工具集 · 浮窗 P95 < 500 ms · 内存稳态 < 80 MB · 隐私零上传。

> 截图与演示 GIF 待 v1.0 发布前 (M3-N6) 录入；当前请直接 `pnpm tauri dev` 起本地实例预览。

---

## 功能（v1.0 范围）

| 功能 | 说明 |
|---|---|
| **JSON 格式化** | 缩进 2 / 4 / Tab · sort keys · trailing newline 可配 |
| **Minify** | 单行压缩 |
| **Tree 视图** | JSON 树展开折叠 · 类型染色 |
| **String ↔ JSON 互转** | 4 层嵌套转义往返一致 |
| **嵌套 stringified 解开** | Golang proto 多层 wrap 一键展开（200 ms 全局超时兜底） |
| **AI Auto-Fix** | 粘非法 JSON → ✨ AI Fix tab → DiffView → Accept（DeepSeek，需用户自带 API key） |
| **历史记录** | SQLite FTS5 · 自动去重 · pin / star · 100 条上限 |
| **会话保留** | 合法 transform 成功后保存上次会话 · `⌘⇧L` 手动找回 · `⌘K` 清空 |
| **自定义快捷键** | 默认 `⌘⇧J` 呼出 / `⌘⇧L` 恢复；可改 + 冲突检测 + override 二次确认 |
| **智能宽度** | 粘长行自动扩宽（4 层逻辑：手动拖锁定 / soft-wrap 跳过 / smartWidth 开关 / max-chars 阈值） |
| **i18n** | English / 简体中文 |
| **隐私** | 所有用户数据本地（SQLite + `secrets.json`）· DeepSeek API key 存用户数据目录并限制文件权限 · 日志不记 JSON 内容 |

## 系统需求

- macOS 11 Big Sur 及以上
- arm64 (Apple Silicon) 或 x86_64 (Intel)
- 安装体积 < 15 MB（dmg）· 内存稳态 < 80 MB

## 安装

### v1 内测发布（优先）

```bash
# 从 GitHub Releases 下载 .dmg，拖到 /Applications 后启动。
# v1 先用 .dmg + GitHub Release 小范围内测；Homebrew / updater 后置到 v1.1+。
open https://github.com/jinhuang712/jsonita/releases/latest
```

### 当前（开发期）── 从源码构建

要求：Rust ≥ 1.77 · Node ≥ 20 · pnpm ≥ 9 · Xcode CLT。

```bash
git clone https://github.com/jinhuang712/jsonita.git
cd jsonita
pnpm install                              # 装前端依赖
cargo check --manifest-path src-tauri/Cargo.toml  # 装 Rust 依赖 + 生成 lockfile
pnpm tauri dev                            # dev mode 启动（首次 ~5 min 编译）
# 或：
pnpm release:macos:dmg                    # 生产 dmg（未签名或按本机签名环境）
```

### 发布脚本

```bash
pnpm release:macos:dmg      # macOS：构建 .dmg → release-artifacts/macos-dmg/
pnpm release:macos:app      # macOS：构建 .app → release-artifacts/macos-app/
pnpm release:windows:exe    # Windows/MSVC：构建 NSIS installer .exe → release-artifacts/windows-exe/
pnpm release:all            # 当前平台可构建的全部发布产物
```

Windows 对外发送的是 NSIS 安装包 `.exe`，不是构建目录里的裸 `Jsonita.exe`。

首次启动 macOS 会问 Accessibility 权限（全局快捷键需要）── 浮窗内 Modal 引导跳系统设置。授权后无需重启即生效。

## 基本使用

1. 装入 `/Applications/Jsonita.app`，启动。Dock 不出图标，菜单栏右上出现单色 `J` 图标
2. 任何前台 App 下按 `⌘⇧J` → 浮窗居中弹出（不抢焦点）
3. 粘 JSON → 右侧 300 ms 内出现格式化输出 · StatusBar `● Valid JSON`
4. 切 Tab：Format / Minify / Tree / →Str / →JSON
5. 粘<b>非法</b> JSON → AI Fix tab 出现 → 点击触发 DeepSeek 修复 → DiffView → Accept
6. `⌘K` 清空 / `⌘⇧L` 恢复 / `Esc` / `⌘W` 关闭
7. `⚙` 打开 Settings → 改语言、主题、快捷键、AI key

## 项目文档

| 路径 | 内容 |
|---|---|
| [`index.html`](index.html) | 📍 文档导航入口（用浏览器打开） |
| [`plan/`](plan/) | 5 篇产品设计：产品边界 / 功能 / 交互 / 技术栈 / NFR |
| [`spec/`](spec/) | 16 篇技术设计：架构 / mockups / IPC / 设计令牌 / 各模块 ... |
| [`CHANGELIST.md`](CHANGELIST.md) | 变更历史（按 Phase 顺序） |

## CAST 文档约定

本项目文档严格依赖 CAST 进行书写与维护。后来者在修改产品范围、实现计划、技术规格、TODO、Changelist 或文档入口时，需要先检查 CAST 文档骨架，并同步更新 `README.md`、`index.html`、`plan/`、`spec/`、`site/todo.json`、`site/changelist.json`、`todo.html`、`changelist.html`。

CAST 入口仓库：[`CAST-docs/cast-a-start`](https://github.com/CAST-docs/cast-a-start)。如后续需要重新生成或升级 HTML 文档，请同时关注 [`CAST-docs/cast-a-doc`](https://github.com/CAST-docs/cast-a-doc)。

## 当前进度（agent 实施）

| Phase | 节点 | 状态 |
|---|---|---|
| M0 Skeleton | 7/7 | ✅ agent-side 完成（待用户验收 M0-A1..A13） |
| M1 Core JSON | 9/9 | ✅ agent-side 完成（待用户验收 M1-A1..A22） |
| M2 AI + Settings | 5/6 | ✅ N1..N5 完成 · N6 macOS 签名 / 公证待整理 |
| M3 Polish | 3/6 | ✅ N1..N3 完成 · N4 多版本回归 / N6 release 待整理；Windows 不阻塞 v1 |
| v1.1+ Distribution | 0/5 | 后置（brew / npm / updater / Win EV / 日志导出） |

## 卸载

```bash
rm -rf /Applications/Jsonita.app
rm -rf ~/Library/Application\ Support/Jsonita    # 历史 + 设置 + window.json
rm -rf ~/Library/Logs/Jsonita                    # 日志
# API key 与 settings 一起在 Application Support/Jsonita 已被上一行删掉（secrets.json）
```

## License

MIT
