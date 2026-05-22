# Jsonita · 项目级硬约束（Claude 必读）

> 此文件是用户在协作中**明示给过 Claude 的硬规则**汇总。新会话每次开头读一遍。
> 继承 `~/.claude/CLAUDE.md` 的全局约法三章（不全 grep / 不全 cat / git 走 yummy）。

## 一、协作规范

### 1.1 累积工作必须用 TaskCreate
- 用户单条 message 出现 **≥ 2 个相关子任务**，或一项工作 **≥ 3 步**，立即 `TaskCreate`
- 完成一个就 `TaskUpdate(completed)`，**不要批量** 结尾才标
- 新需求叠加进来时**先建新 task**，再决定执行顺序

### 1.2 不确定的决策必须 AskUserQuestion
- 影响范围 ≥ 1 个章节 / ≥ 5 个文件的方向选择，必用 `AskUserQuestion`
- 不要替用户决定章节切分、精简力度、字段命名等"看上去合理"的选项
- 一次问 ≤ 3 个核心问题；用 preview 字段展示直观差异

### 1.3 完成工作必须同步 TODO.md
- 每次 task 完成或新需求加入，**立刻** Edit `TODO.md`
- TODO.md 是用户能直接读的进度面板，**不是** 我内部状态
- `TaskCreate` ≠ 同步 TODO.md，两者必须双轨

## 二、执行禁令

### 2.1 严禁 `cd`
- 所有 Bash 命令使用 **absolute path**
- 例：`ls /Users/jin.huang/dev/projects/jsonita/spec`，不写 `cd ... && ls`
- 用户已警告过一次

### 2.2 严禁 ASCII box-drawing 原型图
- 不允许 `┌─┐ │ └─┘` 这种伪 UI 框线
- 文件目录树（`├─ └─`）允许 ── 那是文档惯例不是原型图
- UI 必须用 HTML/CSS mockup（`.mockup-window` 等组件）

### 2.3 git / 终端操作
- 本项目位于 `~/dev/projects/jsonita/`，**不在 `~/dev/repository/` 下**，按 global 约法三章 § 3：**直接用 `git`**（含 `git -C <abs-path>` 模式），<b>不走</b> yummy
- yummy 仅限 `~/dev/repository/` 下的仓库
- 不要替用户跑 `tauri build` / `cargo build` / `pnpm install` 等实际安装/构建命令

## 三、文档结构规则

### 3.1 章节切分（已固定）
- **plan/** 00-04 共 5 篇 ── 产品边界
- **spec/** 00-12 共 13 篇 ── 技术设计
  - `00_architecture` 系统架构
  - `01_mockups` 原型图 & 交互细节 ← **visual source of truth**
  - `02_ipc` IPC 合约
  - `03_design_tokens` 设计令牌
  - `04_components` 组件库映射
  - `05_icons_theme` 图标资源 & 主题
  - `06_window` 窗口 runtime
  - `07_menubar` 菜单栏 & 快捷键
  - `08_editor` 编辑器 & 树 UI
  - `09_json_engine` JSON 引擎
  - `10_storage` 存储 & 会话
  - `11_ai_client` AI 客户端
  - `12_packaging` 打包、签名、验收
- **progress/** 待 spec 完结后启动

### 3.2 mockups 是唯一权威
- `spec/01_mockups.html` 是所有 UI 视觉的**唯一权威**
- 其他章节不重复画 UI ── 视觉描述一律 → `链接到 01 § X`
- 不允许同一 UI 在两章节同时出现两份描述

### 3.3 doc-header 极简
- 只放 `doc-tag` / `doc-title` / `doc-subtitle`
- **不放** 状态 / 版本 / 日期 / 负责人 / "章节 N / 9" 假分数
- 这些信息归 git / CHANGELIST

## 四、内容密度规则（spec）

### 4.1 代码 vs 文字
- spec 是技术设计，**不是代码仓库**
- 比例：~70-80% 文字/表格 + 20-30% 代码
- 完整可运行代码归 `src/` / `src-tauri/`

### 4.2 必须用表格而不是代码块的场景
- Rust struct / enum 字段定义 → `<table>`（字段 / 类型 / 含义 / 默认值）
- SQL DDL → 字段表 + 索引表
- TypeScript interface → 字段表
- `tauri.conf.json` / `Cargo.toml` / `package.json` 全文 → 关键 key 表

### 4.3 必须保留代码块的场景
- **核心算法**：≤ 20 行的关键逻辑（如 unwrap 递归 / prompt 模板 / linter merge）
- **接口签名一行**：`async fn name(args: Args) -> Result<T, E>`
- **配置文件中最关键的 3-5 行**（如 NSPanel styleMask 设置）

### 4.4 必须删除的内容
- 完整函数体（保留签名）
- 模板化 setup / register handler 代码
- 重复同质化 IPC command 实现（保留一个 + 表格列其他）
- 完整 React component 实现（保留 props interface）

## 五、记忆与同步

### 5.1 每次会话开头
1. 读本文件
2. 读 `TODO.md` 看进度
3. 读 `CHANGELIST.md` 看最近变更
4. **不要** 假设 spec 在哪个状态 ── 用 ls 确认

### 5.2 用户提反馈时
1. 立即承认 ── 不要狡辩
2. TaskCreate 新工作
3. 必要时 AskUserQuestion 对齐
4. **再** 动手

### 5.3 完成工作时
1. TaskUpdate(completed)
2. Edit TODO.md 同步进度
3. 必要时 Edit CHANGELIST.md
4. 必要时 Edit `index.html` 内嵌 README/TODO/CHANGELIST 同步
