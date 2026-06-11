PLAN · 章节 00

# 项目概览

Jsonita 是什么，这份文档是什么，以及怎么读。

## A一句话

Jsonita 是一款常驻 macOS 菜单栏、按全局快捷键瞬时呼出的极轻量 JSON 工具集，做完即走，几乎不占内存。

## B三句

一个浮窗，做完即关

JSON 全套能力（格式 / 树 / 互转 / AI 修复）

默认本地，AI 可选

## C设计约束（Constraints & Must-have）

### Must Have · 必须

可安装

保存历史，可找回上次

浮窗自动隐藏

快捷键可自定义

数据全本地

AI 可关,没 key 也能用

够轻够快

### Must Not · 禁止

不联网

不强制使用 AI

不长成 Postman

API key 不外泄

不强制 UI 行为

不做无撤销破坏

不做 v2 范围

## D文档权威边界

`design/` 是 UI、视觉、交互、原型和可访问性材料的唯一目录。产品范围以 [plan/01](01_features.md) 为准，交互流程以 [design/02_interaction.md](../design/02_interaction.md) 为准，视觉、组件、数据契约分别以 [design/01_mockups.md](../design/01_mockups.md)、[design/04_components.md](../design/04_components.md)、[spec/13_schemas.md](../spec/13_schemas.md) 为准。

历史视觉探索已迁移为 Markdown 并保留在 `design/` 下；实现任务应读取 [design/README.md](../design/README.md) 后再进入具体设计文档。未决问题进入 [TODO.md](../TODO.md)，结构化变更进入 [CHANGELIST.md](../CHANGELIST.md)。
