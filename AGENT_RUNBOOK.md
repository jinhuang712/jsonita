# Agent Runbook · Jsonita 实施期 SOP

> **谁读**：每个进入项目动手实施的 coding agent（Claude / Codex / 其他）。
> **何时读**：动 `src/` / `src-tauri/` 之前 100% 读一遍。
> **保持短**：本文只写**强制性 SOP**，背景设计回 [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md)。

---

## 1 · 开工前 6 个动作（按顺序）

1. **读** [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md) ── 项目硬约束 + 工作流
2. **读** [`progress/manifest.json`](progress/manifest.json) ── 看 `active_phase` 字段
3. **读** 对应 active phase 的 `progress/0N_*.html`（顶部 callout 看 status / version_target）
4. **读** [`TODO.md`](TODO.md) + [`CHANGELIST.md`](CHANGELIST.md) ── 看最近变更
5. **`ls`** spec/ + progress/ + progress/tasks/ ── 确认现状（不假设）
6. **不**直接动手 ── 先 `TaskCreate` 拆步骤（CLAUDE.md § 1.1）

---

## 2 · 判定 active phase 与可做节点

```bash
# 查 active phase
cat progress/manifest.json | python3 -c "import sys,json; m=json.load(sys.stdin); print(m['active_phase'])"

# 列出当前 phase 所有节点 + 状态 + blocked_by
cat progress/manifest.json | python3 -c "
import sys, json
m = json.load(sys.stdin)
ap = m['active_phase']
for p in m['phases']:
    if p['phase'] == ap:
        for n in p['nodes']:
            print(f\"  {n['node']}: {n['status']} | blocked_by: {n.get('blocked_by',[])}\")
"
```

**可做节点 = `status == 'planned'` 且 `blocked_by` 中所有节点都已 `completed`**。

不能找到可做节点（全部 blocked / done）时**停下来问用户** ── 不要跨 phase 抢跑。

---

## 3 · 选 task card

1. 找到一个可做节点（如 `M0-N1`）
2. 打开 `progress/tasks/M0-N1_*.md`
3. **必读** § Goal / § Context / § Write Scope / § Do Not Touch
4. 按 § Deliverables 拆 `TaskCreate` 步骤
5. 动手前 `TaskUpdate(in_progress)` ── 标节点为 `in_progress` 在 progress html 中（找该节点的 `<tr><td>status</td><td><code>` 行，把 `planned` 改成 `in_progress`）+ manifest.json 中对应 `status` 字段

---

## 4 · 不可越界的"Do Not Touch"

每张任务卡 § Do Not Touch 是**红线**。常见违规：

- ✗ 在 M0 节点引入 `serde_json` 业务调用（属 M1-N2）
- ✗ 在 M1 节点写 AI Fix UI（属 M2-N4）
- ✗ 在 M2 节点改 a11y aria 属性（属 M3-N3）
- ✗ 在 M0-N3 写 Windows 窗口实现（属 M3-N5）

**触发越界检测**：commit 前看 `git diff --stat` ── 修改的文件不在本节点 § Write Scope 内 → 立即 stash + 问用户。

---

## 5 · 何时**必须**回改 spec（spec ↔ progress 双向同步）

实施过程中若发现下列任一条件，**先改 spec + CHANGELIST**，再继续 coding：

- spec 描述的接口签名 / API 与实际可用版本冲突（如 Tauri 2.x 实际行为）
- spec 的数据契约（13_schemas.html）需要增删字段
- spec 的算法描述（如 unwrap 200ms 超时）在真实数据上无法保证
- spec 的资源命名 / 路径在 macOS 真实环境下不可行
- spec 中的"事实性断言"（如"macOS 11 支持 X"）经测试不成立

回改流程：
1. `TaskCreate` 加一项"spec/XX § Y 回改"
2. 改 spec html
3. CHANGELIST.md `Unreleased` 段记一行：`spec/XX § Y 因 M0-N3 实施发现 → 更新 vN`
4. 当前 progress html 在 § risks 表加一行"spec/XX § Y 已更新"
5. 继续原 coding

**绝不**：spec 与实现不一致仍继续 coding。

---

## 6 · 完成节点 = 强制 5 步同步（CLAUDE.md § 5.3）

每完成一个节点：

1. **TaskUpdate(completed)** 所有相关任务
2. **改 progress html** 该节点 `<tr><td>status</td>` 行：`in_progress` → `done`；填 `commit / tag` 字段（具体 SHA / tag 名）；填 `verification` 实际跑过的命令
3. **改 manifest.json** 对应节点 `status` 字段 + 顶层 `active_phase`（如切 Phase）
4. **改 CHANGELIST.md** `Unreleased` 段加 bullet：`M0-N3 NSPanel POC 完成 (commit <sha>) ── 通过 M0-A4/A6/A7/A8`
5. **`git commit`**（不 push；CLAUDE.md § 1.5）

**完成整个 Phase 时**多两步：
- 跑全 Phase 验收 checklist（progress 中 § acceptance 全过）
- `git tag <version-target>`（如 `0.3.0-m0` / `0.4.0-m1` / `1.0.0`）── 见 manifest 中 `tag_on_complete`
- 切下个 Phase status `planned` → `active`（同时改 manifest `active_phase`）

---

## 7 · Verification Log（每节点完成都要填）

每篇 `progress/0N_*.html` 末尾有 § Verification Log 表（M0 / M1 / M2 / M3 / D 各一）。完成节点时**必须**追加一行。

字段（8 列）：

| date | commit | machine/os | commands run | manual passed | manual failed | logs/screenshots | notes |

填写规则：
- `date`：当天日期 `YYYY-MM-DD`
- `commit`：本节点 commit SHA 前 7 位
- `machine/os`：自己测试机的 OS 版本（如 `macOS 14.5 / M1 Pro`）
- `commands run`：跑过的 `cargo test` / `pnpm tsc` 等
- `manual passed`：通过的用例 ID `M0-A1, A4, A6`
- `manual failed`：失败的用例 + 原因 `M0-A7 (fullscreen 上看不到 ── 因 macOS 15 bug，已记 spec/06 § risks)`
- `logs/screenshots`：路径或 issue link
- `notes`：自由发挥（如"M3-N5 跳过原因：无 Windows 测试机"）

---

## 8 · 文档改动后必须跑

```bash
node scripts/verify_doc_links.mjs
# 输出应是 "0 broken links"
```

任何 progress / spec / docs / README 改动 → 跑一次。**broken link 不允许进 commit**。

---

## 9 · 触碰 secrets / 证书 / Keychain 的红线

下列动作**绝不**在没有用户**明确授权**的情况下做：

- 读取 / 修改 macOS Keychain（除非用户当面同意调 `security` 命令）
- 接触 Apple Developer ID 证书 / private key（用于 codesign + notarize）
- 接触 update signing key（D-N3 用于 tauri-plugin-updater）
- 接触 Windows EV cert hardware token（D-N4）
- 接触 GitHub Actions secrets / Apple ID password
- 接触用户的 DeepSeek API key（实施期开发自测时可用，但**永远不** commit 进 repo / 写入 settings.json）

manifest.json 中带 `do_not_touch_without_authorization: true` 字段的节点（M2-N6 / D-N3 / D-N4）**整个**属于此类。

---

## 10 · 不要实现 future phase

- M0 active 时**不**写 M1 业务代码（CodeMirror / serde_json / rusqlite / reqwest 等依赖**不引入** Cargo.toml）
- M1 active 时**不**写 Settings 面板 / AI 调用
- 即使"顺手能做"也不做 ── 跨 phase 越界 → undo

例外：spec 修正 / progress 文档修正 / CLAUDE.md 修正 ── 这些是元工作，任何时候都能做。

---

## 11 · 常见错误（不要再犯）

| 错误 | 后果 | 正确姿势 |
|---|---|---|
| 把 spec 当 implementation 来填代码 | spec 越来越像 src/ 镜像，失去设计价值 | spec 70-80% 文字/表格 + 20-30% ≤ 20 行核心代码（CLAUDE.md § 4） |
| 直接改 progress 节点 status 而忘 manifest.json | 状态双源不一致 | progress html / manifest.json 都改 |
| 完成节点忘 git commit | git log 失去节点边界 | 每节点完成立即 commit（不 push） |
| 跨 phase 抢跑 | 后续 Phase 的设计可能调整，抢跑工作被废 | 严格 M0→M1→M2→M3 |
| 替用户跑 `pnpm install` / `cargo build` | 用户失去构建过程感知 | 列命令；让用户本机跑 |
| broken link 进 commit | 文档导航失效 | commit 前跑 verify_doc_links.mjs |

---

## 12 · 当一切顺利

完成 M3 全部节点 + v1.0.0 GitHub Release 上线 = 项目核心目标达成。
之后进入 D（v1.1+ Distribution）滚动发布期 ── 5 节点弹性独立，无强串行。
v2 / 大功能扩展 → 新建 `plan/06_*` + `spec/` 增章 + `progress/06_v2_*.html`。

**Stay narrow. Ship small. Don't predict the future.**
