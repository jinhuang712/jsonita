import { useEffect, useMemo, useState } from 'react';
import { nodeCopyText, pathToString } from './jsonpath';

/**
 * JSON 树视图 — 自渲染递归节点，避免第三方默认样式破坏主题。
 *
 * 视觉锚：spec/01_mockups.html § 1.3 Tree Tab + § 12 Hover 复制
 * Spec ref: spec/08 § 4 JSON 树
 */

interface Props {
  data: unknown;
  initialExpandDepth?: number;
}

type PathSegment = string | number;

interface TreeNodeProps {
  value: unknown;
  path: PathSegment[];
  label?: string | number;
  expandedKeys: Set<string>;
  copiedKey: string | null;
  toggle: (key: string) => void;
  copyText: (key: string, text: string) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isContainer(value: unknown): value is Record<string, unknown> | unknown[] {
  return Array.isArray(value) || isRecord(value);
}

function pathKey(path: PathSegment[]): string {
  return JSON.stringify(path);
}

function buildDefaultExpanded(
  value: unknown,
  maxDepth: number,
  path: PathSegment[] = [],
  out = new Set<string>(),
): Set<string> {
  if (!isContainer(value) || path.length >= maxDepth) return out;
  out.add(pathKey(path));
  const entries = Array.isArray(value)
    ? value.map((child, index) => [index, child] as const)
    : Object.entries(value);
  for (const [key, child] of entries) {
    buildDefaultExpanded(child, maxDepth, [...path, key], out);
  }
  return out;
}

function containerSummary(value: Record<string, unknown> | unknown[]): string {
  if (Array.isArray(value)) return `[${value.length}]`;
  return `{${Object.keys(value).length}}`;
}

function renderPrimitive(value: unknown) {
  if (typeof value === 'string') {
    return <span className="jsonita-tree-string">{JSON.stringify(value)}</span>;
  }
  if (typeof value === 'number') {
    return <span className="jsonita-tree-number">{String(value)}</span>;
  }
  if (typeof value === 'boolean') {
    return <span className="jsonita-tree-bool">{String(value)}</span>;
  }
  if (value === null) {
    return <span className="jsonita-tree-null">null</span>;
  }
  return <span className="jsonita-tree-other">{String(value)}</span>;
}

function copyWithFallback(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  return fallbackCopy(text);
}

function fallbackCopy(text: string): Promise<void> {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
  return Promise.resolve();
}

function TreeNode({
  value,
  path,
  label,
  expandedKeys,
  copiedKey,
  toggle,
  copyText,
}: TreeNodeProps) {
  const key = pathKey(path);
  const isBranch = isContainer(value);
  const expanded = expandedKeys.has(key);
  const copyLabel = copiedKey === key ? 'copied' : 'copy';

  const onCopyNode = () => copyText(key, nodeCopyText(value));
  const onCopyPath = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    copyText(`${key}:path`, pathToString(path));
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      onCopyNode();
    }
  };

  const children = isBranch
    ? Array.isArray(value)
      ? value.map((child, index) => [index, child] as const)
      : Object.entries(value)
    : [];

  return (
    <div className="jsonita-tree-item">
      <div
        className="jsonita-tree-node"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {isBranch ? (
          <button
            type="button"
            className="jsonita-tree-toggle"
            aria-label={expanded ? 'Collapse node' : 'Expand node'}
            onClick={() => toggle(key)}
          >
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="jsonita-tree-toggle jsonita-tree-toggle-placeholder" />
        )}

        {label !== undefined ? (
          <>
            <button
              type="button"
              className={typeof label === 'number' ? 'jsonita-tree-index' : 'jsonita-tree-key'}
              title={`Copy path ${pathToString(path)}`}
              onClick={onCopyPath}
            >
              {typeof label === 'number' ? `[${label}]` : label}
            </button>
            <span className="jsonita-tree-punc">: </span>
          </>
        ) : null}

        {isBranch ? (
          <span className="jsonita-tree-punc">{containerSummary(value)}</span>
        ) : (
          renderPrimitive(value)
        )}

        <button
          type="button"
          className="tree-copy-icon"
          title="Copy node value"
          onClick={onCopyNode}
        >
          {copyLabel}
        </button>
      </div>

      {isBranch && expanded ? (
        <div className="jsonita-tree-children">
          {children.map(([childLabel, childValue]) => (
            <TreeNode
              key={String(childLabel)}
              value={childValue}
              path={[...path, childLabel]}
              label={childLabel}
              expandedKeys={expandedKeys}
              copiedKey={copiedKey}
              toggle={toggle}
              copyText={copyText}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TreeView({ data, initialExpandDepth = 2 }: Props) {
  const defaultExpanded = useMemo(
    () => buildDefaultExpanded(data, initialExpandDepth),
    [data, initialExpandDepth],
  );
  const [expandedKeys, setExpandedKeys] = useState(defaultExpanded);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    setExpandedKeys(defaultExpanded);
  }, [defaultExpanded]);

  const toggle = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const copyText = (key: string, text: string) => {
    copyWithFallback(text).then(() => {
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 900);
    });
  };

  return (
    <div className="jsonita-tree-container">
      <TreeNode
        value={data}
        path={[]}
        expandedKeys={expandedKeys}
        copiedKey={copiedKey}
        toggle={toggle}
        copyText={copyText}
      />
    </div>
  );
}
