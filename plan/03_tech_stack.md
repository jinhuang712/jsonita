PLAN · 章节 03

# 技术选型

每层选了什么、为什么、淘汰了什么。

## 1 选型总表

| 层 | 选型 | 核心理由 |
| --- | --- | --- |
| 桌面壳 | Tauri 2.x | Rust 后端 + 系统 WebView 前端；内存小、包小、跨平台 |
| 前端框架 | React 18 + TypeScript 5 + Vite 5 | JSON 控件生态最完整；社区 Tauri 模板成熟 |
| UI 组件 | Tailwind CSS + shadcn/ui | 极轻量、可裁剪、设计风格高度可控 |
| 编辑器 | CodeMirror 6 | ~150KB；语法高亮、错误标注；性能优于 Monaco |
| JSON 树渲染 | react-json-view-lite | 纯渲染组件，无重 deps |
| 状态管理 | Zustand | API 极简，bundle 几乎无感 |
| 本地存储 | SQLite（rusqlite） | 支持搜索、置顶、收藏；零外部进程 |
| 密钥存储 | 本地 `secrets.json` （chmod 600） | 放数据目录；dev rebuild / app 更新不弹系统凭据授权；跨平台一致 |
| HTTP 客户端 | reqwest（Rust） | 调 DeepSeek 用；Tauri 已默认集成 fetch plugin |
| 全局快捷键 | tauri-plugin-global-shortcut | 官方插件，多平台一致 API |
| 菜单栏图标 | Tauri tray-icon API | 原生 macOS NSStatusItem 封装 |
| 打包 | Tauri bundler + release scripts | macOS 输出 .dmg/.app；Windows 输出 NSIS installer .exe；产物统一收集到 `release-artifacts/` |
| 未来扩展 | Windows 10+ | 同一份代码 + Windows/MSVC runner 构建安装包；正式分发需代码签名 |

## 2 关键取舍

### 2.1 为什么选 Tauri 而非 Swift / Electron

| 选项 | 优势 | 劣势 | 结论 |
| --- | --- | --- | --- |
| Swift / SwiftUI | 内存最小（~20MB）、原生体验 | 仅 macOS；Windows 需另写一遍 | ❌ 锁定单平台 |
| Tauri 2.x | ~50-80MB 内存、~10MB 包；跨平台 | Rust 学习曲线；社区较新 | ✅ 采用 |
| Electron | 生态最成熟、开发最快 | 内存 150-300MB、包 ~80MB | ❌ 违背「极轻量」 |

### 2.2 为什么选 React 而非 Svelte / Vue

JSON 类控件生态压倒性优势：CodeMirror 6 / react-json-view-lite / monaco-react 等均有成熟 React 封装。Tauri 官方模板与 React 契合度最高。Svelte 体积更优但生态薄；Vue 中性但无明显优势。

### 2.3 为什么选 CodeMirror 6 而非 Monaco

| 对比 | Monaco | CodeMirror 6 |
| --- | --- | --- |
| 包体积 | ~3MB | ~150KB |
| 初始化耗时 | ~300ms | ~30ms |
| JSON 高亮 | 需 worker | 原生支持 |
| WebView 兼容性 | 较重 | 极佳 |

对一个浮窗工具，启动速度比 IDE 级编辑能力重要 10 倍 → 选 CodeMirror 6。

### 2.4 为什么选 SQLite 而非 JSON 文件

历史记录需要搜索、置顶、收藏过滤 → JSON 文件需全加载到内存解析

SQLite 体积小（rusqlite 静态编译 ~600KB）、零外部进程、支持索引

未来若加 tag 等结构化字段，扩展成本低

### 2.5 为什么 API key 用本地 secrets.json

对个人本地工具：数据目录已是 per-user 隔离（ `~/Library/Application Support/Jsonita/` ）， `chmod 600` 限制只本人可读；威胁模型对得上

跨平台一致：Windows / Linux 都用同一文件方式；无需系统凭据库抽象层

体验稳定：无系统凭据授权弹窗、无 codesign 身份依赖、dev rebuild / app 更新不丢 key

权衡：不依赖 OS 加密层；安全边界由用户家目录权限 + 文件 `0600` 承担

## 3 关键依赖列表

### 3.1 Rust 后端（src-tauri）

| Crate | 用途 |
| --- | --- |
| `tauri` | 核心运行时 |
| `tauri-plugin-global-shortcut` | 全局快捷键 |
| `clipboard-manager` | 保留依赖；当前剪贴板读取命令返回空 sniff |
| 自写 JSON Store | `SettingsStore` /`WindowStore` 持久化设置与窗口尺寸 |
| `rusqlite` | SQLite 客户端 |
| `dirs` | 跨平台数据目录定位（ `secrets.json` / settings.json / window.json 路径） |
| `reqwest` | 调 DeepSeek HTTP |
| `serde / serde_json` | JSON 解析（兼做 Formatter 后端） |
| `tokio` | 异步运行时 |

### 3.2 前端（src）

| NPM 包 | 用途 |
| --- | --- |
| `react / react-dom` | UI 框架 |
| `typescript` | 类型系统 |
| `vite + @vitejs/plugin-react` | 构建 |
| `tailwindcss` | 样式 |
| `@codemirror/state / view / lang-json` | 编辑器 |
| `react-json-view-lite` | JSON 树 |
| `zustand` | 状态 |
| `@tauri-apps/api` | 前后端 IPC |
