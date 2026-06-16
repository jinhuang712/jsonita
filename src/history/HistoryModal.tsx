import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon } from '../components/icons';
import { history as historyApi } from '../ipc/commands';
import { useEditorStore } from '../store/editor';
import { useUiStore } from '../store/ui';
import type { HistoryRow } from '../types/commands';
import type { OpType } from '../types/enums';

type Filter = 'all' | 'pinned' | 'starred';

const LIST_LIMIT = 80;

export function HistoryModal() {
  const { t } = useTranslation('history');
  const open = useUiStore((s) => s.historyModalOpen);
  const setOpen = useUiStore((s) => s.setHistoryModalOpen);
  const setContent = useEditorStore((s) => s.setContent);
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError(null);
    try {
      const q = query.trim();
      if (q) {
        const next = await historyApi.search(q, LIST_LIMIT);
        setRows(applyFilter(next, filter));
      } else {
        setRows(
          await historyApi.list({
            limit: LIST_LIMIT,
            offset: 0,
            onlyPinned: filter === 'pinned' ? true : undefined,
            onlyStarred: filter === 'starred' ? true : undefined,
          }),
        );
      }
    } catch (e) {
      setRows([]);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [filter, open, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, setOpen]);

  const applyRow = (row: HistoryRow) => {
    setContent(row.content);
    setOpen(false);
  };

  const togglePin = async (row: HistoryRow) => {
    await historyApi.pin(row.id, !row.pinned);
    await load();
  };

  const toggleStar = async (row: HistoryRow) => {
    await historyApi.star(row.id, !row.starred);
    await load();
  };

  const clearPlainRows = async () => {
    await historyApi.clear();
    await load();
  };

  const title = useMemo(() => {
    const suffix = rows.length > 0 ? ` (${rows.length})` : '';
    return `${t('title')}${suffix}`;
  }, [rows.length, t]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
      className="jsonita-page jsonita-history-page"
    >
      <section className="jsonita-history-shell">
        <header className="jsonita-history-header">
          <div id="history-modal-title" className="jsonita-history-title">
            {title}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="jsonita-page-close"
            aria-label={t('actions.close')}
            title={t('actions.close')}
          >
            <kbd aria-hidden="true">Esc</kbd>
            <CloseIcon width={15} height={15} strokeWidth={1.85} aria-hidden="true" />
          </button>
        </header>

        <div className="jsonita-history-toolbar">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            autoFocus
            className="jsonita-history-search"
          />
          <div className="jsonita-history-filter-group">
            {(['all', 'pinned', 'starred'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                style={filter === item ? filterActiveStyle : filterButtonStyle}
              >
                {t(`filter.${item}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="jsonita-history-list">
          {loading ? (
            <div style={emptyStyle}>Loading…</div>
          ) : error ? (
            <div style={{ ...emptyStyle, color: 'var(--danger)' }}>{error}</div>
          ) : rows.length === 0 ? (
            <div style={emptyStyle}>{t('empty')}</div>
          ) : (
            rows.map((row) => (
              <HistoryItem
                key={row.id}
                row={row}
                onApply={() => applyRow(row)}
                onPin={() => togglePin(row)}
                onStar={() => toggleStar(row)}
              />
            ))
          )}
        </div>

        <footer className="jsonita-history-footer">
          <div className="jsonita-history-footer-note">
            Pinned and starred items stay when clearing.
          </div>
          <button type="button" onClick={clearPlainRows} style={clearButtonStyle}>
            Clear
          </button>
        </footer>
      </section>
    </div>
  );
}

function HistoryItem({
  row,
  onApply,
  onPin,
  onStar,
}: {
  row: HistoryRow;
  onApply: () => void;
  onPin: () => void;
  onStar: () => void;
}) {
  const op = opMeta(row.opType);
  return (
    <article style={itemStyle}>
      <button
        type="button"
        onClick={onApply}
        onDoubleClick={onApply}
        style={itemMainStyle}
        className="jsonita-history-item-main"
      >
        <div style={itemMetaStyle}>
          <span style={{ ...chipStyle, color: op.color, background: op.bg }}>{op.label}</span>
          <span style={timeStyle}>
            {row.pinned ? 'Pinned · ' : ''}
            {row.starred ? 'Starred · ' : ''}
            {formatRelativeTime(row.createdAt)}
          </span>
        </div>
        <div style={summaryStyle}>{row.summary || compact(row.content)}</div>
      </button>
      <div style={actionsStyle}>
        <button type="button" onClick={onPin} title={row.pinned ? 'Unpin' : 'Pin'} style={row.pinned ? actionActiveStyle : actionStyle}>
          Pin
        </button>
        <button type="button" onClick={onStar} title={row.starred ? 'Unstar' : 'Star'} style={row.starred ? actionActiveStyle : actionStyle}>
          Star
        </button>
      </div>
    </article>
  );
}

function applyFilter(rows: HistoryRow[], filter: Filter): HistoryRow[] {
  if (filter === 'pinned') return rows.filter((row) => row.pinned);
  if (filter === 'starred') return rows.filter((row) => row.starred);
  return rows;
}

function compact(content: string): string {
  return content.trim().replace(/\s+/g, ' ').slice(0, 100);
}

function formatRelativeTime(createdAt: number): string {
  const deltaMs = Date.now() - createdAt;
  const seconds = Math.max(1, Math.floor(deltaMs / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(createdAt).toLocaleDateString();
}

function opMeta(opType: OpType): { label: string; color: string; bg: string } {
  switch (opType) {
    case 'ai-fix':
      return { label: 'AI FIX', color: 'var(--op-ai-fix)', bg: 'var(--op-ai-fix-bg)' };
    case 'minify':
      return { label: 'MINIFY', color: 'var(--op-format)', bg: 'var(--op-format-bg)' };
    case 'json-to-str':
      return { label: 'TO STR', color: 'var(--op-convert)', bg: 'var(--op-convert-bg)' };
    case 'str-to-json':
      return { label: 'TO JSON', color: 'var(--op-convert)', bg: 'var(--op-convert-bg)' };
    case 'tree':
      return { label: 'TREE', color: 'var(--op-tree)', bg: 'var(--op-tree-bg)' };
    case 'format':
    default:
      return { label: 'FORMAT', color: 'var(--op-format)', bg: 'var(--op-format-bg)' };
  }
}

const filterButtonStyle: React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--control-border)',
  background: 'var(--control-bg)',
  color: 'var(--text-muted)',
  fontSize: 'var(--fs-xs)',
  cursor: 'pointer',
};

const filterActiveStyle: React.CSSProperties = {
  ...filterButtonStyle,
  border: '1px solid var(--primary-edge)',
  background: 'var(--control-bg-active)',
  color: 'color-mix(in srgb, var(--primary) 72%, var(--text))',
  fontWeight: 600,
};

const emptyStyle: React.CSSProperties = {
  padding: 24,
  textAlign: 'center',
  color: 'var(--text-muted)',
  fontSize: 'var(--fs-sm)',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  position: 'relative',
  borderBottom: '1px solid var(--border)',
};

const itemMainStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '10px 12px',
  border: 'none',
  borderLeft: '2px solid transparent',
  background: 'transparent',
  color: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  transition:
    'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
};

const itemMetaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  marginBottom: 5,
};

const chipStyle: React.CSSProperties = {
  padding: '2px 6px',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'calc(var(--fs-xs) - 1px)',
  fontFamily: 'var(--font-mono)',
  fontWeight: 700,
  letterSpacing: 0,
};

const timeStyle: React.CSSProperties = {
  color: 'var(--text-faint)',
  fontSize: 'var(--fs-xs)',
  whiteSpace: 'nowrap',
};

const summaryStyle: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-sm)',
  color: 'var(--text)',
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '0 10px',
};

const actionStyle: React.CSSProperties = {
  padding: '4px 7px',
  border: '1px solid var(--control-border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--control-bg)',
  color: 'var(--text-muted)',
  fontSize: 'var(--fs-xs)',
  cursor: 'pointer',
};

const actionActiveStyle: React.CSSProperties = {
  ...actionStyle,
  color: 'var(--primary)',
  border: '1px solid var(--primary-edge)',
  background: 'var(--control-bg-active)',
  fontWeight: 600,
};

const clearButtonStyle: React.CSSProperties = {
  padding: '4px 9px',
  border: '1px solid var(--control-border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--control-bg)',
  color: 'var(--text)',
  fontSize: 'var(--fs-xs)',
  cursor: 'pointer',
};
