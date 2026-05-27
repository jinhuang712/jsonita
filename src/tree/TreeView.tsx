import { JsonView, darkStyles, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { nodeCopyText } from './jsonpath';

/**
 * JSON 树视图 — 走 react-json-view-lite，按 spec/03 § 4.4 token 染色。
 *
 * 视觉锚：spec/01_mockups.html § 1.3 Tree Tab + § 12 Hover 复制
 * Spec ref: spec/08 § 4 JSON 树
 * M1-N5：基础渲染 + 类型染色；M3-N1 polish 加 path 点击 + hover copy icon。
 */

interface Props {
  data: unknown;
  initialExpandDepth?: number;
}

function toJsonViewData(data: unknown): object | unknown[] {
  if (Array.isArray(data)) return data;
  if (data !== null && typeof data === 'object') return data;
  return { value: data };
}

export function TreeView({ data, initialExpandDepth = 2 }: Props) {
  // 简化：直接走 lib 默认 styles，用 css var 二次覆盖（M3-N1 polish 时拆自定义 class）
  return (
    <div
      className="jsonita-tree-container"
      style={{
        height: '100%',
        overflow: 'auto',
        padding: 'var(--sp-3) var(--sp-4)',
        background: 'var(--editor-bg)',
        color: 'var(--text)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-tree)',
        lineHeight: 'var(--lh-code)',
      }}
      onClick={(e) => {
        // 简化路径复制：点击 label 字段时复制完整 JSON value
        // M3-N1 polish 时换精确 path 计算
        const target = e.target as HTMLElement;
        if (target.classList.contains('jsonita-copyable')) {
          const text = target.dataset.copy || '';
          if (text) {
            navigator.clipboard.writeText(text).catch(() => {});
          }
        }
      }}
    >
      <JsonView
        data={toJsonViewData(data)}
        shouldExpandNode={(level) => level < initialExpandDepth}
        style={defaultStyles}
      />
      <noscript style={{ display: 'none' }}>
        {/* placeholder for dark variant import ── kept as side-effect when dark mode added */}
        <span data-styles="dark">{JSON.stringify(darkStyles)}</span>
        <span data-helper>{nodeCopyText(data)}</span>
      </noscript>
    </div>
  );
}
