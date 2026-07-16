import { StarIcon } from '../components/icons';
import type { HistoryRow } from '../types/commands';
import { compactJson, formatHistoryBytes, formatHistoryDate } from './historyPresentation';

type HistoryDocumentListProps = {
  rows: HistoryRow[];
  selectedId: number | null;
  locale: string;
  starredLabel: string;
  onSelect: (id: number) => void;
};

export function HistoryDocumentList({ rows, selectedId, locale, starredLabel, onSelect }: HistoryDocumentListProps) {
  return (
    <div className="jsonita-history-document-list" role="listbox" aria-label="JSON history">
      {rows.map((row) => {
        const selected = row.id === selectedId;
        const snippet = compactJson(row.content);
        const date = formatHistoryDate(row.createdAt, locale);
        const bytes = formatHistoryBytes(row.content);

        return (
          <button
            key={row.id}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={snippet}
            className={`jsonita-history-document-row${selected ? ' jsonita-history-document-row-selected' : ''}`}
            onClick={() => onSelect(row.id)}
          >
            <span className="jsonita-history-document-snippet">{snippet}</span>
            <span className="jsonita-history-document-meta">
              {row.starred ? <StarIcon width={12} height={12} strokeWidth={1.75} aria-label={starredLabel} /> : null}
              <time dateTime={new Date(row.createdAt).toISOString()}>{`${date} · ${bytes}`}</time>
            </span>
          </button>
        );
      })}
    </div>
  );
}
