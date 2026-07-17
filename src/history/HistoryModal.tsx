import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon } from '../components/icons';
import { ShortcutGlyph } from '../components/ShortcutGlyph';
import { history as historyApi } from '../ipc/commands';
import { formatError } from '../ipc/error';
import { useEditorStore } from '../store/editor';
import { useUiStore } from '../store/ui';
import type { HistoryRow } from '../types/commands';
import { HistoryDocumentList } from './HistoryDocumentList';
import { HistoryDocumentPreview } from './HistoryDocumentPreview';

const LIST_LIMIT = 80;

export function HistoryModal() {
  const { t, i18n } = useTranslation('history');
  const open = useUiStore((s) => s.historyModalOpen);
  const setOpen = useUiStore((s) => s.setHistoryModalOpen);
  const setContent = useEditorStore((s) => s.setContent);
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSeqRef = useRef(0);

  const load = useCallback(async () => {
    if (!open) return;
    const seq = ++loadSeqRef.current;
    setLoading(true);
    setError(null);
    try {
      const q = query.trim();
      const next = q
        ? await historyApi.search(q, LIST_LIMIT)
        : await historyApi.list({ limit: LIST_LIMIT, offset: 0 });
      if (seq !== loadSeqRef.current) return; // 更晚的请求已发出 → 丢弃这次陈旧结果
      setRows(next);
    } catch (cause) {
      if (seq !== loadSeqRef.current) return;
      setRows([]);
      setError(formatError(cause));
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  }, [open, query]);

  // 键入即搜：debounce 180ms + 上面的 seq 守卫，避免慢的旧请求覆盖新结果。
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (selectedId !== null && rows.some((row) => row.id === selectedId)) return;
    setSelectedId(rows[0]?.id ?? null);
  }, [rows, selectedId]);

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? rows[0] ?? null,
    [rows, selectedId],
  );

  const applyRow = useCallback(
    (row: HistoryRow) => {
      setContent(row.content);
      setOpen(false);
    },
    [setContent, setOpen],
  );

  useEffect(() => {
    if (!open || !selectedRow) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const isPrimaryEnter =
        event.key === 'Enter' &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey;
      if (!isPrimaryEnter) return;

      event.preventDefault();
      applyRow(selectedRow);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [applyRow, open, selectedRow]);

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

  const toggleStar = async (row: HistoryRow) => {
    setError(null);
    try {
      await historyApi.star(row.id, !row.starred);
      await load();
    } catch (cause) {
      setError(formatError(cause));
    }
  };

  const clearPlainRows = async () => {
    setError(null);
    try {
      await historyApi.clear();
      await load();
    } catch (cause) {
      setError(formatError(cause));
    }
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
          <div className="jsonita-history-header-actions">
            <button
              type="button"
              onClick={clearPlainRows}
              className="jsonita-history-clear-btn"
              title={t('clearNotice')}
            >
              {t('actions.clear')}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="jsonita-page-close"
              aria-label={t('actions.close')}
              title={t('actions.close')}
            >
              <ShortcutGlyph accelerator="Escape" decorative />
              <CloseIcon width={15} height={15} strokeWidth={1.85} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="jsonita-history-library">
          <aside className="jsonita-history-sidebar">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              autoFocus
              className="jsonita-history-search"
            />
            {loading ? (
              <div className="jsonita-history-feedback" role="status">{t('loading')}</div>
            ) : error ? (
              <div className="jsonita-history-feedback jsonita-history-feedback-error" role="alert">{error}</div>
            ) : rows.length === 0 ? (
              <div className="jsonita-history-feedback">{t('empty')}</div>
            ) : (
              <HistoryDocumentList
                rows={rows}
                selectedId={selectedRow?.id ?? null}
                locale={i18n.language}
                starredLabel={t('status.starred')}
                onSelect={setSelectedId}
              />
            )}
          </aside>
          <HistoryDocumentPreview
            row={error || loading ? null : selectedRow}
            locale={i18n.language}
            labels={{
              emptyPreview: t('emptyPreview'),
              openInEditor: t('actions.openInEditor'),
              star: t('actions.star'),
              unstar: t('actions.unstar'),
            }}
            onOpen={() => selectedRow && applyRow(selectedRow)}
            onStar={() => selectedRow && toggleStar(selectedRow)}
          />
        </div>
      </section>
    </div>
  );
}
