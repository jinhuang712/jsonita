# 编辑器 & 树 UI

CodeMirror 6 集成 · JSON 树渲染 · 错误标注 · 状态栏联动 · light/dark theme extension。

## 1 编辑器 ── CodeMirror 6

### 1.1 包依赖（package.json）

```
{
  "dependencies": {
    "@codemirror/state":       "^6.5.0",
    "@codemirror/view":        "^6.34.0",
    "@codemirror/lang-json":   "^6.0.1",
    "@codemirror/language":    "^6.10.0",
    "@codemirror/commands":    "^6.7.0",
    "@codemirror/search":      "^6.5.0",
    "@codemirror/lint":        "^6.8.0",
    "@codemirror/autocomplete":"^6.18.0",
    "@replit/codemirror-indentation-markers": "^6.5.3"
  }
}
```

### 1.2 扩展清单（必装）

| 扩展 | 来源 | 用途 |
| --- | --- | --- |
| lineNumbers | @codemirror/view | 行号 gutter |
| highlightActiveLine / highlightActiveLineGutter | @codemirror/view | 当前行高亮 |
| foldGutter / codeFolding | @codemirror/language | 大对象 / 大数组折叠 |
| bracketMatching | @codemirror/language | 光标在 { [ 时高亮配对的 } ] |
| closeBrackets | @codemirror/autocomplete | 自动补 { → } / [ → ] |
| history | @codemirror/commands | `⌘Z` /`⌘⇧Z` undo / redo |
| search | @codemirror/search | `⌘F` 搜索面板；使用 Jsonita 自定义 docked panel 和 toggle keymap |
| search line markers | @codemirror/view lineNumberMarkers | 搜索命中行在行号 gutter 内显示低饱和提示 |
| drawSelection | @codemirror/view | 多光标选区绘制 |
| EditorState.allowMultipleSelections | @codemirror/state | `⌘D` 多光标 |
| EditorView.lineWrapping | @codemirror/view | 软换行（不出水平滚动） |
| json (lang-json) | @codemirror/lang-json | JSON 语法高亮 |
| linter（自定义） | @codemirror/lint + serde 错误 | 错误位置标注 |
| indentationMarkers | @replit/codemirror-indentation-markers | 缩进引导竖线 |

### 1.3 扩展组装

```
// src/editor/extensions.ts
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter,
         drawSelection } from '@codemirror/view';
import { foldGutter, codeFolding, bracketMatching, defaultHighlightStyle,
         syntaxHighlighting } from '@codemirror/language';
import { closeBrackets } from '@codemirror/autocomplete';
import { history, defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';
import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { keymap } from '@codemirror/view';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter } from '@codemirror/lint';
import { indentationMarkers } from '@replit/codemirror-indentation-markers';
import { jsonitaLightTheme, jsonitaDarkTheme } from './theme';
import { jsonitaJsonHighlight } from './highlight';
import { externalLinter, supplementalJsonLinter } from './lint';
import { createJsonitaSearchPanel } from './searchPanel';
import { jsonitaSearchGutter } from './searchGutter';

export interface EditorConfig {
  theme: 'light' | 'dark';
  readOnly?: boolean;
  softWrap?: boolean;        // 默认 true
  placeholderText?: string;
  error?: EditorError | null; // Rust debounce parse error，用于精确红波浪线
  getExternalError?: () => EditorError | null;
}

export function makeExtensions(cfg: EditorConfig): Extension[] {
  const parseLinter = jsonParseLinter();

  return [
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    foldGutter(),
    codeFolding(),
    bracketMatching(),
    closeBrackets(),
    history(),
    drawSelection(),
    search({ top: true, createPanel: createJsonitaSearchPanel }),
    highlightSelectionMatches(),
    jsonitaSearchGutter,
    indentationMarkers({ thickness: 1, hideFirstIndent: true, colors: { light: 'var(--editor-indent-guide)' } }),
    EditorState.allowMultipleSelections.of(true),
    cfg.softWrap !== false ? EditorView.lineWrapping : [],
    json(),
    linter((view) => (view.state.doc.toString().trim() === '' ? [] : parseLinter(view)), { delay: 300 }),
    supplementalJsonLinter(),
    externalLinter(cfg.getExternalError ?? (() => cfg.error ?? null)),
    lintGutter(),
    syntaxHighlighting(defaultHighlightStyle),
    jsonitaJsonHighlight,
    cfg.theme === 'dark' ? jsonitaDarkTheme : jsonitaLightTheme,
    cfg.readOnly ? EditorState.readOnly.of(true) : [],
    cfg.placeholderText ? placeholder(cfg.placeholderText) : [],
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap,
      indentWithTab,
    ]),
  ];
}
```

### 1.3.1 搜索面板契约

`⌘F` 打开的搜索 UI 不使用 CodeMirror 默认底部表单。Jsonita 使用 `search({ top: true, createPanel })` 提供自定义面板，面板 dock 在 TabBar 下方、编辑正文上方，参与布局，不覆盖任何 JSON 文本。`⌘F` 是 toggle：面板关闭时打开，面板打开时再次按下 `⌘F` 关闭；不定义 `⌘R` / `Cmd+R` replace 快捷键。

结构：

| 区域 | 内容 | 交互 |
| --- | --- | --- |
| Find row | `Find` label、搜索输入、`x / n` 计数、上一个/下一个、`Aa`、`.*`、`word`、`All`、关闭 | `Enter` 下一项，`Shift+Enter` 上一项，`Esc` 关闭。 |
| Shortcut | `⌘F` / `Cmd+F` | 关闭时打开搜索，打开时关闭搜索。 |
| Match highlight | 文本内 match 背景 | 使用低透明蓝灰 `--primary`，普通命中约 11% tint，当前命中约 18% tint；不使用高饱和黄/青/紫。 |
| Gutter hint | 行号 gutter 内弱竖线 | 普通命中为 2px 弱竖线，当前命中稍强但不加 glow；不能替换行号数字。 |

视觉边界：

- 搜索面板只用 `--surface-raised`、`--control-bg`、`--control-bg-hover`、`--control-bg-active`、`--control-border`、`--border`、`--text-muted` 等 token。
- 不使用大面积蓝色块，不使用高对比文字按钮；上一项/下一项用 `↑` / `↓`。
- 搜索面板只提供查找、导航、选择全部匹配与关闭；不得保留 replace row、replace button 或 replace 输入框。
- 搜索关闭后，文本 match 和 gutter hint 一起消失。
- 搜索 gutter 只表达“本行有搜索命中”，不能和 parse error 的 `--danger` marker 混淆。
- 搜索跳转使用居中滚动策略；当前命中不能贴在编辑区顶部或底部作为默认定位。

### 1.4 React 封装

```
// src/editor/Editor.tsx
import { useEffect, useRef } from 'react';
import { forceLinting, setDiagnostics } from '@codemirror/lint';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { makeExtensions, type EditorConfig } from './extensions';

interface EditorProps extends EditorConfig {
  value: string;
  onChange?: (v: string) => void;
  onErrorChange?: (err: EditorError | null) => void;
  errorMarker?: EditorError;             // 外部塞入"我已知错误位置"
}

export interface EditorError { line: number; col: number; msg: string; }

export function Editor({ value, onChange, onErrorChange, theme, ...cfg }: EditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const errorRef = useRef(cfg.error ?? null);

  errorRef.current = cfg.error ?? null;

  useEffect(() => {
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) onChange?.(update.state.doc.toString());
    });

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          ...makeExtensions({
            theme,
            readOnly: cfg.readOnly,
            softWrap: cfg.softWrap,
            placeholderText: cfg.placeholderText,
            getExternalError: () => errorRef.current,
          }),
          updateListener,
        ],
      }),
      parent: ref.current!,
    });
    viewRef.current = view;
    return () => view.destroy();
    // theme / config 变化时重建；parse error 变化只刷新 lint，不重建。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, cfg.readOnly, cfg.softWrap, cfg.placeholderText]);

  useEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    if (!cfg.error) v.dispatch(setDiagnostics(v.state, []));
    forceLinting(v);
  }, [cfg.error]);

  // 外部 setValue（用于 AI Fix 应用 / 历史恢复 / 上次会话恢复）
  useEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    if (v.state.doc.toString() === value) return;
    v.dispatch({
      changes: { from: 0, to: v.state.doc.length, insert: value },
    });
  }, [value]);

  return <div ref={ref} className="jsonita-editor" />;
}
```

生命周期契约： `cfg.error` 是 lint 数据，不是 EditorView 生命周期配置。输入半截 JSON 时 debounce parse 会频繁改变错误位置；这只能触发 `forceLinting(view)` 刷新红线，不能销毁 / 重建 CodeMirror，否则会打断连续输入、焦点、光标和输入法上下文。 `value` /`cfg.error` 变化后需要立即并在下一帧再次 force lint；当 `cfg.error=null` 时先 `setDiagnostics([])`，清掉 CodeMirror 在 doc change 映射阶段保留的旧 diagnostics / lint gutter marker。

### 1.5 Light theme extension

```
// src/editor/theme.ts
import { EditorView } from '@codemirror/view';

export const jsonitaLightTheme = EditorView.theme({
  '&': {
    color:           'var(--text)',
    backgroundColor: 'var(--editor-bg)',
    fontSize:        'var(--fs-editor)',
    fontFamily:      'var(--font-mono)',
    height:          '100%',
  },
  '.cm-content': {
    caretColor: 'var(--editor-cursor)',
    padding:    'var(--sp-3) 0',
    fontFamily: 'var(--font-mono)',
    lineHeight: 'var(--lh-code)',
  },
  '.cm-line': {
    lineHeight: 'var(--lh-code)',
  },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--editor-cursor)' },
  '&.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--editor-selection)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--editor-gutter)',
    color:           'var(--text-faint)',
    border:          'none',
    fontFamily:      'var(--font-mono)',
    fontSize:        'var(--fs-editor)',
    lineHeight:      'var(--lh-code)',
  },
  '.cm-gutterElement': {
    lineHeight: 'var(--lh-code)',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    minWidth: '2.4ch',
    padding:  '0 var(--sp-2)',
    textAlign: 'right',
  },
  '.cm-activeLineGutter, .cm-activeLine': {
    backgroundColor: 'var(--editor-line-active)',
  },
  '.cm-foldPlaceholder': {
    color:           'var(--text-faint)',
    backgroundColor: 'transparent',
    border:          'none',
    fontSize:        '11px',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'var(--editor-bracket-match)',
    outline:         '1px solid var(--primary-edge)',
  },
  '.cm-searchMatch': {
    backgroundColor: 'color-mix(in srgb, var(--primary) 14%, transparent)',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: 'color-mix(in srgb, var(--primary) 24%, transparent)',
  },
  '.cm-lintRange-error': {
    backgroundImage:
      'linear-gradient(to top right, transparent calc(50% - 1px), var(--editor-error-underline) calc(50% - 1px), var(--editor-error-underline) calc(50% + 1px), transparent calc(50% + 1px))',
    backgroundRepeat: 'repeat-x',
    backgroundPosition: 'bottom',
    backgroundSize: '6px 2px',
  },
}, { dark: false });
```

### 1.6 Dark theme extension

```
// 同结构，颜色用 dark variant（[data-theme="dark"] 已切换 token 值）
export const jsonitaDarkTheme = EditorView.theme({ /* same selectors */ }, { dark: true });
```

实现简化： 所有选择器只取 CSS variables，不写死 hex。 `data-theme` 切换时整个 token table 跟着变 ── 编辑器主题不需要"内部双套"。但 CM 的 `dark: true/false` flag 影响默认 highlightStyle 选择，必须切，所以我们仍需要两个 instance。

对齐契约： `.cm-line`、 `.cm-gutters`、 `.cm-gutterElement` 必须共用 `--fs-editor` 与 `--lh-code`。当前行正文背景与 `.cm-activeLineGutter` 在 y / height 上必须一致；任何字号缩放都不能只作用于正文而漏掉 line number gutter。

搜索 gutter 契约：`.cm-lineNumbers .cm-gutterElement.jsonita-search-line-number::before` 只画低饱和细竖线；`jsonita-search-line-number-active` 可略强，但仍不得超过 parse error marker 的视觉强度。行号数字必须保留。

### 1.7 自定义 JSON 高亮风格

```
// src/editor/highlight.ts
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

const style = HighlightStyle.define([
  { tag: t.propertyName,                   color: 'var(--json-key)' },
  { tag: t.string,                         color: 'var(--json-string)' },
  { tag: t.number,                         color: 'var(--json-number)' },
  { tag: [t.bool, t.atom],                 color: 'var(--json-bool)' },
  { tag: t.null,                           color: 'var(--json-null)' },
  { tag: [t.punctuation, t.separator, t.bracket], color: 'var(--json-punc)' },
]);

export const jsonitaJsonHighlight = syntaxHighlighting(style);
```

## 2 错误标注

### 2.1 三路 lint 源

CodeMirror 自带 `jsonParseLinter()` （来自 @codemirror/lang-json）── 300ms debounce 实时；空白 / 仅空白文档返回空 diagnostic，不显示错误红点

前端辅助检查 `supplementalJsonLinter()` ── parser 通常只停在第一个致命错误；辅助检查继续标出未加引号 key、单引号字符串、 `True` / `False` / `None` / `Null` / `undefined` 、 `//` 注释等常见非法 JSON token

Rust 后端 通过 IPC 返回的 `JsonitaError::Parse` （更精确，含 line/col）

### 2.2 合并策略

前端 linter 实时给 squiggle；辅助检查补充多个常见非法 token；用户提交（debounce 完成）后 Rust 返回更精确的位置并作为额外 diagnostic 合并，不覆盖辅助标注。

```
// src/editor/lint.ts
import { Diagnostic, linter } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';

export function supplementalJsonDiagnostics(doc: string): Diagnostic[] {
  // 轻量扫描：忽略字符串内部，标出 unquoted key / single-quoted string /
  // capitalized literal / line comment 等常见 JSON 非法写法。
}

// 把外部错误（Rust 返回）转 CM Diagnostic
export function externalErrorAsDiagnostic(
  doc: string,
  err: EditorError | null,
): Diagnostic[] {
  if (!err) return [];
  // line/col 转换为 doc 中的 offset
  const lines = doc.split(/\r?\n/);
  let from = 0;
  for (let i = 0; i < err.line - 1; i++) from += lines[i].length + 1;
  from += Math.max(0, err.col - 1);
  const lineText = lines[Math.max(0, err.line - 1)] ?? '';
  const colIndex = Math.max(0, err.col - 1);
  const tokenMatch = lineText.slice(colIndex).match(/^[^\s,}\]]+/);
  const tokenLength = tokenMatch?.[0]?.length ?? 1;
  const to = Math.min(doc.length, from + Math.max(1, tokenLength));
  return [{ from, to, severity: 'error', message: err.msg, source: 'jsonita-engine' }];
}

// 自定义 linter：从 store 读 externalError，merge 进 cm linter
export function externalLinter(getError: () => EditorError | null) {
  return linter((view) => externalErrorAsDiagnostic(view.state.doc.toString(), getError()),
                { delay: 0 });
}
```

## 3 状态栏联动

### 3.1 onChange → store → status

```
// src/store/editor.ts
import { create } from 'zustand';
import { jsonFormat } from '@/ipc/commands';

interface EditorStore {
  content:    string;
  outputText: string;
  status:     'valid' | 'error' | 'empty' | 'large';
  error:      EditorError | null;
  bytes:      number;
  lines:      number;

  setContent: (s: string) => void;
  // 内部：debounce 300 ms 后调 Rust 校验
}

export const editorStore = create<EditorStore>((set, get) => {
  let timer: number | null = null;

  async function validate() {
    const s = get().content;
    if (s.trim() === '') { set({ status: 'empty', error: null }); return; }
    if (s.length > 5 * 1024 * 1024) { set({ status: 'large' }); return; }
    try {
      const out = await jsonFormat(s, { indent: 'spaces2', sortKeys: false, trailingNewline: true });
      set({ status: 'valid', error: null, outputText: out,
            lines: out.split('\n').length, bytes: new Blob([out]).size });
    } catch (e: unknown) {
      const err = e as JsonitaError;
      if (err.kind === 'Parse') {
        set({ status: 'error',
              error: { line: err.data.line, col: err.data.col, msg: err.data.msg } });
      }
    }
  }

  return {
    content: '', outputText: '', status: 'empty', error: null, bytes: 0, lines: 0,
    setContent: (s) => {
      set({ content: s });
      if (timer !== null) clearTimeout(timer);
      timer = window.setTimeout(validate, 300);
    },
  };
});
```

## 4 JSON 树

### 4.1 渲染实现

`TreeView` 自渲染递归节点，不依赖第三方 Tree 默认样式。每个 node 行直接持有 `path` 与 `raw value`，用于 key path 复制、hover value/subtree 复制和键盘 `⌘C`。

```
// src/tree/TreeView.tsx
interface TreeViewProps {
  data: unknown;
  initialExpandDepth?: number;     // 默认 2（大对象 > 50 keys 时折叠到 2 层）
}

function TreeNode({ value, path, label }) {
  const isBranch = isContainer(value);
  return (
    <div className="jsonita-tree-node" tabIndex={0}>
      {isBranch ? <button className="jsonita-tree-toggle">▾</button> : <span />}
      {label !== undefined ? <button className="jsonita-tree-key">{label}</button> : null}
      {isBranch ? <span className="jsonita-tree-punc">{summary(value)}</span> : renderPrimitive(value)}
      <button className="tree-copy-icon">copy</button>
    </div>
  );
}
```

### 4.2 样式（global.css）

```
.jsonita-tree-container {
  font-family: var(--font-mono);
  font-size:   var(--fs-tree);
  line-height: var(--lh-code);
  padding:     var(--sp-3) var(--sp-4);
  background:  var(--editor-bg);
  color:       var(--text);
  height:      100%;
  overflow:    auto;
}
.jsonita-tree-node     { position: relative; display: flex; align-items: center; min-height: 1.8em; }
.jsonita-tree-node:hover { background: var(--surface-quiet); }
.jsonita-tree-key      { color: var(--json-key);    font-weight: 600; cursor: default; }
.jsonita-tree-string   { color: var(--json-string); }
.jsonita-tree-number   { color: var(--json-number); }
.jsonita-tree-bool     { color: var(--json-bool);   }
.jsonita-tree-null     { color: var(--json-null);   }
.jsonita-tree-punc     { color: var(--json-punc);   }
.jsonita-tree-toggle   { color: var(--text-faint);  cursor: pointer; }
.jsonita-tree-toggle:hover { color: color-mix(in srgb, var(--primary) 70%, var(--text-muted)); }
.jsonita-tree-children { padding-left: 16px;        border-left: 1px solid var(--editor-indent-guide); }
```

### 4.3 JSON Path 复制

点击 key 时计算从 root 到此 key 的路径，复制到剪贴板。

```
// src/tree/jsonpath.ts
//
// TreeNode 渲染时天然知道 path；点击 key 直接复制。
<button
  className="jsonita-tree-key"
  title={`Copy path ${pathToString(path)}`}
  onClick={() => copyText(pathToString(path))}
>
  {label}
</button>
```

### 4.4 搜索 / 高亮 key & value

v1 用 [04 § 5](04_components.md) 的 SplitPane 顶部加一个搜索框，client-side filter ── 把 JSON 序列化后 substring match，匹配命中的 path 自动展开（更新 `expandedKeys` ）。

### 4.5 Hover 复制节点（plan F2）

视觉：见 [design/01 § 1.3 Tree Tab](01_mockups.md) 的 hover 态。

触发与目标：

| node 类型 | 触发 | 复制内容 |
| --- | --- | --- |
| leaf · string | hover 整行 → 行尾出现描边 copy 图标 + `copy` 文案 | raw value 含引号： `"alice"` |
| leaf · number / bool / null | 同上 | 字面量： `30` /`true` /`null` |
| object node（含 root） | hover 标签行 → 标签行尾出现描边 copy 图标 + `copy` 文案 | 递归 pretty-print 子树 JSON（2 空格） |
| array node | 同上 | 同上 |

实现 ── 每行内置轻量 copy action，但只允许一个 active action：自渲染 `TreeNode` 已持有节点 path 与 raw value，不需要 DOM 注入。React 维护 `activeCopyKey` /`copiedKey`，确保父子节点 hover / focus 不会同时露出两个 copy action；鼠标离开树或切到其他节点时立即清理 copied 反馈。copy action 无边框 / 无背景，hover 时不改变整行 cursor。

```
// src/tree/TreeView.tsx

interface NodeMeta { path: string; raw: unknown; isLeaf: boolean }

function computeCopyText(meta: NodeMeta): string {
  if (meta.isLeaf) {
    // raw value 处理
    if (typeof meta.raw === 'string')  return JSON.stringify(meta.raw);   // 自带引号
    if (meta.raw === null)             return 'null';
    return String(meta.raw);                                              // number / bool 字面量
  }
  // object / array → 递归 pretty
  return JSON.stringify(meta.raw, null, 2);
}

<button
  className={`tree-copy-icon ${activeCopyKey === key ? 'tree-copy-icon-visible' : ''}`}
  onClick={() => copyText(computeCopyText(meta))}
>
  copy
</button>
```

样式（global.css 新增）：

```
.jsonita-tree-node {
  position: relative;
}
.tree-copy-icon {
  position: absolute;
  top: 50%; right: 10px;
  opacity: 0;                          /* 默认隐 */
  transform: translateY(-50%);
  background: transparent;
  border: 0;
  padding: 0 2px;
  font-size: 11px;
  line-height: 1;
  cursor: default;
  transition:
    opacity var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}
.tree-copy-icon-visible { opacity: 1; }
.tree-copy-icon-copied {
  color: var(--primary);
}
.tree-copy-icon:hover {
  color: var(--primary);
}
.tree-copy-icon:active { color: var(--text); }
```

键盘可达：聚焦在某节点行（含 `tabindex="0"` ）按 `⌘C` 等同于点 copy action；Tree 容器内按 `⌘A` 选择 root / 整棵树，随后 `⌘C` 复制 root subtree。键盘焦点环用 `--shadow-focus`。应用 chrome 设置 `user-select: none` 并由全局 hotkey 拦截非编辑区 `⌘A`，避免 TabBar / StatusBar 被 DOM 选中。

与点击 key 复制 path 的关系：

点击 key 文字本身 → 复制 path（如 `user.name` ）── 现有行为保留

hover 行尾 copy action 点击 → 按本节规则复制 value / subtree

两者独立 ── key 可点 + 行 hover 可见 icon，不冲突

## 5 编辑器 ↔ 树 同步

Format / Tree / →Str 各 Tab 共用 input 编辑器；切换 Tab 时只是 切右侧输出面板。

| Tab | 左侧 | 右侧 |
| --- | --- | --- |
| Format | Editor (input) | Editor (output, readOnly) |
| Minify | Editor (input) | Editor (output, readOnly, lineWrapping=false) |
| Tree | Editor (input) | TreeView |
| →Str | Editor (input) | Editor (output, readOnly) |
| →JSON | Editor (input) | Editor (output, readOnly) |
| AI Fix | DiffView 左原 | DiffView 右改 |

### 5.1 单窗模式（F9）

单窗模式（ [plan/01 F9](../plan/01_features.md) ）下取消右侧面板，主区域只承载一个工作视图。后台 debounce 只以 Format 逻辑校验 JSON 合法性并更新状态栏；Format / Minify / →Str / →JSON 的实际转换由 `⌘Enter` 显式触发，成功后把结果 in-place 写回 input。Tree 是视图，合法 JSON 时直接整栏显示 `TreeView`，非法 / 空白时显示 Tree 状态面板，不显示 `⌘Enter` 提示。AI Fix 也是独立工作视图，进入 tab 后直接渲染 `AiFixPane` 并自动请求。

```
// src/shell/FloatingWindow.tsx
const { singlePaneMode } = useSettings();

return singlePaneMode
  ? '1fr'
  : '1fr 1fr';
```

关键：当前没有独立 `SinglePaneLayout.tsx`；实现由 `FloatingWindow` 隐藏右栏，并在 `singlePaneMode && activePane === 'tree'` 时把左栏内容替换为 `TreePanel`，在 `activePane === 'ai-fix'` 时替换为 `AiFixPane`。 `TreePanel` 只在 Tree tab 可见时解析当前输入，合法时渲染 `TreeView`，非法 / 空白时渲染状态面板；非 Tree tab 不做额外 `JSON.parse`。 `SinglePaneHint` 只在非 Tree / 非 AI Fix 功能显示右下角提示； `useGlobalHotkeys` 捕获非 Tree / 非 AI Fix 的 `⌘Enter` 并调用 `runPaneApply`。

```
// src/hooks/useGlobalHotkeys.ts (single-pane)
if (singlePaneMode && activePane !== 'tree' && event.metaKey && event.key === 'Enter') {
  const result = await runPaneApply(content, activePane, editorError);
  setContent(result);
  session_save_last({ content: result, opType: paneToOpType(activePane) });
}
```

## 6 编辑器配置项 → 设置面板映射

| 设置项 | 编辑器影响 |
| --- | --- |
| `settings.theme` | 切换 jsonitaLightTheme / jsonitaDarkTheme |
| F1 缩进选项 | 仅影响 Rust 端 format 输出；编辑器自身不区分 |
| 软换行（F1 编辑器交互） | EditorView.lineWrapping 开关 |

## 7 性能

大文件优化 ：CodeMirror 6 已是 viewport-based 渲染，1MB JSON 不需特殊处理

linter delay 300 ms ：避免输入时频繁报错

onChange debounce 300 ms ：debounce 在 store 内做，编辑器自身不 debounce（保持光标跟手）

树渲染懒加载 ：自渲染 TreeView 只递归渲染已展开分支，折叠子树不进入 DOM
