# M0-N7 · dmg 本地构建（无签名） + CI 雏形

## Goal

完整填写 `tauri.conf.json` 的 bundle 段；写 `entitlements.plist`；本地 `pnpm tauri build` 产出 universal `Jsonita.dmg`（含 arm64 + x86_64）；双击能装入 `/Applications`；首次启动经 Gatekeeper（无签名 → 右键打开放行）。CI 雏形 `.github/workflows/ci.yml`（cargo test / cargo build / pnpm tsc / pnpm lint 四项）。**不**做 macOS 签名 + 公证（留 M2-N6）。

## Context

- [`progress/01_m0_skeleton.html#m0-n7-dmg`](../01_m0_skeleton.html#m0-n7-dmg)
- [`spec/12_packaging.html`](../../spec/12_packaging.html) § 1 tauri.conf 关键字段 § 2 capabilities § 3 entitlements § 4 构建命令 § 7 CI
- [`plan/04_nfr.html`](../../plan/04_nfr.html) § 6 安装体积 `< 15 MB`

## Write Scope

- `src-tauri/tauri.conf.json`（完整 bundle 段：`identifier` / `productName` / `category` / `minimumSystemVersion` / `bundle.targets` / `bundle.macOS.{frameworks,exceptionDomain,license,signingIdentity:null}`）
- `src-tauri/entitlements.plist`（`com.apple.security.app-sandbox=false` + `com.apple.security.network.client=true` + Hardened Runtime 准备）
- `src-tauri/Cargo.toml`（`[profile.release]` 加 `strip = true` · `lto = true` · `codegen-units = 1` 控制体积）
- `.github/workflows/ci.yml`（4 step：cargo test / cargo build / pnpm tsc / pnpm lint）

## Do Not Touch

- macOS 签名 (`signingIdentity`) → M2-N6
- 公证 (`notarytool`) → M2-N6
- 自动更新插件 (`tauri-plugin-updater`) → D-N3
- Windows 构建配置 → M3-N5 / D-N4
- 体积优化进入第二轮（lto = "fat" / dropping deps） → 仅当本节点跑出 dmg > 15 MB 时再做

## Deliverables

- [x] `pnpm tauri build --target universal-apple-darwin` 成功产出 `src-tauri/target/universal-apple-darwin/release/bundle/dmg/Jsonita_0.3.0-m0_universal.dmg`
- [x] dmg 体积 < 15 MB（NFR § 6）
- [x] 干净 macOS 账号双击 dmg → 拖入 `/Applications` → 启动经 Gatekeeper 警告（右键打开放行后正常）
- [x] 启动后菜单栏 icon / 浮窗 / 快捷键 / 日志全部走通（即 M0-A1..A13 全过）
- [x] CI workflow 在 GitHub Actions 上：`cargo test` / `cargo build --release` / `pnpm tsc --noEmit` / `pnpm lint` 四项绿
- [x] 完成本节点 = M0 全部 7 节点完成 → `git tag 0.3.0-m0`（不主动 push）

## Verification

```bash
# 1. universal target 准备
rustup target add x86_64-apple-darwin aarch64-apple-darwin

# 2. 本地构建（用户本机跑 ── CLAUDE.md § 2.3 禁 agent 代跑实际 build）
pnpm tauri build --target universal-apple-darwin

# 3. dmg 体积
du -h src-tauri/target/universal-apple-darwin/release/bundle/dmg/*.dmg
# 应 < 15 MB

# 4. 安装 + 启动
open src-tauri/target/universal-apple-darwin/release/bundle/dmg/Jsonita_*.dmg
# 拖到 Applications；首次启动右键 → 打开（无签名要 bypass Gatekeeper）

# 5. 回归 M0-A1..A13 全 13 个用例（progress/01 § acceptance 表）
# 在 Verification Log 中记录通过情况

# 6. CI 触发
git push  # ── 仅当用户明确同意（CLAUDE.md § 1.5 不主动 push）
# 看 GitHub Actions 4 项绿

# 7. Phase 收口
git tag 0.3.0-m0   # 完成 M0
```

## Acceptance Mapping

- M0-A1 / A2 dmg 装入 + 启动性能
- E1 / E7 退出条件全部对应

## Stop And Ask / Update Spec When

- dmg 体积 > 15 MB → **先尝试** profile.release 调优；若仍超 → 报告用户决策（修改 NFR 上限 vs 砍依赖）
- universal target 失败（如某 crate 不支持 x86_64） → 退回 arm64-only 并问用户是否接受
- minimumSystemVersion 选 macOS 11 vs 12 → 用户决策（spec/12 § 1 已锁 11，但 M0-N3 cocoa API 行为可能要求抬高）

## Notes

- universal binary 体积 ~ 2× arm64-only ── `strip = true` + `lto = true` 是 spec/12 § 4.2 锁定的优化
- dmg 文件命名 Tauri 默认 `Jsonita_<version>_universal.dmg` ── 不要改默认（影响后续 brew formula / updater latest.json）
- 首次启动 Gatekeeper 警告**正常**（无签名）── 用户右键打开放行；M2-N6 公证后不再警告
- CI workflow secrets：M0 阶段 0 secrets 需要；签名 secrets 留 M2-N6 时加
- 完成后 commit：`chore(m0-n7): local dmg build + ci skeleton`
- M0 全部 7 节点完成后：`git tag 0.3.0-m0`（不 push）+ 切 progress/01 状态 `active` → `completed` + 切 progress/02 `planned` → `active`
