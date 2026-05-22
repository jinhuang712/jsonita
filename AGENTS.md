# Jsonita · 项目级硬约束（Codex 必读）

> 此文件是用户在协作中**明示给过 Codex 的硬规则**汇总。新会话每次开头读一遍。
> 继承 `~/.Codex/AGENTS.md` 的全局约法三章（不全 grep / 不全 cat / git 走 yummy）。

## 一、协作规范

### 1.1 累积工作必须用 TaskCreate
- 用户单条 message 出现 **≥ 2 个相关子任务**，或一项工作 **≥ 3 步**，立即 `TaskCreate`
- 完成一个就 `TaskUpdate(completed)`，**不要批量** 结尾才标
- 新需求叠加进来时**先建新 task**，再决定执行顺序

### 1.2 不确定的决策必须 AskUserQuestion
- 影响范围 ≥ 1 个章节 / ≥ 5 个文件的方向选择，必用 `AskUserQuestion`
- 不要替用户决定章节切分、精简力度、字段命名等"看上去合理"的选项
- 一次问 ≤ 3 个核心问题；用 preview 字段展示直观差异

### 1.3 完成工作必须多轨同步
- 每次 task 完成 / 新需求 / 章节新增删改 → **立刻 + 一定要** 同步：
  1. **`TODO.md`** ── 完成项**删除该行**（见 § 1.4），不只是打勾
  2. **`CHANGELIST.md`** ── Unreleased 段追加 bullet（行数 / 新增图 / 关键决策）
  3. **`index.html`** ── 仅在<b>新增 / 删除章节</b>时改 Plan / Spec / Progress 列 `<li>` 链接（README / TODO / CHANGELIST 由 index.html 运行时 fetch 加载，<b>不再有内嵌副本</b>）
  4. **`progress/0N_*.html`**（进入实施期）── 当前 active Phase 的节点状态同步
  5. **`assets/nav.js`** ── 新增 / 删除章节时同步章节列表
- 这些都是<b>用户能直接打开浏览器看到的项目面板</b>，不是我内部状态
- `TaskCreate` ≠ 同步；`TaskUpdate(completed)` ≠ 同步；要分别动手

### 1.4 TODO 完成项必须删除（不是打勾）
- 任务做完 → **从 TODO.md 删除该行**，不留 `[x]` 项
- 整个 Phase 全部完成 → 删除整段（标题 + 所有项）
- Phase 进入 progress 跟踪后 → TODO 对应段也删（防止与 progress 重复）
- TODO 永远只回答"还剩什么"；历史归 CHANGELIST.md（那里允许堆叠）

### 1.5 完成小节点必须 git commit（但不主动 push）
- "小节点" = 一组逻辑相关的改动（一个 spec 章节重写完 / 一个 progress 子任务完 / 一次 mermaid 修 batch）
- 完成后<b>立即 git commit</b>（按既有 commit message 风格），方便阶段回退与 git log 追溯
- <b>不要主动 git push</b> ── 除非用户明确说"push"。这是用户偏好（本地先稳定，再统一推）
- commit 前的清单：(a) git status 看是否有遗漏；(b) git diff 看改动是否对齐 commit message；(c) 涉及 spec/plan/progress 改动须先按 § 1.3 完成多轨同步再 commit
- 例外：纯调试 / 失败的中间态不 commit；待整理的 WIP 用 git stash

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
- **spec/** 00-15 共 16 篇 ── 技术设计
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
  - `13_schemas` 数据模型参考（Rust / TS / SQL / config schema 唯一权威）
  - `14_i18n_a11y` 国际化 & 无障碍
  - `15_logging` 日志 & 可观测性
- **progress/** 实施跟踪（5 篇对齐 Phase 1-5）
  - `01_m0_skeleton` Tauri 脚手架 + tray + 浮窗 POC + 全局快捷键 + dmg 跑通
  - `02_m1_core_json` CodeMirror + Formatter + TreeView + 历史 + 会话 + 嵌套解开 + 单窗
  - `03_m2_ai_settings` DeepSeek + Keychain + 设置面板 + 自定义快捷键 + 签名公证
  - `04_m3_polish_cross` 主题动效 + Empty State + 中文 UI + a11y 验收 + Windows
  - `05_v11_distribution` brew tap + npm wrapper + 自动更新 + 日志导出

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

### 4.5 spec 内容禁区（用户多次反馈"不必要的废话"）
- ❌ **"发布 checklist"清单**（cargo test / git tag / pnpm build 等命令清单） ── 这是过程性 runbook，归 progress / README，不归 spec
- ❌ **"承上启下"小作文段尾**（"本章是 spec 终点" / "下一阶段进入 progress" / 列举下游章节关系） ── spec 各章本身有跨章 link，13/14/15 已有"对接表"，不需要小尾巴
- ❌ **"会话总结"式段尾**（"以上是…的设计" / "至此完成…"） ── 内容已经讲完，不需要总结
- ❌ **事实错误的"宏观断言"**（"此章是 spec 终点" 但其实后面还有章 / "v1 仅 macOS" 但 plan/04 § 7 已含 Windows） ── 写之前用 ls / grep 验证现状
- ❌ **重复 mockups 的视觉描述**（每章节自己画一遍 UI）── 链 01 § X 即可（§ 3.2）
- ✅ 允许的"对接"形式：在章末或合适位置用<b>表格</b>列"本章与 13 schemas 哪节对应 / 与 02 IPC 哪个 command 对应"── 信息密度高，不算废话

### 4.6 mermaid 写法
- 所有节点 label 用 `["..."]` 引号包裹（含 `:` `/` `*` `(` `)` 等字符必须）
- edge label 用 `|"..."|` 引号包裹；<b>不放</b> `→` `/` `*` `（）`
- stateDiagram-v2 transition label 用 `<br/>` 换行，不用 `→`
- 详细规则见 memory `mermaid-safe-syntax`

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

### 5.3 完成小节点时（强制 4 步，不允许跳）
1. **TaskUpdate(completed)** ── 单个动作完成
2. **Edit `TODO.md`** ── 删除完成项行（不打勾）；新需求加在对应 Phase 段
3. **Edit `CHANGELIST.md`** ── Unreleased 段加 bullet（行数 / 关键决策）
4. **新增 / 删除章节才动 `index.html` + `assets/nav.js`** ── 改 Plan/Spec/Progress 列链接 + nav.js 章节定义；README / TODO / CHANGELIST 由 index.html 运行时 fetch 加载，<b>没有内嵌副本要同步</b>
5. **git commit**（按 § 1.5）── <b>不</b> push

> 历史教训：之前 index.html 内嵌 README/TODO/CHANGELIST 副本，导致每次改 .md 都要同步内嵌 script ── 频繁漏改让用户反复反问"index 没更新哦"。**现在删了内嵌，单源 .md ── 同步规则随之简化**。同步成本降到只有"章节列表"一项。

## 六、Progress 迭代规则

详见 memory `progress-iteration-rules`（10 条）。Codex 要点：

### 6.1 progress 的边界
- 仅规划"该阶段完成什么 + 验收 + 测试"，<b>不</b>写实现 / commits / 代码
- 绝对不含新需求 / 新功能 ── 新需求一律回 spec / plan 改，再回 progress 反映
- 不拆很细 ── 5 篇对齐 Phase 1-5，每篇 5-10 个里程碑节点

### 6.2 状态与切换
- 每篇 progress 顶部明示状态：`planned` / `active` / `completed`
- 退出条件第一节明文写"达到什么算完成"（否则"完成不改"形同虚设）
- <b>同时刻只 1 个 active Phase</b>；M0 → M1 → M2 → M3 顺序锁定
- completed Phase 视为档案，<b>不再修改</b>

### 6.3 Tasks 必须细于 Progress
- progress 节点 = 里程碑 / 交付物（粗）
- `TaskCreate` = 实施具体步骤（细，一个 progress 节点通常对应多个 task）

### 6.4 spec ↔ progress 双向同步
- 实施发现 spec 错 → <b>先回改 spec + CHANGELIST</b>，再继续 coding
- progress 加链接"spec/XX 在 M1 实施中发现 Y 问题 → 已更新到 vN"
- 防止 spec 变成"半年前的化石"

## 七、测试策略

### 7.1 核心边界（必须单测）
- **Rust `engine::*` 纯函数**：format / minify / unwrap (walk + 超时) / json_to_string / string_to_json / unescape / sort_keys_recursive / error_loc::map ── 这些是 JSON 引擎核心，单测护住
- **Rust `ai::validate::extract_json`** ── 3 个 case 必须单测
- **前端 utility**（如 `panes/diff.ts` 的 `computeDiff` / `tree/jsonpath.ts` 的 path 计算）── 若是纯函数也单测

### 7.2 不写单测的范围（手动验收）
- UI 交互（点击 / 拖拽 / 键盘）── 手动验收清单见各 `progress/0N_*.html` § acceptance（spec 末尾不再承载 checklist；progress 是唯一权威）
- IPC handler（薄层 wrapper）── 集成测试 / 手动呼出走一遍
- DB CRUD（rusqlite 已经被它自己的测试 cover）
- AI HTTP（reqwest）── 手动测一次连通即可，不 mock
- 窗口 / 菜单栏 / 系统快捷键 ── 平台 API，无法 mock，只能手动

### 7.3 CI（GitHub Actions）跑什么
- `cargo test`（engine + validate 单测）
- `cargo build --release`（验证编译通过）
- `pnpm tsc --noEmit`（类型检查）
- `pnpm lint`（代码风格）
- <b>不</b>跑 UI e2e / Playwright（投入产出比低）

### 7.4 Phase 完成 = 跑全量手动 checklist + 打 git tag
- 每 Phase 完成时：跑当前 Phase 验收清单 + 之前 Phase 的回归 checklist
- `git tag 0.x.0-mN`（对齐 CHANGELIST 版本表）
- 不主动 push（§ 1.5）
