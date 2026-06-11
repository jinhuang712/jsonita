# V00 · Validation Matrix

本附录记录 Jsonita 常用验证入口。它不替代 CI，也不把未执行命令写成通过；每次改动只跑与风险相称的子集，并在最终回复或 changelist 中报告实际结果。

## 文档变更

| 场景 | 验证 | 通过标准 |
| --- | --- | --- |
| 修改 `AGENTS.md` / `CLAUDE.md` | `diff -u AGENTS.md CLAUDE.md` | 两个入口完全一致。 |
| 修改 Markdown 文档 | `git diff --check` | 无 trailing whitespace、冲突 marker 或 whitespace error。 |
| 改文档链接或重命名文件 | 运行 Markdown 相对链接检查脚本或等价检查。 | 仓库内相对链接都能解析到文件或 heading。 |
| 清理旧文档系统 | 残留搜索 `.cast-docs`、旧文档 `.html` 链接、旧 spec 文件名。 | 只允许运行时 HTML，例如 `src/index.html`；Markdown 不链接仓库内 `.html`。 |

## 前端变更

| 场景 | 验证 | 通过标准 |
| --- | --- | --- |
| React、store、editor、search UI | `pnpm build` 或更窄的 TypeScript/test 命令。 | 构建或类型检查退出 0。 |
| CodeMirror 行为 | 浏览器或 Tauri 手动验证目标交互。 | 原始复现场景被覆盖，滚动、focus、selection 无明显回归。 |
| i18n 文案 | 搜索新增 key 的引用和 locale 覆盖。 | 没有裸 key、缺失翻译或已删除文案残留。 |

## Rust / Tauri 变更

| 场景 | 验证 | 通过标准 |
| --- | --- | --- |
| Rust domain 或 command | `PATH="/Users/jin.huang/.cargo/bin:$PATH" cargo check --manifest-path src-tauri/Cargo.toml` | Cargo check 退出 0。 |
| Tauri 配置或窗口行为 | `PATH="/Users/jin.huang/.cargo/bin:$PATH" pnpm tauri dev` 或对应 package build。 | App 能启动，目标窗口/权限/快捷键路径可操作。 |
| Packaging script | 对应 `pnpm release:*` 命令。 | 产物进入约定 `release-artifacts/` 子目录。 |

## Release 变更

| 场景 | 验证 | 通过标准 |
| --- | --- | --- |
| 版本号改动 | 比对 `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`、About panel。 | 版本完全一致。 |
| macOS DMG | `pnpm release:macos:dmg`，随后 `hdiutil imageinfo` 与 sha256 检查 | `.dmg` 存在、版本可识别、imageinfo 成功、checksum 可写入 release notes；发布后 GitHub asset 名称和 sha256 与本地一致。 |
| macOS APP | `pnpm release:macos:app` | `.app` bundle 存在且能打开或进入后续签名流程。 |
| Windows NSIS | Windows/MSVC 环境执行 `pnpm release:windows:exe` | 生成 NSIS installer `.exe`，不是裸 exe。 |

## 残留检查清单

| 残留 | 检查目标 |
| --- | --- |
| 旧 spec 编号 | 不应再出现旧数字序列文件作为当前链接。 |
| 未编号附录 | 不应再链接旧的未编号 appendix 文件名。 |
| CAST 文档系统 | 不应出现 `.cast-docs/`、CAST JSON 源、CAST render/check 脚本作为当前文档系统。 |
| ASCII diagrams | Markdown 文档不使用 ASCII diagram；系统关系用 Mermaid 或表格。 |
| Repo HTML 文档链接 | Markdown 不链接仓库内 `.html` 文档；运行时 `src/index.html` 不属于文档源。 |
