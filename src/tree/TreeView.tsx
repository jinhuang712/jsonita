import { useEffect, useMemo, useRef, useState } from 'react';
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
  activeCopyKey: string | null;
  copiedKey: string | null;
  selectedKey: string | null;
  toggle: (key: string) => void;
  setActiveCopyKey: (key: string | null) => void;
  clearCopiedKey: (key?: string) => void;
  copyText: (text: string, feedbackKey: string | null) => void;
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
  activeCopyKey,
  copiedKey,
  selectedKey,
  toggle,
  setActiveCopyKey,
  clearCopiedKey,
  copyText,
}: TreeNodeProps) {
  const key = pathKey(path);
  const isBranch = isContainer(value);
  const expanded = expandedKeys.has(key);
  const isCopyVisible = activeCopyKey === key;
  const isSelected = selectedKey === key;
  const copyLabel = copiedKey === key ? 'copied' : 'copy';

  const activateCopy = () => {
    setActiveCopyKey(key);
    if (copiedKey !== null && copiedKey !== key) clearCopiedKey();
  };
  const deactivateCopy = () => {
    setActiveCopyKey(null);
    clearCopiedKey(key);
  };

  const onCopyNode = () => copyText(nodeCopyText(value), key);
  const onCopyPath = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    copyText(pathToString(path), null);
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      event.stopPropagation();
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
        className={['jsonita-tree-node', isSelected ? 'jsonita-tree-node-selected' : '']
          .filter(Boolean)
          .join(' ')}
        tabIndex={0}
        onMouseEnter={activateCopy}
        onMouseLeave={deactivateCopy}
        onFocus={activateCopy}
        onBlur={(event) => {
          const nextFocus = event.relatedTarget;
          if (!(nextFocus instanceof Node) || !event.currentTarget.contains(nextFocus)) {
            deactivateCopy();
          }
        }}
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
          className={[
            'tree-copy-icon',
            isCopyVisible ? 'tree-copy-icon-visible' : '',
            copiedKey === key ? 'tree-copy-icon-copied' : '',
          ].filter(Boolean).join(' ')}
          title="Copy node value"
          onClick={(event) => {
            event.stopPropagation();
            onCopyNode();
          }}
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
              activeCopyKey={activeCopyKey}
              copiedKey={copiedKey}
              selectedKey={selectedKey}
              toggle={toggle}
              setActiveCopyKey={setActiveCopyKey}
              clearCopiedKey={clearCopiedKey}
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
  const [activeCopyKey, setActiveCopyKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const activeCopyKeyRef = useRef<string | null>(null);
  const copyFeedbackTimerRef = useRef<number | null>(null);

  const updateActiveCopyKey = (key: string | null) => {
    activeCopyKeyRef.current = key;
    setActiveCopyKey(key);
  };

  useEffect(() => {
    setExpandedKeys(defaultExpanded);
    updateActiveCopyKey(null);
    setCopiedKey(null);
    setSelectedKey(null);
    // defaultExpanded changes only when data / initial depth changes; reset tree UI state with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultExpanded]);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current !== null) {
        window.clearTimeout(copyFeedbackTimerRef.current);
      }
    };
  }, []);

  const toggle = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearCopiedKey = (key?: string) => {
    setCopiedKey((current) => (key === undefined || current === key ? null : current));
  };

  const copyText = (text: string, feedbackKey: string | null) => {
    copyWithFallback(text).then(() => {
      if (feedbackKey === null) return;
      if (activeCopyKeyRef.current !== feedbackKey) return;
      if (copyFeedbackTimerRef.current !== null) {
        window.clearTimeout(copyFeedbackTimerRef.current);
      }
      setCopiedKey(feedbackKey);
      copyFeedbackTimerRef.current = window.setTimeout(() => {
        setCopiedKey((current) => (current === feedbackKey ? null : current));
      }, 900);
    });
  };

  return (
    <div
      className="jsonita-tree-container"
      tabIndex={0}
      onKeyDownCapture={(event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
          event.preventDefault();
          event.stopPropagation();
          window.getSelection()?.removeAllRanges();
          setSelectedKey(pathKey([]));
          return;
        }
        if (
          selectedKey === pathKey([]) &&
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === 'c'
        ) {
          event.preventDefault();
          event.stopPropagation();
          copyText(nodeCopyText(data), null);
        }
      }}
      onMouseDown={() => {
        window.getSelection()?.removeAllRanges();
        setSelectedKey(null);
      }}
      onMouseLeave={() => {
        updateActiveCopyKey(null);
        clearCopiedKey();
      }}
    >
      <TreeNode
        value={data}
        path={[]}
        expandedKeys={expandedKeys}
        activeCopyKey={activeCopyKey}
        copiedKey={copiedKey}
        selectedKey={selectedKey}
        toggle={toggle}
        setActiveCopyKey={updateActiveCopyKey}
        clearCopiedKey={clearCopiedKey}
        copyText={copyText}
      />
    </div>
  );
}
